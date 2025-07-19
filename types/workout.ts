export interface ExerciseSet {
    weight: number;
    reps: number;
}

export interface ExerciseEntry {
    name: string;
    sets: ExerciseSet[];
}

export interface SavedWorkout {
    userId?: string;
    id?: string;
    exercises: ExerciseEntry[];
    date: Date;
    duration?: number;
    workoutScore: number;
}


