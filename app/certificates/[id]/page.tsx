'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Card, CardContent, Button } from '@/components/ui'
import Link from 'next/link'

interface CertificateData {
  id: string
  courseName: string
  issuedDate: string
  mintAddress: string
  level: number
  verificationUrl: string
}

// Mock credential data
const MOCK_CREDENTIAL: CertificateData = {
  id: 'nft-1',
  courseName: 'Solana Fundamentals',
  issuedDate: 'March 15, 2026',
  mintAddress: 'G8RGATUFxWpfmMVxUX7wupf4fWnyQ7DQ9FVVzYvXVvsC',
  level: 2,
  verificationUrl: 'https://solscan.io/token/...',
}

export default function CertificatePage() {
  const { t } = useI18n()

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/profile" className="text-neon-cyan hover:text-neon-cyan/70 mb-8 inline-block">
          ← {t('common.back')}
        </Link>

        <Card className="mb-8">
          <CardContent className="pt-8">
            {/* Certificate Display */}
            <div className="bg-gradient-to-br from-terminal-surface to-terminal-bg rounded-lg border-2 border-neon-cyan p-12 text-center mb-8">
              <div className="text-6xl mb-4">🎓</div>

              <h1 className="text-4xl font-display font-bold text-neon-cyan mb-4">
                {t('certificates.title')}
              </h1>

              <div className="text-gray-300 space-y-2 mb-8">
                <p className="text-lg font-semibold">{MOCK_CREDENTIAL.courseName}</p>
                <p className="text-sm">Issued on {MOCK_CREDENTIAL.issuedDate}</p>
                <p className="text-sm">Level {MOCK_CREDENTIAL.level}</p>
              </div>

              <div className="bg-terminal-bg rounded p-4 font-mono text-xs text-gray-400 overflow-auto">
                <span className="text-neon-green">Mint Address:</span> {MOCK_CREDENTIAL.mintAddress}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Button variant="primary" className="w-full">
                {t('certificates.download')}
              </Button>
              <Button variant="secondary" className="w-full">
                {t('certificates.share')}
              </Button>
              <a href={MOCK_CREDENTIAL.verificationUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" className="w-full">
                  {t('certificates.verify')}
                </Button>
              </a>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Certificate Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Course</p>
                    <p className="text-white">{MOCK_CREDENTIAL.courseName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Issued Date</p>
                    <p className="text-white">{MOCK_CREDENTIAL.issuedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Level</p>
                    <p className="text-white">Level {MOCK_CREDENTIAL.level}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">On-Chain Verification</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Type</p>
                    <p className="text-neon-cyan">Compressed NFT (cNFT)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Network</p>
                    <p className="text-white">Solana Devnet</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Verification</p>
                    <a
                      href={MOCK_CREDENTIAL.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neon-cyan hover:text-neon-cyan/70 break-all"
                    >
                      View on Solscan
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
