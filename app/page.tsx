'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'
import { useI18n } from '@/lib/hooks/useI18n'
import { getCourseService } from '@/lib/services'
import { useState, useEffect } from 'react'
import { CourseCard } from '@/components/courses'
import { Course, LearningPath } from '@/lib/types'

export default function Home() {
  const { t } = useI18n()
  const [courses, setCourses] = useState<Course[]>([])
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const service = getCourseService()
      const coursesData = await service.getCourses()
      const pathsData = await service.getLearningPaths()
      setCourses(coursesData.slice(0, 3))
      setPaths(pathsData)
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <main>
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-neon-cyan/10 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-neon-magenta/10 rounded-full blur-3xl opacity-20" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          {/* Hero Text */}
          <div className="space-y-4">
            <div className="inline-block px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full text-neon-cyan text-sm font-semibold mb-4">
              🚀 Learn to Build on Solana
            </div>

            <h1 className="text-6xl md:text-7xl font-display font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-green bg-clip-text text-transparent">
                {t('home.title')}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
              {t('home.subtitle')}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
            <Link href="/courses">
              <Button variant="primary" size="lg" className="w-full md:w-auto">
                {t('home.exploreCourses')} →
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="w-full md:w-auto">
                {t('home.getStarted')} ⚡
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <p className="text-4xl font-bold text-neon-cyan mb-2">1,250+</p>
              <p className="text-gray-400">Active Learners</p>
            </div>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <p className="text-4xl font-bold text-neon-green mb-2">12+</p>
              <p className="text-gray-400">Courses Available</p>
            </div>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <p className="text-4xl font-bold text-neon-yellow mb-2">500K+</p>
              <p className="text-gray-400">XP Distributed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-terminal-bg/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-display font-bold text-center text-white mb-12">
            Why Superteam Academy?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon="💻"
              title={t('home.features.interactive')}
              description={t('home.features.interactiveDesc')}
            />
            <FeatureCard
              icon="🎓"
              title={t('home.features.credentials')}
              description={t('home.features.credentialsDesc')}
            />
            <FeatureCard
              icon="🌍"
              title={t('home.features.leaderboard')}
              description={t('home.features.leaderboardDesc')}
            />
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {courses.length > 0 && (
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-display font-bold text-white">Popular Courses</h2>
              <Link href="/courses">
                <Button variant="ghost">View All →</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section className="py-20 bg-terminal-bg/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-display font-bold text-center text-white mb-12">
            What Learners Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Alex Silva',
                role: 'Solana Developer',
                comment:
                  'Superteam Academy helped me go from zero to deploying my first program in just 2 weeks!',
              },
              {
                name: 'Maria Garcia',
                role: 'Blockchain Engineer',
                comment:
                  'The interactive challenges and on-chain credentials made learning Solana actually fun.',
              },
              {
                name: 'Carlos Rodriguez',
                role: 'Web3 Enthusiast',
                comment:
                  'Best platform for learning Solana. The community support is incredible!',
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-terminal-surface border border-terminal-border rounded-lg p-6"
              >
                <p className="text-gray-300 mb-4 italic">"{testimonial.comment}"</p>
                <p className="text-white font-semibold">{testimonial.name}</p>
                <p className="text-neon-cyan text-sm">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-neon-cyan/10 to-neon-magenta/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-gray-300 mb-8">Join 1,250+ developers learning Solana on Superteam Academy</p>
          <Link href="/courses">
            <Button variant="primary" size="lg">
              Get Started Now →
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-8 hover:border-neon-cyan transition-all group">
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-neon-cyan transition-colors">
        {title}
      </h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-display font-bold text-neon-green">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}
