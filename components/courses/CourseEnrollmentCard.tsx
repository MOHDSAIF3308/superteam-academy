import React, { useState } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEnrollCourse, useCloseEnrollment } from '@/lib/hooks/useOnchain';
import { useLearnerEnrollments, useCourse, useCourseProgress } from '@/lib/hooks/useCourses';
import { useXpBalance, useCredentials } from '@/lib/hooks/useXp';
import { useXpMint } from '@/lib/hooks/useConfig';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';

/**
 * Course Enrollment Card Component
 * Shows course info and enrollment actions
 */
export function CourseEnrollmentCard({ courseId }: { courseId: string }) {
  const wallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: enrollment } = useEnrollment(courseId, wallet?.publicKey);
  const { mutate: enroll, isPending: enrolling } = useEnrollCourse();
  const { mutate: closeEnrollment, isPending: closing } = useCloseEnrollment();

  if (courseLoading) {
    return <Loading />;
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  const handleEnroll = () => {
    enroll(
      { courseId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['enrollment', courseId] });
          queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        },
      }
    );
  };

  const handleClose = () => {
    closeEnrollment(
      { courseId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['enrollment', courseId] });
          queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        },
      }
    );
  };

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold">{course.courseId}</h3>
        <p className="text-sm text-gray-600">
          {course.lessonCount} lessons • {course.xpPerLesson} XP per lesson
        </p>
      </div>

      <div className="flex gap-2">
        {!enrollment ? (
          <Button
            onClick={handleEnroll}
            disabled={enrolling}
            variant="primary"
          >
            {enrolling ? 'Enrolling...' : 'Enroll Now'}
          </Button>
        ) : (
          <>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Progress</p>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.round(
                      (enrollment.completedLessons / course.lessonCount) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {enrollment.completedLessons}/{course.lessonCount} lessons
              </p>
            </div>

            <Button
              onClick={handleClose}
              disabled={closing}
              variant="outline"
            >
              {closing ? 'Closing...' : 'Close'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Import missing hook
 */
function useEnrollment(courseId: string, learnerAddress: any) {
  const { connection } = useConnection();
  const { data, isLoading } = useQuery({
    queryKey: ['enrollment', courseId, learnerAddress?.toString()],
    queryFn: async () => {
      if (!courseId || !learnerAddress) return null;
      const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' });
      const program = new Program(IDL as any, PROGRAM_ID, provider);
      const [enrollmentPda] = getEnrollmentPda(courseId, learnerAddress);
      return await program.account.enrollment.fetchNullable(enrollmentPda);
    },
    enabled: !!courseId && !!learnerAddress,
  });

  // Calculate progress
  if (!data) return { data: null, isLoading };

  const lessons = countCompletedLessons(data.lessonFlags);
  
  // Get course to know total lessons
  return {
    data: {
      ...data,
      completedLessons: lessons,
    },
    isLoading,
  };
}

// Re-export missing imports needed
import { useConnection } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PROGRAM_ID, IDL, getEnrollmentPda, countCompletedLessons } from '@/lib/anchor';
