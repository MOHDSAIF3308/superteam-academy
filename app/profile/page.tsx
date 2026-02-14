'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Card, CardContent, CardHeader, Button } from '@/components/ui'
import Link from 'next/link'

interface UserProfileData {
  username: string
  displayName: string
  bio: string
  level: number
  totalXp: number
  totalLessonsCompleted: number
  totalCoursesCompleted: number
  joinDate: string
  currentStreak: number
  achievements: string[]
  skills: { name: string; level: number }[]
}

// Mock user data
const MOCK_USER: UserProfileData = {
  username: 'solanadev',
  displayName: 'Solana Developer',
  bio: 'Building on Solana 🚀',
  level: 7,
  totalXp: 2450,
  totalLessonsCompleted: 24,
  totalCoursesCompleted: 3,
  joinDate: 'January 15, 2026',
  currentStreak: 12,
  achievements: ['🚀', '💡', '🏆', '⚡'],
  skills: [
    { name: 'Rust', level: 4 },
    { name: 'Anchor', level: 3 },
    { name: 'Frontend', level: 4 },
    { name: 'Security', level: 2 },
  ],
}

export default function ProfilePage() {
  const { t } = useI18n()

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-8 pt-6">
            <div className="w-32 h-32 rounded-full bg-terminal-surface border-2 border-neon-cyan flex items-center justify-center text-6xl">
              👤
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-white mb-2">
                {MOCK_USER.displayName}
              </h1>
              <p className="text-gray-400 mb-4">@{MOCK_USER.username}</p>
              <p className="text-gray-300 mb-4">{MOCK_USER.bio}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Level</p>
                  <p className="text-2xl font-bold text-neon-cyan">{MOCK_USER.level}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Total XP</p>
                  <p className="text-2xl font-bold text-neon-cyan">{MOCK_USER.totalXp}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Streak</p>
                  <p className="text-2xl font-bold text-neon-yellow">{MOCK_USER.currentStreak}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Courses</p>
                  <p className="text-2xl font-bold text-neon-green">
                    {MOCK_USER.totalCoursesCompleted}
                  </p>
                </div>
              </div>

              <Link href="/settings">
                <Button variant="secondary">{t('profile.editProfile')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skills */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-display font-bold text-white">{t('profile.skills')}</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_USER.skills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-300">{skill.name}</span>
                    <span className="text-xs text-neon-cyan">{skill.level}/5</span>
                  </div>
                  <div className="h-2 bg-terminal-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-cyan to-neon-green"
                      style={{ width: `${(skill.level / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-display font-bold text-white">
                {t('profile.achievements')}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {MOCK_USER.achievements.map((achievement, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg bg-terminal-bg border border-terminal-border flex items-center justify-center text-2xl hover:border-neon-cyan transition-colors"
                  >
                    {achievement}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-display font-bold text-white">
                {t('profile.credentials')}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-400">
                <p>No credentials yet</p>
                <p>Complete courses to earn on-chain credentials (cNFTs)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completed Courses */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-2xl font-display font-bold text-white">
              {t('profile.completedCourses')}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Solana Fundamentals', 'Anchor Development', 'Advanced Smart Contracts'].map(
                (course, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-terminal-bg rounded-lg border border-terminal-border flex items-center justify-between"
                  >
                    <span className="text-white">{course}</span>
                    <span className="text-neon-green">✓</span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
