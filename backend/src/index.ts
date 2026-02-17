import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeDatabase, closeDatabase } from './db'
import { userService } from './services/user.service'
import { enrollmentService } from './services/enrollment.service'
import { GamificationService } from './services/gamification.service'
import { TransactionService } from './services/transaction.service'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
let transactionService: TransactionService

// Middleware
app.use(express.json())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)

// ============= Health Check =============
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

// ============= USER ROUTES =============

app.post('/api/users/oauth', async (req: Request, res: Response) => {
  try {
    const { provider, providerUserId, profile } = req.body
    const user = await userService.getOrCreateUser(provider, providerUserId, profile)
    res.json(user)
  } catch (error) {
    console.error('OAuth user creation failed:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

app.get('/api/users/:userId', async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.userId)
    res.json(user)
  } catch (error) {
    res.status(404).json({ error: 'User not found' })
  }
})

app.get('/api/users/:userId/enrollments', async (req: Request, res: Response) => {
  try {
    const enrollments = await userService.getUserEnrollments(req.params.userId)
    res.json(enrollments)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollments' })
  }
})

// ============= ENROLLMENT ROUTES =============

app.post('/api/enrollments', async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body
    if (!userId || !courseId) {
      return res.status(400).json({ error: 'Missing userId or courseId' })
    }
    
    // Ensure user exists - create if doesn't exist
    let user
    try {
      user = await userService.getUserById(userId)
    } catch {
      // User doesn't exist, create with email as ID
      user = await userService.getOrCreateUser('local', userId, {
        email: userId,
        name: userId.split('@')[0],
      })
    }
    
    const enrollment = await enrollmentService.enrollCourse(user.id, courseId)
    console.log('✅ Enrollment successful:', { userId: user.id, courseId })
    res.json(enrollment)
  } catch (error) {
    console.error('❌ Enrollment failed:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to enroll' })
  }
})

app.post('/api/enrollments/complete-lesson', async (req: Request, res: Response) => {
  try {
    const { userId, courseId, lessonId, xpAmount } = req.body
    if (!userId || !courseId || !lessonId || !xpAmount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const result = await enrollmentService.completeLesson(userId, courseId, lessonId, xpAmount)
    res.json(result)
  } catch (error) {
    console.error('Lesson completion failed:', error)
    res.status(500).json({ error: 'Failed to complete lesson' })
  }
})

app.get('/api/progress/:userId', async (req: Request, res: Response) => {
  try {
    const progress = await enrollmentService.getUserProgress(req.params.userId)
    res.json(progress)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' })
  }
})

app.get('/api/gamification/:userId', async (req: Request, res: Response) => {
  try {
    const stats = await GamificationService.getStats(req.params.userId)
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gamification stats' })
  }
})

// ============= LEADERBOARD ROUTES =============

app.get('/api/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500)
    const leaderboard = await userService.getLeaderboard(limit)
    res.json(leaderboard)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

app.get('/api/leaderboard/rank/:userId', async (req: Request, res: Response) => {
  try {
    const rank = await userService.getUserRank(req.params.userId)
    res.json({ rank })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rank' })
  }
})

// ============= TRANSACTION ROUTES =============

app.post('/api/transaction/complete-lesson', async (req: Request, res: Response) => {
  try {
    const { userId, courseId, lessonIndex, xpAmount } = req.body
    if (!userId || !courseId || lessonIndex === undefined || !xpAmount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const signedTx = await transactionService.completeLessonTX({
      userId,
      courseId,
      lessonIndex,
      xpAmount,
    })
    res.json(signedTx)
  } catch (error) {
    console.error('Error building TX:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to build transaction',
    })
  }
})

app.post('/api/transaction/enroll', async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body
    if (!userId || !courseId) {
      return res.status(400).json({ error: 'Missing userId or courseId' })
    }
    const signedTx = await transactionService.enrollTX(userId, courseId)
    res.json(signedTx)
  } catch (error) {
    console.error('Error building enroll TX:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to build transaction',
    })
  }
})

app.post('/api/transaction/finalize-course', async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.body
    if (!userId || !courseId) {
      return res.status(400).json({ error: 'Missing userId or courseId' })
    }
    const signedTx = await transactionService.finalizeCourseT(userId, courseId)
    res.json(signedTx)
  } catch (error) {
    console.error('Error building finalize TX:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to build transaction',
    })
  }
})

// ============= Start Server =============

async function start() {
  try {
    // Initialize database
    await initializeDatabase()

    // Initialize transaction service
    transactionService = new TransactionService()
    console.log('✅ Transaction service initialized')

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Backend running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...')
  await closeDatabase()
  process.exit(0)
})

start()

export default app
