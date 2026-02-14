import { LocalLearningProgressService } from './learning-progress.service'
import { LocalCourseService } from './course.service'

export type { LearningProgressService } from './learning-progress.service'
export type { CourseService } from './course.service'
export { LocalLearningProgressService } from './learning-progress.service'
export { LocalCourseService } from './course.service'

// Service instances (singleton pattern)
let learningProgressService: LocalLearningProgressService | null = null
let courseService: LocalCourseService | null = null

export function getLearningProgressService(): LocalLearningProgressService {
  if (!learningProgressService) {
    learningProgressService = new LocalLearningProgressService()
  }
  return learningProgressService
}

export function getCourseService(): LocalCourseService {
  if (!courseService) {
    courseService = new LocalCourseService()
  }
  return courseService
}
