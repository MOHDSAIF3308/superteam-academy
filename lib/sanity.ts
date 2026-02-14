import {createClient} from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-13'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

// Types for queries
export interface SanityCourse {
  _id: string
  title: string
  slug: {current: string}
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  track: string
  duration: number
  xpReward: number
  enrollmentCount?: number
  thumbnail?: any
  instructor?: {
    name: string
    avatar?: any
  }
  tags?: string[]
  modules?: any[]
  status?: string
}

export interface SanityModule {
  _id: string
  title: string
  description?: string
  order: number
  lessons?: any[]
}

export interface SanityLesson {
  _id: string
  title: string
  slug: {current: string}
  description?: string
  content?: any
  type: 'content' | 'challenge'
  challenge?: any
  xpReward?: number
  order: number
}

// Helper functions
export async function getCourses(filters?: {difficulty?: string; track?: string}): Promise<SanityCourse[]> {
  let query = '*[_type == "course" && status == "published"]'

  const conditions = []
  if (filters?.difficulty) {
    conditions.push(`difficulty == "${filters.difficulty}"`)
  }
  if (filters?.track) {
    conditions.push(`track == "${filters.track}"`)
  }

  if (conditions.length > 0) {
    query += ` && ${conditions.join(' && ')}`
  }

  query += ' | order(title asc) {_id, title, slug, description, difficulty, track, duration, xpReward, thumbnail, instructor, tags, status}'

  return client.fetch(query)
}

export async function getCourse(slug: string): Promise<SanityCourse | null> {
  const query = `*[_type == "course" && slug.current == "${slug}" && status == "published"][0] {
    _id,
    title,
    slug,
    description,
    difficulty,
    track,
    duration,
    xpReward,
    thumbnail,
    instructor,
    tags,
    "modules": modules[] {
      _id,
      title,
      description,
      order,
      "lessons": lessons[] {
        _id,
        title,
        slug,
        description,
        content,
        type,
        challenge,
        xpReward,
        order
      } | sort(order asc)
    } | sort(order asc),
    prerequisites,
    status
  }`

  return client.fetch(query)
}

export async function getLesson(courseSlug: string, lessonId: string): Promise<SanityLesson | null> {
  const query = `*[_type == "lesson" && _id == "${lessonId}"][0] {
    _id,
    title,
    slug,
    description,
    content,
    type,
    challenge,
    xpReward,
    order
  }`

  return client.fetch(query)
}

export async function searchCourses(query: string): Promise<SanityCourse[]> {
  const searchQuery = `*[_type == "course" && status == "published" && (
    title match "${query}*" || 
    description match "${query}*" || 
    tags[] match "${query}*"
  )] | order(title asc) {_id, title, slug, description, difficulty, track, duration, xpReward, thumbnail, instructor, tags}`

  return client.fetch(searchQuery)
}
