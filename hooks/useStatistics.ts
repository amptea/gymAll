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
}

export const useStatistics = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<Statistics>({
    totalWorkouts: 0,
    totalWeight: 0,
    averageWeight: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setStatistics({
        totalWorkouts: 0,
        totalWeight: 0,
        averageWeight: 0,
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
              
              setStatistics({
                totalWorkouts,
                totalWeight,
                averageWeight
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