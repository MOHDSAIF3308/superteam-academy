'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { useState, useEffect } from 'react'
import { LeaderboardEntry } from '@/lib/types'

// Mock leaderboard data
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'user-1',
    username: 'SolanaWizard',
    totalXp: 15420,
    level: 12,
    currentStreak: 42,
    coursesCompleted: 8,
  },
  {
    rank: 2,
    userId: 'user-2',
    username: 'AnchorMaster',
    totalXp: 14280,
    level: 11,
    currentStreak: 38,
    coursesCompleted: 7,
  },
  {
    rank: 3,
    userId: 'user-3',
    username: 'RustBuilder',
    totalXp: 12950,
    level: 11,
    currentStreak: 35,
    coursesCompleted: 6,
  },
  {
    rank: 4,
    userId: 'user-4',
    username: 'BlockchainDev',
    totalXp: 11200,
    level: 10,
    currentStreak: 28,
    coursesCompleted: 5,
  },
  {
    rank: 5,
    userId: 'user-5',
    username: 'CryptoNinja',
    totalXp: 9850,
    level: 9,
    currentStreak: 21,
    coursesCompleted: 4,
  },
]

export default function LeaderboardPage() {
  const { t } = useI18n()
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('alltime')
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD)

  return (
    <main className="min-h-screen py-12 bg-gray-50 dark:bg-inherit">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-blue-600 dark:text-neon-cyan mb-2">
            {t('leaderboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Compete with developers worldwide and climb the ranks</p>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex gap-2 mb-8">
          {(['weekly', 'monthly', 'alltime'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 dark:bg-neon-cyan text-white dark:text-terminal-bg'
                  : 'bg-gray-100 dark:bg-terminal-surface border border-gray-300 dark:border-terminal-border text-gray-700 dark:text-gray-300 hover:border-blue-600 dark:hover:border-neon-cyan'
              }`}
            >
              {tf === 'weekly'
                ? t('leaderboard.weekly')
                : tf === 'monthly'
                  ? t('leaderboard.monthly')
                  : t('leaderboard.allTime')}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Top Developers</h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">{leaderboard.length} developers</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-terminal-border text-left text-sm text-gray-600 dark:text-gray-400">
                    <th className="pb-3 px-3">{t('leaderboard.rank')}</th>
                    <th className="pb-3 px-3">{t('leaderboard.username')}</th>
                    <th className="pb-3 px-3 text-right">{t('leaderboard.xp')}</th>
                    <th className="pb-3 px-3 text-right">{t('leaderboard.level')}</th>
                    <th className="pb-3 px-3 text-right">{t('leaderboard.streak')}</th>
                    <th className="pb-3 px-3 text-right">Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.userId}
                      className="border-b border-gray-300 dark:border-terminal-border hover:bg-gray-100 dark:hover:bg-terminal-surface transition-colors"
                    >
                      <td className="py-4 px-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 dark:bg-neon-cyan text-white dark:text-terminal-bg font-bold">
                          {entry.rank}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-terminal-surface text-center leading-8">
                            👤
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">{entry.username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right text-blue-600 dark:text-neon-cyan font-semibold">
                        {entry.totalXp.toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-right text-green-600 dark:text-neon-green">{entry.level}</td>
                      <td className="py-4 px-3 text-right text-yellow-600 dark:text-neon-yellow">
                        {entry.currentStreak}
                      </td>
                      <td className="py-4 px-3 text-right text-gray-600 dark:text-gray-400">{entry.coursesCompleted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
