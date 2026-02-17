'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAchievements } from '@/lib/hooks/useProgress'
import { Card, CardContent, CardHeader, Button, Input } from '@/components/ui'
import { useState } from 'react'
import Link from 'next/link'

export default function ProfilePage() {
  const { t } = useI18n()
  const { user, loading, updateProfile } = useAuth()
  const { achievements, unlockedAchievements, isLoading: achievementsLoading } = useAchievements()
  const [isEditing, setIsEditing] = useState(false)
  const [bioBuffer, setBioBuffer] = useState(user?.bio || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveBio = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      await updateProfile({ ...user, bio: bioBuffer })
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to save bio:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-40 bg-gray-200 dark:bg-terminal-bg rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-terminal-bg rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-display font-bold mb-4">{t('profile.notFound')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to view your profile</p>
          <Link href="/auth/signin">
            <Button>{t('auth.signIn')}</Button>
          </Link>
        </div>
      </main>
    )
  }

  const achievementEmojis: Record<string, string> = {
    'First Steps': '🚀',
    'XP Collector': '⭐',
    'Course Completer': '🎯',
    'Week Warrior': '🔥',
    'Monthly Master': '🏆',
    'Century Seeker': '💯',
    'Challenge Master': '⚡',
    'XP Master': '🌟',
  }

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-8 pt-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-6xl font-bold text-white">
              {(user?.displayName || 'U')[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                {user.displayName || 'Anonymous Learner'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{user.email || 'No email'}</p>
              
              {isEditing ? (
                <div className="mb-4">
                  <textarea
                    value={bioBuffer}
                    onChange={(e) => setBioBuffer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-terminal-border rounded-lg dark:bg-terminal-bg dark:text-white text-sm"
                    rows={2}
                    placeholder="Write your bio..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveBio}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setBioBuffer(user.bio || '')
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-terminal-bg text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-terminal-surface text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {user.bio || 'No bio yet'}
                  </p>
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setBioBuffer(user.bio || '')
                    }}
                    className="text-blue-600 dark:text-neon-cyan hover:underline text-sm mb-4"
                  >
                    Edit bio
                  </button>
                </>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Level</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-neon-cyan">{user.level}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total XP</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-neon-cyan">
                    {(user.totalXP || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Streak</p>
                  <p className="text-2xl font-bold text-orange-500">🔥 {user.currentStreak}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Longest</p>
                  <p className="text-2xl font-bold text-green-600">
                    {user.longestStreak}
                  </p>
                </div>
              </div>

              <Link href="/settings">
                <Button variant="secondary">{t('profile.editProfile')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                {t('profile.achievements')} ({unlockedAchievements.length}/{achievements.length})
              </h2>
            </CardHeader>
            <CardContent>
              {!achievementsLoading ? (
                <div className="grid grid-cols-4 gap-2">
                  {achievements.map((achievement) => {
                    const isUnlocked = unlockedAchievements.some((a) => a.achievementId === achievement.id)
                    const emoji = achievementEmojis[achievement.name] || '🏅'
                    return (
                      <div
                        key={achievement.id}
                        title={achievement.name}
                        className={`aspect-square rounded-lg flex items-center justify-center text-2xl border-2 transition-all ${
                          isUnlocked
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600 cursor-pointer hover:scale-110'
                            : 'bg-gray-100 dark:bg-terminal-bg border-gray-300 dark:border-terminal-border opacity-50'
                        }`}
                      >
                        {emoji}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="aspect-square bg-gray-200 dark:bg-terminal-bg rounded-lg animate-pulse" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                {t('profile.credentials')}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>📜 Complete courses to earn on-chain credentials (cNFTs)</p>
                <p className="text-xs">Coming in Phase 2 with Solana integration</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Since */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
              Member Since
            </h2>
          </CardHeader>
          <CardContent>
            <div className="text-gray-700 dark:text-gray-300">
              <p>{new Date(user.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Joined {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
