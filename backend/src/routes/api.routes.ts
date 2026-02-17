import express from 'express'
import { userService } from '../services/user.service'
import { enrollmentService } from '../services/enrollment.service'

const router = express.Router()

// ===== USER ROUTES =====

/**
 * Get or create user from OAuth
 */
router.post('/users/oauth', async (req, res) => {
  try {
    const { provider, providerUserId, profile } = req.body

    if (!provider || !providerUserId || !profile) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const user = await userService.getOrCreateUser(provider, providerUserId, profile)
    res.json(user)
  } catch (error) {
    console.error('OAuth user creation failed:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

/**
 * Get user by ID
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.userId)
    res.json(user)
  } catch (error) {
    res.status(404).json({ error: 'User not found' })
  }
})

/**
 * Update user profile
 */
router.patch('/users/:userId', async (req, res) => {
  try {
    const user = await userService.updateProfile(req.params.userId, req.body)
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

/**
 * Get user enrollments
 */
router.get('/users/:userId/enrollments', async (req, res) => {
  try {
    const enrollments = await userService.getUserEnrollments(req.params.userId)
    res.json(enrollments)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enrollments' })
  }
})

// ===== ENROLLMENT ROUTES =====

/**
 * Enroll user in course
 */
router.post('/enrollments', async (req, res) => {
  try {
    const { userId, courseId } = req.body

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'Missing userId or courseId' })
    }

    const enrollment = await enrollmentService.enrollCourse(userId, courseId)
    res.json(enrollment)
  } catch (error) {
    console.error('Enrollment failed:', error)
    res.status(500).json({ error: 'Failed to enroll' })
  }
})

/**
 * Complete lesson
 */
router.post('/enrollments/complete-lesson', async (req, res) => {
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

/**
 * Get course progress
 */
router.get('/enrollments/:userId/:courseId', async (req, res) => {
  try {
    const progress = await enrollmentService.getCourseProgress(req.params.userId, req.params.courseId)

    if (!progress) {
      return res.status(404).json({ error: 'Enrollment not found' })
    }

    res.json(progress)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' })
  }
})

// ===== PROGRESS ROUTES =====

/**
 * Get user progress
 */
router.get('/progress/:userId', async (req, res) => {
  try {
    const progress = await enrollmentService.getUserProgress(req.params.userId)
    res.json(progress)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress' })
  }
})

// ===== LEADERBOARD ROUTES =====

/**
 * Get leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500)
    const leaderboard = await userService.getLeaderboard(limit)
    res.json(leaderboard)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

/**
 * Get user rank
 */
router.get('/leaderboard/rank/:userId', async (req, res) => {
  try {
    const rank = await userService.getUserRank(req.params.userId)
    res.json({ rank })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rank' })
  }
})

export default router
