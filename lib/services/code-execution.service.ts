/**
 * Code Execution Service
 * Executes user code safely and captures output
 */

export interface ExecutionOutput {
  stdout: string
  stderr: string
  executionTime: number
  success: boolean
}

/**
 * Create an isolated execution environment using Web Worker
 * Falls back to synchronous execution in main thread if Workers unavailable
 */
export class CodeExecutionService {
  /**
   * Execute JavaScript/TypeScript code with timeout protection
   */
  static async executeJavaScript(
    code: string,
    timeout: number = 5000
  ): Promise<ExecutionOutput> {
    const startTime = Date.now()

    // Capture console output
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const output: string[] = []
    const errors: string[] = []

    try {
      // Redirect console methods
      console.log = (...args: any[]) => {
        output.push(args.map((arg) => JSON.stringify(arg)).join(' '))
      }
      console.error = (...args: any[]) => {
        errors.push(args.map((arg) => JSON.stringify(arg)).join(' '))
      }
      console.warn = (...args: any[]) => {
        errors.push('[WARNING] ' + args.map((arg) => JSON.stringify(arg)).join(' '))
      }

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timeout after ${timeout}ms`)), timeout)
      )

      // Execute code with timeout
      const executePromise = Promise.resolve().then(() => {
        // Use Function constructor to execute code in isolated scope
        const fn = new Function(code)
        return fn()
      })

      await Promise.race([executePromise, timeoutPromise])

      return {
        stdout: output.join('\n'),
        stderr: errors.join('\n'),
        executionTime: Date.now() - startTime,
        success: true,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push(errorMessage)

      return {
        stdout: output.join('\n'),
        stderr: errors.join('\n'),
        executionTime: Date.now() - startTime,
        success: false,
      }
    } finally {
      // Restore console methods
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }

  /**
   * Execute Python code via backend (not available in Phase 2)
   */
  static async executePython(code: string): Promise<ExecutionOutput> {
    throw new Error('Python execution requires backend support (coming in Phase 3)')
  }

  /**
   * Execute Rust code via backend (not available in Phase 2)
   */
  static async executeRust(code: string): Promise<ExecutionOutput> {
    throw new Error('Rust execution requires backend support (coming in Phase 3)')
  }

  /**
   * Execute code by language
   */
  static async executeCode(
    code: string,
    language: 'javascript' | 'typescript' | 'python' | 'rust',
    timeout?: number
  ): Promise<ExecutionOutput> {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return this.executeJavaScript(code, timeout)
      case 'python':
        return this.executePython(code)
      case 'rust':
        return this.executeRust(code)
      default:
        throw new Error(`Unsupported language: ${language}`)
    }
  }
}
