const workoutList = [
  // Bicep
  "Incline Hammer Curls",
  "Wide-grip barbell curl",
  "EZ-bar spider curl",
  "Zottman Curl",
  "Concentration curl",
  // Chest
  "Bench Press",
  "Incline Dumbbell Press",
  "Standing Cable Chest Fly",
  "Cable Chest Press",
  "Dumbbell Pullover",
  // Back
  "Barbell Row",
  "Barbell Shrug",
  "Lat Pulldown",
  "Dumbbell Deadlift",
  "Gorilla Row",
  // Leg
  "Barbell Squat",
  "Romanian Deadlift",
  "Leg Press",
  "Bulgarian Split Squat",
  "Reverse Dumbbell Lunge",
  // Core
  "Machine Crunch",
  "Weighted Plank",
  "Hollow Hold",
  "Oblique Crunch",
  "Cable Crunch",
  // Glute
  "Cable Pull Through",
  "Hip Abduction Machine",
  "Cable Kickback",
  "Smith Machine Hip Thrust",
  "Step Up",
  // Shoulder
  "Arnold Press",
  "Dumbbell Front Raise",
  "Cable Lateral Raise",
  "Cable Rear Delt Row",
  "Machine Shoulder Press",
  // Tricep
  "Barbell Incline Triceps Extension",
  "Crossbody Cable Triceps Extension",
  "Dumbbell Lying Triceps Extension",
  "Overhead Cable Triceps Extension",
  "Tricep Pushdown With Bar",
];

export default workoutList;

export const workoutMap = {
  Bicep: {
    title: "Bicep Routine",
    exercises: [
      { name: "Incline Hammer Curls", sets: [{ weight: 12, reps: 10 }, { weight: 12, reps: 10 }, { weight: 12, reps: 10 }] },
      { name: "Wide-grip barbell curl", sets: [{ weight: 15, reps: 10 }, { weight: 15, reps: 10 }, { weight: 15, reps: 10 }] },
      { name: "EZ-bar spider curl", sets: [{ weight: 14, reps: 10 }, { weight: 14, reps: 10 }, { weight: 14, reps: 10 }] },
      { name: "Zottman Curl", sets: [{ weight: 12, reps: 10 }, { weight: 12, reps: 10 }, { weight: 12, reps: 10 }] },
      { name: "Concentration curl", sets: [{ weight: 10, reps: 10 }, { weight: 10, reps: 10 }, { weight: 10, reps: 10 }] },
    ],
  },
  Chest: {
    title: "Chest Routine",
    exercises: [
      { name: "Bench Press", sets: [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 10 }] },
      { name: "Incline Dumbbell Press", sets: [{ weight: 22, reps: 10 }, { weight: 22, reps: 10 }, { weight: 22, reps: 10 }] },
      { name: "Standing Cable Chest Fly", sets: [{ weight: 17, reps: 10 }, { weight: 17, reps: 10 }, { weight: 17, reps: 10 }] },
      { name: "Cable Chest Press", sets: [{ weight: 18, reps: 10 }, { weight: 18, reps: 10 }, { weight: 18, reps: 10 }] },
      { name: "Dumbbell Pullover", sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 }] },
    ],
  },
  Back: {
    title: "Back Routine",
    exercises: [
      { name: "Barbell Row", sets: [{ weight: 55, reps: 10 }, { weight: 55, reps: 10 }, { weight: 55, reps: 10 }] },
      { name: "Barbell Shrug", sets: [{ weight: 65, reps: 10 }, { weight: 65, reps: 10 }, { weight: 65, reps: 10 }] },
      { name: "Lat Pulldown", sets: [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 10 }] },
      { name: "Dumbbell Deadlift", sets: [{ weight: 45, reps: 10 }, { weight: 45, reps: 10 }, { weight: 45, reps: 10 }] },
      { name: "Gorilla Row", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }, { weight: 35, reps: 10 }] },
    ],
  },
  Leg: {
    title: "Leg Routine",
    exercises: [
      { name: "Barbell Squat", sets: [{ weight: 90, reps: 10 }, { weight: 90, reps: 10 }, { weight: 90, reps: 10 }] },
      { name: "Romanian Deadlift", sets: [{ weight: 75, reps: 10 }, { weight: 75, reps: 10 }, { weight: 75, reps: 10 }] },
      { name: "Leg Press", sets: [{ weight: 130, reps: 10 }, { weight: 130, reps: 10 }, { weight: 130, reps: 10 }] },
      { name: "Bulgarian Split Squat", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }, { weight: 35, reps: 10 }] },
      { name: "Reverse Dumbbell Lunge", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
    ],
  },
  Core: {
    title: "Core Routine",
    exercises: [
      { name: "Machine Crunch", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
      { name: "Weighted Plank", sets: [{ weight: 10, reps: 30 }, { weight: 10, reps: 30 }, { weight: 10, reps: 30 }] },
      { name: "Hollow Hold", sets: [{ weight: 0, reps: 30 }, { weight: 0, reps: 30 }, { weight: 0, reps: 30 }] },
      { name: "Oblique Crunch", sets: [{ weight: 0, reps: 12 }, { weight: 0, reps: 12 }, { weight: 0, reps: 12 }] },
      { name: "Cable Crunch", sets: [{ weight: 22, reps: 10 }, { weight: 22, reps: 10 }, { weight: 22, reps: 10 }] },
    ],
  },
  Glute: {
    title: "Glute Routine",
    exercises: [
      { name: "Cable Pull Through", sets: [{ weight: 35, reps: 10 }, { weight: 35, reps: 10 }, { weight: 35, reps: 10 }] },
      { name: "Hip Abduction Machine", sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }] },
      { name: "Cable Kickback", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 10 }, { weight: 25, reps: 10 }] },
      { name: "Smith Machine Hip Thrust", sets: [{ weight: 75, reps: 10 }, { weight: 75, reps: 10 }, { weight: 75, reps: 10 }] },
      { name: "Step Up", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 10 }, { weight: 25, reps: 10 }] },
    ],
  },
  Shoulder: {
    title: "Shoulder Routine",
    exercises: [
      { name: "Arnold Press", sets: [{ weight: 25, reps: 10 }, { weight: 25, reps: 10 }, { weight: 25, reps: 10 }] },
      { name: "Dumbbell Front Raise", sets: [{ weight: 14, reps: 10 }, { weight: 14, reps: 10 }, { weight: 14, reps: 10 }] },
      { name: "Cable Lateral Raise", sets: [{ weight: 17, reps: 10 }, { weight: 17, reps: 10 }, { weight: 17, reps: 10 }] },
      { name: "Cable Rear Delt Row", sets: [{ weight: 17, reps: 10 }, { weight: 17, reps: 10 }, { weight: 17, reps: 10 }] },
      { name: "Machine Shoulder Press", sets: [{ weight: 45, reps: 10 }, { weight: 45, reps: 10 }, { weight: 45, reps: 10 }] },
    ],
  },
  Tricep: {
    title: "Tricep Routine",
    exercises: [
      { name: "Barbell Incline Triceps Extension", sets: [{ weight: 27, reps: 10 }, { weight: 27, reps: 10 }, { weight: 27, reps: 10 }] },
      { name: "Crossbody Cable Triceps Extension", sets: [{ weight: 22, reps: 10 }, { weight: 22, reps: 10 }, { weight: 22, reps: 10 }] },
      { name: "Dumbbell Lying Triceps Extension", sets: [{ weight: 17, reps: 10 }, { weight: 17, reps: 10 }, { weight: 17, reps: 10 }] },
      { name: "Overhead Cable Triceps Extension", sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 10 }, { weight: 20, reps: 10 }] },
      { name: "Tricep Pushdown With Bar", sets: [{ weight: 32, reps: 10 }, { weight: 32, reps: 10 }, { weight: 32, reps: 10 }] },
    ],
  },
};
