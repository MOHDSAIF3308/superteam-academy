'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Card, CardContent, CardHeader, Button, Input } from '@/components/ui'
import { useState } from 'react'

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n()
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('dark')
  const [email, setEmail] = useState('user@example.com')

  const handleSave = () => {
    // TODO: Call user service to save settings
    alert('Settings saved!')
  }

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-display font-bold text-neon-cyan mb-8">
          {t('settings.title')}
        </h1>

        {/* Account Settings */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-2xl font-display font-bold text-white">{t('settings.account')}</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-3">{t('settings.connectedWallets')}</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                  <span className="text-white">Phantom Wallet</span>
                  <button className="text-neon-red hover:text-neon-red/70">
                    {t('settings.disconnect')}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-3">{t('settings.linkedAccounts')}</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                  <span className="text-white">Google Account</span>
                  <button className="text-neon-red hover:text-neon-red/70">
                    {t('settings.disconnect')}
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-terminal-bg rounded-lg border border-terminal-border">
                  <span className="text-white">GitHub Account</span>
                  <button className="text-neon-red hover:text-neon-red/70">
                    {t('settings.disconnect')}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-2xl font-display font-bold text-white">
              {t('settings.preferences')}
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('settings.language')}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-4 py-2 bg-terminal-surface border-2 border-terminal-border rounded-lg text-white focus:border-neon-cyan transition-colors"
              >
                <option value="en">English</option>
                <option value="pt-br">Português (Brasil)</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('settings.theme')}</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-full px-4 py-2 bg-terminal-surface border-2 border-terminal-border rounded-lg text-white focus:border-neon-cyan transition-colors"
              >
                <option value="light">{t('settings.theme_light')}</option>
                <option value="dark">{t('settings.theme_dark')}</option>
                <option value="auto">{t('settings.theme_auto')}</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-gray-300">{t('settings.notifications')}</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-2xl font-display font-bold text-white">{t('settings.privacy')}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              <span className="text-gray-300">Make profile public</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-gray-300">Show XP in leaderboards</span>
            </label>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSave} className="flex-1">
            {t('common.save')}
          </Button>
          <Button variant="ghost" className="flex-1">
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </main>
  )
}
