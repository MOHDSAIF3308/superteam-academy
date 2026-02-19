export async function submitLesson(
  userId: string,
  courseId: string,
  lessonId: string,
  xpReward: number
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/xp/award`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        courseId,
        lessonId,
        xpAmount: xpReward,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        xpAwarded: data.xpAwarded,
        totalXp: data.totalXp,
        level: data.level,
        message: data.message,
      }
    } else {
      return {
        success: false,
        xpAwarded: 0,
        totalXp: 0,
        level: 0,
        message: data.error || 'Failed to award XP',
      }
    }
  } catch (error) {
    return {
      success: false,
      xpAwarded: 0,
      totalXp: 0,
      level: 0,
      message: error instanceof Error ? error.message : 'Submission failed',
    }
  }
}
