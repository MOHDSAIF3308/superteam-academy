/**
 * API Client Service
 * Handles all HTTP calls to the backend API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiError {
  error: string
}

class ApiClient {
  private token: string | null = null

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
    }
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('token')
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Request failed')
      }

      return response.json()
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error)
      throw error
    }
  }

  // ============= Auth =============

  async signup(email: string, password: string, displayName: string) {
    return this.request<{ user: any; token: string }>('POST', '/auth/signup', {
      email,
      password,
      displayName,
    })
  }

  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('POST', '/auth/login', {
      email,
      password,
    })
  }

  async oauthSignup(provider: 'google' | 'github', providerId: string, data: any) {
    return this.request<{ user: any; token: string }>('POST', '/auth/oauth-signup', {
      provider,
      providerId,
      ...data,
    })
  }

  // ============= User Profile =============

  async getProfile() {
    return this.request<any>('GET', '/user/profile')
  }

  async updateProfile(updates: {
    displayName?: string
    bio?: string
    avatarUrl?: string
    walletAddress?: string
  }) {
    return this.request<any>('PATCH', '/user/profile', updates)
  }

  async linkOAuth(provider: string, providerId: string) {
    return this.request<{ success: boolean }>('POST', '/user/link-oauth', {
      provider,
      providerId,
    })
  }

  // ============= Gamification =============

  async completeLesson(courseId: string, lessonId: string, xpReward: number) {
    return this.request<any>('POST', `/lessons/${courseId}/${lessonId}/complete`, {
      xpReward,
    })
  }

  async getProgress() {
    return this.request<any>('GET', '/user/progress')
  }

  async getAchievements() {
    return this.request<any>('GET', '/user/achievements')
  }

  // ============= Leaderboard =============

  async getLeaderboard(limit = 50, offset = 0) {
    return this.request<any[]>('GET', `/leaderboard?limit=${limit}&offset=${offset}`)
  }

  async getUserRank(userId: string) {
    return this.request<any>('GET', `/user/${userId}/rank`)
  }

  // ============= Health =============

  async health() {
    return this.request<{ status: string }>('GET', '/health')
  }
}

// Singleton instance
export const apiClient = new ApiClient()
