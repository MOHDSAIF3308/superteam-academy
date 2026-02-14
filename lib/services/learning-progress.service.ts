import { PublicKey } from '@solana/web3.js'
import {
  Progress,
  UserStats,
  Credential,
  Streak,
  LeaderboardEntry,
  ChallengeResult,
} from '../types'

/**
 * Learning Progress Service
 * Clean interface for managing learning progress and gamification
 * Future: Can be swapped for on-chain calls to the Anchor program
 */
export interface LearningProgressService {
  // Progress Tracking
  getProgress(userId: string, courseId: string): Promise<Progress>
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<void>
  getCourseCompletion(userId: string, courseId: string): Promise<number>

  // XP & Leveling
  getXP(userId: string): Promise<number>
  getLevel(userId: string): Promise<number>
  getUserStats(userId: string): Promise<UserStats>

  // Streaks
  getStreak(userId: string): Promise<Streak>
  getStreakHistory(userId: string, days?: number): Promise<Record<string, boolean>>

  // Leaderboard
  getLeaderboard(
    timeframe: 'weekly' | 'monthly' | 'alltime',
    limit?: number
  ): Promise<LeaderboardEntry[]>
  getLeaderboardByTrack(
    track: string,
    timeframe: 'weekly' | 'monthly' | 'alltime',
    limit?: number
  ): Promise<LeaderboardEntry[]>
  getUserRank(userId: string, timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<number>

  // Credentials (cNFTs)
  getCredentials(wallet: PublicKey): Promise<Credential[]>
  getCredentialByTrack(wallet: PublicKey, track: string): Promise<Credential | null>

  // Achievements
  getAchievements(userId: string): Promise<string[]>
  checkAchievementProgress(userId: string): Promise<void>

  // Challenge Execution (stubbed for now)
  executeChallenge(
    code: string,
    testCases: Array<{ input: string; expectedOutput: string }>
  ): Promise<ChallengeResult>
}

/**
 * Local implementation for MVP
 * Will be replaced with on-chain program calls
 */
export class LocalLearningProgressService implements LearningProgressService {
  // Mock data storage
  private progressMap = new Map<string, Progress>()
  private userStatsMap = new Map<string, UserStats>()
  private streakMap = new Map<string, Streak>()

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const key = `${userId}:${courseId}`
    return (
      this.progressMap.get(key) || {
        userId,
        courseId,
        enrolledAt: new Date(),
        completedLessons: [],
        completionPercentage: 0,
      }
    )
  }

  async completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number
  ): Promise<void> {
    const key = `${userId}:${courseId}`
    const progress = await this.getProgress(userId, courseId)

    if (!progress.completedLessons.includes(lessonIndex)) {
      progress.completedLessons.push(lessonIndex)
      this.progressMap.set(key, progress)

      // Update streak
      await this.updateStreak(userId)

      // Award XP
      const stats = await this.getUserStats(userId)
      stats.totalXp += 25 // Default XP per lesson
      stats.totalLessonsCompleted += 1
      this.userStatsMap.set(userId, stats)
    }
  }

  async getCourseCompletion(userId: string, courseId: string): Promise<number> {
    const progress = await this.getProgress(userId, courseId)
    return progress.completionPercentage
  }

  async getXP(userId: string): Promise<number> {
    const stats = await this.getUserStats(userId)
    return stats.totalXp
  }

  async getLevel(userId: string): Promise<number> {
    const xp = await this.getXP(userId)
    return Math.floor(Math.sqrt(xp / 100))
  }

  async getUserStats(userId: string): Promise<UserStats> {
    return (
      this.userStatsMap.get(userId) || {
        userId,
        totalXp: 0,
        level: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalLessonsCompleted: 0,
        totalCoursesCompleted: 0,
        joinDate: new Date(),
      }
    )
  }

  async getStreak(userId: string): Promise<Streak> {
    return (
      this.streakMap.get(userId) || {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
        streakHistory: {},
      }
    )
  }

  private async updateStreak(userId: string): Promise<void> {
    const streak = await this.getStreak(userId)
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const lastActivity = streak.streakHistory[yesterday]
    const hadActivityYesterday = lastActivity === true

    if (hadActivityYesterday) {
      streak.currentStreak += 1
    } else {
      streak.currentStreak = 1
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak
    }

    streak.streakHistory[today] = true
    streak.lastActivityDate = new Date()

    this.streakMap.set(userId, streak)
  }

  async getStreakHistory(userId: string, days: number = 30): Promise<Record<string, boolean>> {
    const streak = await this.getStreak(userId)
    return streak.streakHistory
  }

  async getLeaderboard(
    timeframe: 'weekly' | 'monthly' | 'alltime',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const entries = Array.from(this.userStatsMap.entries())
      .map(([userId, stats]) => ({
        rank: 0,
        userId,
        username: `User ${userId.slice(0, 4)}`,
        totalXp: stats.totalXp,
        level: stats.level,
        currentStreak: 0,
        coursesCompleted: stats.totalCoursesCompleted,
      }))
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, limit)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))

    return entries
  }

  async getLeaderboardByTrack(
    track: string,
    timeframe: 'weekly' | 'monthly' | 'alltime',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    return this.getLeaderboard(timeframe, limit)
  }

  async getUserRank(
    userId: string,
    timeframe: 'weekly' | 'monthly' | 'alltime'
  ): Promise<number> {
    const leaderboard = await this.getLeaderboard(timeframe)
    return leaderboard.find((e) => e.userId === userId)?.rank || 0
  }

  async getCredentials(_wallet: PublicKey): Promise<Credential[]> {
    // Stub: In production, query Helius DAS API or custom indexer
    return []
  }

  async getCredentialByTrack(_wallet: PublicKey, _track: string): Promise<Credential | null> {
    return null
  }

  async getAchievements(_userId: string): Promise<string[]> {
    // Stub: Would read bitmap from on-chain
    return []
  }

  async checkAchievementProgress(_userId: string): Promise<void> {
    // Stub: Check and update achievements
  }

  async executeChallenge(
    _code: string,
    _testCases: Array<{ input: string; expectedOutput: string }>
  ): Promise<ChallengeResult> {
    // Stub: Execute code and check test cases
    return {
      passed: false,
      output: '',
      executionTime: 0,
      testsPassed: 0,
      totalTests: _testCases.length,
    }
  }
}
