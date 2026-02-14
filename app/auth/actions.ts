'use server'

import { signIn } from 'next-auth/react'

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' })
}

export async function signInWithGitHub() {
  await signIn('github', { redirectTo: '/dashboard' })
}
