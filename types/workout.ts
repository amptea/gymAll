export interface ExerciseSet {
    weight: string;
    reps: string;
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
}


