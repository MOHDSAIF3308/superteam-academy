import { Course, Enrollment, LearningPath } from '../types'

/**
 * Course Service
 * Manages course data and enrollments
 */
export interface CourseService {
  getCourses(filters?: {
    difficulty?: string
    track?: string
    search?: string
  }): Promise<Course[]>
  getCourse(slug: string): Promise<Course | null>
  getLearningPaths(): Promise<LearningPath[]>
  enrollCourse(userId: string, courseId: string): Promise<void>
  getEnrollments(userId: string): Promise<Enrollment[]>
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | null>
}

/**
 * Mock course data for MVP
 */
const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    slug: 'solana-fundamentals',
    title: 'Solana Fundamentals',
    description:
      'Learn the core concepts of Solana blockchain, including accounts, programs, and transactions.',
    difficulty: 'beginner',
    duration: 180,
    track: 'Core',
    xpReward: 500,
    enrollmentCount: 1250,
    tags: ['solana', 'blockchain', 'basics'],
    instructor: {
      name: 'Solana Academy',
      avatar: 'https://api.solana.com/logo.png',
    },
    modules: [
      {
        id: 'module-1',
        courseId: 'course-1',
        title: 'Introduction to Solana',
        description: 'Get started with Solana basics',
        order: 1,
        lessons: [
          {
            id: 'lesson-1',
            title: 'What is Solana?',
            description: 'Understanding blockchain fundamentals',
            type: 'content',
            content: '# Solana Basics\n\nSolana is a fast, secure, and scalable blockchain...',
            order: 1,
            xpReward: 10,
          },
          {
            id: 'lesson-2',
            title: 'Accounts & Programs',
            type: 'content',
            content: '# Accounts and Programs\n\nIn Solana, everything is an account...',
            order: 2,
            xpReward: 15,
          },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'course-2',
    slug: 'anchor-development',
    title: 'Anchor Development',
    description: 'Master Anchor framework for building Solana programs efficiently.',
    difficulty: 'intermediate',
    duration: 240,
    track: 'Development',
    xpReward: 1000,
    enrollmentCount: 890,
    tags: ['anchor', 'rust', 'programming'],
    instructor: {
      name: 'Solana Academy',
    },
    modules: [
      {
        id: 'module-2',
        courseId: 'course-2',
        title: 'Anchor Basics',
        order: 1,
        lessons: [
          {
            id: 'lesson-3',
            title: 'Setting up Anchor',
            type: 'content',
            content: '# Anchor Setup\n\nAnchor is a framework for Rust-based Solana programs...',
            order: 1,
            xpReward: 20,
          },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'path-1',
    title: 'Solana Fundamentals',
    description: 'Start your Solana journey from the basics',
    courses: ['course-1'],
    icon: '🚀',
    order: 1,
  },
  {
    id: 'path-2',
    title: 'Smart Contract Developer',
    description: 'Build production-ready programs on Solana',
    courses: ['course-1', 'course-2'],
    icon: '⚙️',
    order: 2,
  },
]

export class LocalCourseService implements CourseService {
  private enrollments = new Map<string, Enrollment[]>()

  async getCourses(filters?: {
    difficulty?: string
    track?: string
    search?: string
  }): Promise<Course[]> {
    let courses = [...MOCK_COURSES]

    if (filters?.difficulty) {
      courses = courses.filter((c) => c.difficulty === filters.difficulty)
    }

    if (filters?.track) {
      courses = courses.filter((c) => c.track === filters.track)
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search)
      )
    }

    return courses
  }

  async getCourse(slug: string): Promise<Course | null> {
    return MOCK_COURSES.find((c) => c.slug === slug) || null
  }

  async getLearningPaths(): Promise<LearningPath[]> {
    return LEARNING_PATHS
  }

  async enrollCourse(userId: string, courseId: string): Promise<void> {
    const userEnrollments = this.enrollments.get(userId) || []

    if (!userEnrollments.find((e) => e.courseId === courseId)) {
      userEnrollments.push({
        id: `enrollment-${userId}-${courseId}`,
        userId,
        courseId,
        enrolledAt: new Date(),
        completionPercentage: 0,
        lastAccessedAt: new Date(),
      })

      this.enrollments.set(userId, userEnrollments)
    }
  }

  async getEnrollments(userId: string): Promise<Enrollment[]> {
    return this.enrollments.get(userId) || []
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
    const enrollments = await this.getEnrollments(userId)
    return enrollments.find((e) => e.courseId === courseId) || null
  }
}

// Singleton instance
let courseServiceInstance: LocalCourseService | null = null

export function getCourseServiceInstance(): LocalCourseService {
  if (!courseServiceInstance) {
    courseServiceInstance = new LocalCourseService()
  }
  return courseServiceInstance
}

// Helper functions for convenience
export async function getAllCourses(): Promise<Course[]> {
  return getCourseServiceInstance().getCourses()
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  return getCourseServiceInstance().getEnrollments(userId)
}
