'use client'

import React, { useState } from 'react'
import { CodeEditor } from './CodeEditor'
import { Button, Card } from '@/components/ui'
import { useI18n } from '@/lib/hooks/useI18n'

export interface TestCase {
  input: string
  expectedOutput: string
  description: string
}

interface ChallengeRunnerProps {
  language?: 'rust' | 'typescript' | 'json' | 'javascript'
  starterCode: string
  testCases: TestCase[]
  solutionCode?: string
  onComplete?: () => void
}

interface ExecutionResult {
  passed: boolean
  output: string
  error?: string
  executionTime: number
  testsPassed: number
  totalTests: number
}

export function ChallengeRunner({
  language = 'rust',
  starterCode,
  testCases,
  solutionCode,
  onComplete,
}: ChallengeRunnerProps) {
  const { t } = useI18n()
  const [code, setCode] = useState(starterCode)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // Mock code execution - simulates running code against test cases
  const executeCode = async (userCode: string) => {
    setIsExecuting(true)

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simple mock: check if code contains key patterns
    const hasRequiredPatterns = language === 'rust' 
      ? userCode.includes('fn') && userCode.includes('pub')
      : userCode.includes('function') || userCode.includes('const')

    // Mock test execution
    let testsPassed = 0
    const executionStart = Date.now()

    testCases.forEach((testCase) => {
      // Simple pattern matching - in real implementation, execute actual code
      if (hasRequiredPatterns && userCode.length > starterCode.length) {
        testsPassed++
      }
    })

    const executionTime = Date.now() - executionStart
    const passed = testsPassed === testCases.length

    setResult({
      passed,
      output: `Code execution completed with ${testsPassed}/${testCases.length} tests passing`,
      error: passed ? undefined : 'Some tests failed',
      executionTime,
      testsPassed,
      totalTests: testCases.length,
    })

    setIsExecuting(false)

    if (passed && onComplete) {
      onComplete()
    }
  }

  const handleRun = (userCode: string) => {
    executeCode(userCode)
  }

  return (
    <div className="space-y-6">
      {/* Code Editor */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">{t('challenge.starterCode')}</h3>
        <CodeEditor
          language={language}
          value={code}
          onChange={setCode}
          defaultValue={starterCode}
          onRun={handleRun}
          height="400px"
        />
      </div>

      {/* Test Cases */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">{t('challenge.testCases')}</h3>
        <div className="space-y-2">
          {testCases.map((testCase, idx) => (
            <div
              key={idx}
              className="bg-terminal-surface border border-terminal-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{testCase.description}</span>
                <span className="text-xs text-gray-500">Test {idx + 1}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <p className="text-gray-500 mb-1">Input:</p>
                  <p className="text-neon-cyan bg-terminal-bg rounded p-2">{testCase.input}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Expected Output:</p>
                  <p className="text-neon-green bg-terminal-bg rounded p-2">
                    {testCase.expectedOutput}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Results */}
      {result && (
        <Card className={result.passed ? 'border-neon-green' : 'border-neon-magenta'}>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {result.passed ? (
                  <>
                    <span className="text-2xl">✅</span> {t('challenge.passed')}
                  </>
                ) : (
                  <>
                    <span className="text-2xl">❌</span> {t('challenge.failed')}
                  </>
                )}
              </h3>
              <span className={result.passed ? 'text-neon-green' : 'text-neon-magenta'}>
                {result.testsPassed}/{result.totalTests} {t('challenge.testCases')}
              </span>
            </div>

            {/* Output */}
            <div>
              <p className="text-xs text-gray-400 mb-2">{t('challenge.output')}:</p>
              <div className="bg-terminal-bg rounded p-3 font-mono text-sm text-gray-300 max-h-40 overflow-y-auto">
                {result.output}
              </div>
            </div>

            {/* Execution Time */}
            <div className="text-xs text-gray-400">
              {t('challenge.executionTime')}: <span className="text-neon-cyan">{result.executionTime}ms</span>
            </div>

            {/* Error Message */}
            {result.error && (
              <div className="bg-neon-magenta/10 border border-neon-magenta rounded p-3 text-sm text-neon-magenta">
                <p className="font-semibold mb-1">Error:</p>
                <p>{result.error}</p>
              </div>
            )}

            {/* Solution */}
            {solutionCode && !result.passed && (
              <div className="border-t border-terminal-border pt-4">
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="text-neon-cyan hover:text-neon-cyan/70 text-sm font-semibold flex items-center gap-2"
                >
                  <span>{showSolution ? '▼' : '▶'}</span> {t('lesson.showSolution')}
                </button>
                {showSolution && (
                  <div className="mt-3">
                    <CodeEditor
                      language={language}
                      value={solutionCode}
                      readonly
                      height="300px"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Success State */}
      {result?.passed && (
        <div className="bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border-2 border-neon-green rounded-lg p-6 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-xl font-bold text-neon-green mb-2">Challenge Completed!</h3>
          <p className="text-gray-300 mb-4">Great job! All tests passed.</p>
          <Button variant="primary" size="md">
            Claim Rewards (+{testCases.length * 25} XP)
          </Button>
        </div>
      )}
    </div>
  )
}
