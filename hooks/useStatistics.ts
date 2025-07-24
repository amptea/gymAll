import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';
import { useAuth } from './useAuth';

interface Workout {
  id: string;
  date?: any;
  totalWeight?: number;
  exercises?: any[];
  [key: string]: any;
}

interface Statistics {
  totalWorkouts: number;
  totalWeight: number;
  averageWeight: number;
  averageReps: number;
  currentWorkoutStreak: number;
  longestWorkoutStreak: number;
}

export const useStatistics = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<Statistics>({
    totalWorkouts: 0,
    totalWeight: 0,
    averageWeight: 0,
    averageReps: 0,
    currentWorkoutStreak: 0,
    longestWorkoutStreak: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setStatistics({
        totalWorkouts: 0,
        totalWeight: 0,
        averageWeight: 0,
        averageReps: 0,
        currentWorkoutStreak: 0,
        longestWorkoutStreak: 0,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const workoutsRef = collection(db, "workouts");
      const workoutsQuery = query(
        workoutsRef, 
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );

              const unsubscribe = onSnapshot(
          workoutsQuery, 
          (snapshot) => {
            try {
              const workouts: Workout[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              const totalWorkouts = workouts.length;
              const totalWeight = workouts.reduce((workoutSum, workout) => {
                if (!workout.exercises) return workoutSum;
                return workoutSum + workout.exercises.reduce((exerciseSum, exercise) => {
                  if (!exercise.sets) return exerciseSum;
                  return exerciseSum + exercise.sets.reduce((setSum: number, set: any) => {
                    const weight = Number(set.weight) || 0;
                    const reps = Number(set.reps) || 0;
                    return setSum + (weight * reps);
                  }, 0);
                }, 0);
              }, 0);
              const averageWeight = totalWorkouts > 0 ? 
                Math.round((totalWeight / totalWorkouts) * 100) / 100 : 0;
              const averageReps = (workouts: Workout[], totalWorkouts: number) => {
                const totalReps = workouts.reduce((workoutSum, workout) => {
                  if (!workout.exercises) return workoutSum;
                  return workoutSum + workout.exercises.reduce((exerciseSum, exercise) => {
                    if (!exercise.sets) return exerciseSum;
                    return exerciseSum + exercise.sets.reduce((setSum: number, set: any) => {
                      const reps = Number(set.reps) || 0;
                      return setSum + reps;
                    }, 0);
                  }, 0);
                }, 0);
                return totalWorkouts > 0 ? Math.round((totalReps / totalWorkouts) * 100) / 100 : 0;
              };
              const { currentWorkoutStreak, longestWorkoutStreak } = (() => {
                const workoutDates = workouts
                  .map(workoutObj => workoutObj.date?.toDate?.())
                  .filter(Boolean)
                  .map(workoutDate => { workoutDate.setHours(0, 0, 0, 0); return workoutDate; })
                  .sort((earlierDate: Date, laterDate: Date) => earlierDate.getTime() - laterDate.getTime());

                let maxStreak = 0, tempStreak = 0;
                let prevDate: Date | null = null;
                let today = new Date();
                today.setHours(0, 0, 0, 0);

                for (const date of workoutDates) {
                  if (!prevDate) {
                    tempStreak = 1;
                  } else {
                    const diffDays = Math.round((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) tempStreak += 1;
                    else if (diffDays === 0) {}
                    else tempStreak = 1;
                  }
                  maxStreak = Math.max(maxStreak, tempStreak);
                  prevDate = date;
                }

                let currentStreak = 0;
                prevDate = null;
                for (let i = workoutDates.length - 1; i >= 0; i--) {
                  const date = workoutDates[i];
                  if (!prevDate) {
                    if (
                      date.getTime() === today.getTime() ||
                      date.getTime() === today.getTime() - 24 * 60 * 60 * 1000
                    ) {
                      currentStreak = 1;
                    } else {
                      break;
                    }
                  } else {
                    const diffDays = Math.round((prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) currentStreak += 1;
                    else break;
                  }
                  prevDate = date;
                }
                return { currentWorkoutStreak: currentStreak, longestWorkoutStreak: maxStreak };
              })();
              
              setStatistics({
                totalWorkouts,
                totalWeight,
                averageWeight,
                averageReps: averageReps(workouts, totalWorkouts),
                currentWorkoutStreak,
                longestWorkoutStreak
              });
              setLoading(false);
          } catch (calcError) {
            console.error("Error calculating statistics:", calcError);
            setError("Failed to calculate statistics");
            setLoading(false);
          }
        },
        (firestoreError) => {
          console.error("Error fetching statistics:", firestoreError);
          setError("Failed to load statistics");
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (setupError) {
      console.error("Error setting up statistics listener:", setupError);
      setError("Failed to setup statistics");
      setLoading(false);
    }
  }, [user?.uid]);

  return { statistics, loading, error };
};