import workoutList, { workoutMap } from "@/assets/workoutList/exercises";
import AddExerciseModal from "@/components/AddExerciseModal";
import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { ExerciseEntry, SavedRoutine, SavedWorkout } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackIcon from "../../assets/icons/back.png";
import BicepsIcon from "../../assets/icons/biceps.png";
import ChestIcon from "../../assets/icons/chest.png";
import CoreIcon from "../../assets/icons/core.png";
import GluteIcon from "../../assets/icons/glute.png";
import LegIcon from "../../assets/icons/leg.png";
import ShoulderIcon from "../../assets/icons/shoulder.png";
import TricepIcon from "../../assets/icons/triceps.png";

const WorkoutScreen: React.FC = () => {
  const { user } = useAuth();

  /* Handle Exercise Entries*/
  const [addExercisePage, setAddExercisePage] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [workoutStartedPage, setWorkoutStartedPage] = useState(false);
  const [addedExercises, setAddedExercises] = useState<ExerciseEntry[]>([]);
  const [addedExercisesCache, setAddedExercisesCache] = useState<
    ExerciseEntry[]
  >([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  /* Handle Workout Editing*/
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(
    null
  );
  const [workoutDetailPage, setWorkoutDetailPage] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [editWorkoutPage, setEditWorkoutPage] = useState(false);
  const [currentWorkoutEdited, setCurrentWorkoutEdited] =
    useState<SavedWorkout | null>(null);

  /* Handle Score*/
  const [weight, setWeight] = useState(0);
  const [score, setScore] = useState(0);

  /* Handle Time*/
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  /* Handle Routines*/
  const [addRoutinePage, setAddRoutinePage] = useState(false);
  const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>([]);
  const [currentRoutineEdited, setCurrentRoutineEdited] =
    useState<SavedRoutine | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<SavedRoutine | null>(
    null
  );
  const [routineStartedPage, setRoutineStartedPage] = useState(false);
  const [routineTitle, setRoutineTitle] = useState("");
  const [editRoutinePage, setEditRoutinePage] = useState(false);
  const [routineDetailPage, setRoutineDetailPage] = useState(false);

  /*Handle Explore Page */
  const [explorePage, setExplorePage] = useState(false);
  const [otherUsersRoutines, setOtherUsersRoutines] = useState<SavedRoutine[]>(
    []
  );
  const [recommendedWorkoutPage, setRecommendedWorkoutPage] = useState(false);
  const muscleGroups = [
    "Bicep",
    "Chest",
    "Back",
    "Leg",
    "Core",
    "Glute",
    "Shoulder",
    "Tricep",
  ] as const;

  const muscleGroupIcons = {
    Bicep: BicepsIcon,
    Chest: ChestIcon,
    Back: BackIcon,
    Leg: LegIcon,
    Core: CoreIcon,
    Glute: GluteIcon,
    Shoulder: ShoulderIcon,
    Tricep: TricepIcon,
  };

  useEffect(() => {
    if (user) {
      loadWorkoutsFromFirestore();
      loadUserInfo();
      loadRoutinesFromFirestore();
      loadOthersRoutinesFromFirestore();
    }
  }, [user]);

  const filteredWorkouts = workoutList.filter((item) =>
    item.toLowerCase().includes(searchText.toLowerCase())
  );

  const cancelWorkout = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setAddedExercises([]);
    setWorkoutDuration("");
    setWorkoutStartedPage(false);
    setElapsedTime(0);
    setStartTime(null);
  };

  const finishWorkout = async () => {
    if (weight === 0) {
      Alert.alert(
        "Please update youur weight in the profile page before saving workouts."
      );
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const durationInMinutes = Math.floor(elapsedTime / 60);
    const durationInSeconds = elapsedTime % 60;
    const duration = durationInMinutes + "m " + durationInSeconds + "s";

    if (addedExercises.length > 0 && user) {
      try {
        const newWorkout: SavedWorkout = {
          userId: user.uid,
          exercises: addedExercises,
          date: new Date(),
          duration: duration,
          workoutScore: 0,
        };

        const workoutId = await saveWorkoutToFirestore(newWorkout);

        if (workoutId) {
          const savedWorkout = { ...newWorkout, id: workoutId };
          setSavedWorkouts((previous) => [savedWorkout, ...previous]);
        }

        setAddedExercises([]);
        setWorkoutDuration("");
        setElapsedTime(0);
        setStartTime(null);
        setWorkoutStartedPage(false);
      } catch (error) {
        Alert.alert("Error", "Workout not saved successfully");
      }
    }
  };

  const finishRoutine = async () => {
    if (addedExercises.length > 0 && user) {
      try {
        const newRoutine: SavedRoutine = {
          userId: user.uid,
          exercises: addedExercises,
          title: routineTitle,
        };

        const routineId = await saveRoutineToFirestore(newRoutine);

        if (routineId) {
          const savedRoutines = { ...newRoutine, id: routineId };
          setSavedRoutines((previous) => [savedRoutines, ...previous]);
        }

        setAddedExercises([]);
        setRoutineTitle("");
        setRoutineStartedPage(false);
      } catch (error) {
        Alert.alert("Error", "Workout not saved successfully");
      }
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  function formatDuration(elapsedTime: number): string {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    return (
      minutes.toString().padStart(2, "0") +
      " : " +
      seconds.toString().padStart(2, "0")
    );
  }

  const getTotalSets = (exercises: ExerciseEntry[]) => {
    return exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0
    );
  };

  const openWorkoutDetail = (workout: SavedWorkout) => {
    setSelectedWorkout(workout);
    setWorkoutDetailPage(true);
  };

  const openRoutineDetail = (routine: SavedRoutine) => {
    setSelectedRoutine(routine);
    setRoutineDetailPage(true);
  };

  const startEditWorkout = (workout: SavedWorkout) => {
    setCurrentWorkoutEdited(workout);
    setAddedExercisesCache(addedExercises);
    setAddedExercises([...workout.exercises]);
    setEditWorkoutPage(true);
    setWorkoutDetailPage(false);
  };

  const startEditRoutine = (routine: SavedRoutine) => {
    setCurrentRoutineEdited(routine);
    setAddedExercisesCache(addedExercises);
    setAddedExercises([...routine.exercises]);
    setRoutineTitle(routine.title);
    setEditRoutinePage(true);
    setRoutineDetailPage(false);
  };

  const saveEditedWorkout = async () => {
    if (currentWorkoutEdited && addedExercises.length > 0) {
      try {
        const updatedWorkout: SavedWorkout = {
          ...currentWorkoutEdited,
          exercises: addedExercises,
        };

        if (currentWorkoutEdited.id) {
          await updateWorkoutInFirestore(
            currentWorkoutEdited.id,
            updatedWorkout
          );
        }
        setSavedWorkouts((previous) =>
          previous.map((workout) =>
            workout === currentWorkoutEdited ? updatedWorkout : workout
          )
        );

        setCurrentWorkoutEdited(null);
        setAddedExercises(addedExercisesCache);
        setEditWorkoutPage(false);
      } catch (error) {
        Alert.alert("Error", "Workout not updated successfully");
      }
    }
  };

  const saveEditedRoutine = async () => {
    if (currentRoutineEdited && addedExercises.length > 0) {
      try {
        const updatedRoutine: SavedRoutine = {
          ...currentRoutineEdited,
          exercises: addedExercises,
          title: routineTitle,
        };

        if (currentRoutineEdited.id) {
          await updateRoutineInFirestore(
            currentRoutineEdited.id,
            updatedRoutine
          );
        }
        setSavedRoutines((previous) =>
          previous.map((routine) =>
            routine === currentRoutineEdited ? updatedRoutine : routine
          )
        );

        setCurrentRoutineEdited(null);
        setAddedExercises(addedExercisesCache);
        setRoutineTitle("");
        setEditRoutinePage(false);
      } catch (error) {
        Alert.alert("Error", "Workout not updated successfully");
      }
    }
  };

  const cancelEditWorkout = () => {
    setCurrentWorkoutEdited(null);
    setAddedExercises(addedExercisesCache);
    setEditWorkoutPage(false);
  };

  const cancelEditRoutine = () => {
    setCurrentRoutineEdited(null);
    setAddedExercises(addedExercisesCache);
    setRoutineTitle("");
    setEditRoutinePage(false);
  };

  const removeExerciseFromEdit = (exerciseIndex: number) => {
    setAddedExercises((previous) =>
      previous.filter((_, index) => index !== exerciseIndex)
    );
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      await deleteWorkoutFromFirestore(workoutId);
      setSavedWorkouts((previous) =>
        previous.filter((workout) => workout.id !== workoutId)
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete workout");
    }
  };

  const deleteRoutine = async (routineId: string) => {
    try {
      await deleteRoutineFromFirestore(routineId);
      setSavedRoutines((previous) =>
        previous.filter((routine) => routine.id !== routineId)
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete routine");
    }
  };

  const loadWorkoutsFromFirestore = async () => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const workoutRef = collection(db, "workouts");
      const workoutList = await getDocs(workoutRef);
      const workouts: SavedWorkout[] = [];

      workoutList.forEach((doc) => {
        const data = doc.data();
        if (data.userId === user.uid) {
          workouts.push({
            userId: data.userId,
            id: doc.id,
            exercises: data.exercises,
            date: data.date.toDate(),
            duration: data.duration,
            workoutScore: data.workoutScore,
          });
        }
      });
      setSavedWorkouts(workouts);
    } catch (error) {
      Alert.alert("Error", "Failed to load workouts");
    }
  };

  const loadRoutinesFromFirestore = async () => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const routineRef = collection(db, "routines");
      const routineList = await getDocs(routineRef);
      const routines: SavedRoutine[] = [];

      routineList.forEach((doc) => {
        const data = doc.data();
        if (data.userId === user.uid) {
          routines.push({
            userId: data.userId,
            id: doc.id,
            exercises: data.exercises,
            title: data.title,
          });
        }
      });
      setSavedRoutines(routines);
    } catch (error) {
      Alert.alert("Error", "Failed to load routines");
    }
  };

  const loadOthersRoutinesFromFirestore = async () => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const routineRef = collection(db, "routines");
      const routineList = await getDocs(routineRef);
      const routines: SavedRoutine[] = [];

      routineList.forEach((doc) => {
        const data = doc.data();
        if (data.userId !== user.uid) {
          routines.push({
            userId: data.userId,
            id: doc.id,
            exercises: data.exercises,
            title: data.title,
          });
        }
      });
      setOtherUsersRoutines(routines);
    } catch (error) {
      Alert.alert("Error", "Failed to load routines");
    }
  };

  const saveWorkoutToFirestore = async (workout: SavedWorkout) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    try {
      const addedScore = calculateScore(workout);
      const workoutData = {
        userId: user.uid,
        exercises: workout.exercises,
        date: workout.date,
        duration: workout.duration,
        workoutScore: addedScore,
      };
      const workoutsRef = collection(db, "workouts");
      const workoutsDoc = await addDoc(workoutsRef, workoutData);
      setScore(score + addedScore);
      saveScore(addedScore);

      return workoutsDoc.id;
    } catch (error) {
      Alert.alert("Error", "Unable to save workout");
    }
  };

  const saveRoutineToFirestore = async (routine: SavedRoutine) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    try {
      const routineData = {
        userId: user.uid,
        exercises: routine.exercises,
        title: routine.title,
      };
      const routinesRef = collection(db, "routines");
      const routinesDoc = await addDoc(routinesRef, routineData);

      return routinesDoc.id;
    } catch (error) {
      Alert.alert("Error", "Unable to save workout");
    }
  };

  const updateWorkoutInFirestore = async (
    workoutId: string,
    updatedWorkout: SavedWorkout
  ) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const workoutRef = doc(db, "workouts", workoutId);
      const oldWorkoutSnapshot = await getDoc(workoutRef);
      const oldWorkoutData = oldWorkoutSnapshot.exists()
        ? oldWorkoutSnapshot.data()
        : null;
      const oldWorkoutScore = oldWorkoutData?.workoutScore ?? 0;
      const newScore = calculateScore(updatedWorkout);
      const addedScore = newScore - oldWorkoutScore;
      setScore(score + addedScore);
      await saveScore(addedScore);

      await updateDoc(workoutRef, {
        exercises: updatedWorkout.exercises,
        duration: updatedWorkout.duration,
        workoutScore: newScore,
      });
    } catch (error) {
      Alert.alert("Error", "Unable to update workout");
    }
  };

  const updateRoutineInFirestore = async (
    routineId: string,
    updatedRoutine: SavedRoutine
  ) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const routineRef = doc(db, "routines", routineId);
      const oldRoutineSnapshot = await getDoc(routineRef);
      const oldRoutineData = oldRoutineSnapshot.exists()
        ? oldRoutineSnapshot.data()
        : null;

      await updateDoc(routineRef, {
        exercises: updatedRoutine.exercises,
        title: updatedRoutine.title,
      });
    } catch (error) {
      Alert.alert("Error", "Unable to update workout");
    }
  };

  const deleteWorkoutFromFirestore = async (workoutId: string) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const workoutRef = doc(db, "workouts", workoutId);
      const oldSnapshot = await getDoc(workoutRef);
      if (oldSnapshot.exists()) {
        const oldData = oldSnapshot.data();
        const deletedScore = oldData.workoutScore ?? 0;
        await saveScore(-deletedScore);
        setScore(score - deletedScore);
      }
      await deleteDoc(workoutRef);
    } catch (error) {
      Alert.alert("Error", "Unable to delete workout");
    }
  };

  const deleteRoutineFromFirestore = async (routineId: string) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const routineRef = doc(db, "routines", routineId);
      await deleteDoc(routineRef);
    } catch (error) {
      Alert.alert("Error", "Unable to delete routine");
    }
  };

  const loadUserInfo = async () => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setWeight(data.weight);
        setScore(data.score);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to load weight");
    }
  };

  const saveScore = async (addedScore: number) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);
      if (userSnapshot.exists()) {
        const newScore = score + addedScore;
        setScore(newScore);

        await updateDoc(userRef, {
          score: newScore,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Unable to save score");
    }
  };

  const calculateScore = (workout: SavedWorkout) => {
    if (weight === 0) return 0;

    const exercises = workout.exercises;
    return exercises.reduce((totalScore, exercise) => {
      const exerciseScore = exercise.sets.reduce((setScore, set) => {
        return setScore + (set.weight / weight) * set.reps;
      }, 0);
      return totalScore + exerciseScore;
    }, 0);
  };

  const exerciseAlreadyAdded = (name: string) =>
    addedExercises.some((exercise) => exercise.name === name);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Workout</Text>
      </View>

      <View style={styles.routinesSection}>
        <Text style={styles.subHeader}>Routines</Text>
        <View style={styles.routineRow}>
          {/* My Routines Button*/}
          <TouchableOpacity
            style={styles.routineBox}
            onPress={() => setAddRoutinePage(true)}
          >
            <Ionicons name="document-text-outline" size={24} color="white" />
            <Text style={styles.routineText}>My Routines</Text>
          </TouchableOpacity>
          {/* Explore Routines Button*/}
          <TouchableOpacity
            style={styles.routineBox}
            onPress={() => setExplorePage(true)}
          >
            <Ionicons name="search" size={24} color="white" />
            <Text style={styles.routineText}>Explore Routines</Text>
          </TouchableOpacity>
        </View>
        {/*My Routines Page */}
        <Modal
          visible={addRoutinePage}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.addRoutineModal}>
            <View style={styles.workoutProgressHeader}>
              <TouchableOpacity
                onPress={() => setAddRoutinePage(false)}
                style={styles.downButton}
              >
                <Ionicons
                  name="chevron-back"
                  size={28}
                  color="rgba(255, 255, 255, 1)"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                />
              </TouchableOpacity>
              <Text style={styles.headerText}>Routines</Text>
            </View>

            <ScrollView style={{ flex: 1 }}>
              {savedRoutines.length > 0 ? (
                <View
                  style={[
                    styles.previousWorkoutsSection,
                    { paddingLeft: 30, paddingRight: 30 },
                  ]}
                >
                  <Text style={styles.subHeader}>My Routines</Text>
                  <View style={styles.gridContainer}>
                    {savedRoutines.map((routine, routineIndex) => (
                      <TouchableOpacity
                        key={routineIndex}
                        style={styles.routineCard}
                        onPress={() => openRoutineDetail(routine)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.routineCardHeader}>
                          <Text style={styles.routineHeader}>
                            {routine.title}
                          </Text>
                        </View>

                        <View style={styles.workoutCardBody}>
                          <Text style={styles.exercisePreviewText}>
                            {routine.exercises
                              .slice(0, 1)
                              .map((exercise) => exercise.name)
                              .join(", ")}
                            {routine.exercises.length > 1 &&
                              ` +${routine.exercises.length - 1} more`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.previousWorkoutsSection}>
                  <Text style={styles.subHeader}>My Routines</Text>
                  <View style={styles.emptyStateContainer}>
                    <Ionicons
                      name="barbell-outline"
                      size={48}
                      color="rgba(255,255,255,0.3)"
                    />
                    <Text style={styles.noWorkoutsText}>
                      No routines saved yet
                    </Text>
                    <Text style={styles.noWorkoutsSubText}>
                      Save your first routine now!
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={[styles.workoutButtonSection, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.startWorkoutButton}
                onPress={() => {
                  setRoutineStartedPage(true);
                }}
              >
                <Text style={styles.workoutButtonText}>Add new routine</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/*Add new routines page*/}
          <Modal
            visible={routineStartedPage}
            animationType="slide"
            transparent={false}
          >
            <SafeAreaView style={[styles.workoutProgressOverlay]}>
              <View style={styles.addRoutineHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setRoutineStartedPage(false), setAddedExercises([]);
                  }}
                  style={styles.downButton}
                >
                  <Ionicons
                    name="chevron-down"
                    size={28}
                    color="rgb(255, 255, 255)"
                  />
                </TouchableOpacity>
                <View style={styles.routineTitleContainer}>
                  <Ionicons name="pencil" size={18} color="#aaa" />
                  <TextInput
                    placeholder="Enter Routine Title"
                    placeholderTextColor="rgba(170,170,170,1)"
                    value={routineTitle}
                    onChangeText={(text) => {
                      setRoutineTitle(text);
                    }}
                    style={styles.routineTitleInput}
                  />
                </View>

                <TouchableOpacity
                  style={styles.finishWorkoutButton}
                  onPress={finishRoutine}
                >
                  <Text style={styles.workoutButtonText}>Finish</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.workoutProgressContent}>
                <View style={styles.scrollableContent}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {addedExercises.length === 0 ? (
                      <Text style={styles.noExercisesText}>
                        No exercises added.
                      </Text>
                    ) : (
                      addedExercises.map((exercise, exerciseIndex) => (
                        <View key={exerciseIndex} style={styles.addedExercises}>
                          <View style={styles.editExerciseHeader}>
                            <Text style={styles.exercisesAddedText}>
                              {exercise.name}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                removeExerciseFromEdit(exerciseIndex)
                              }
                              style={styles.editWorkoutButton}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color="#ff4c4c"
                              />
                            </TouchableOpacity>
                          </View>
                          {exercise.sets.map((set, setIndex) => (
                            <View
                              key={setIndex}
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginBottom: 8,
                              }}
                            >
                              <TextInput
                                placeholder="Weight"
                                placeholderTextColor="rgba(170,170,170,1)"
                                value={
                                  set.weight === 0 ? "" : set.weight.toString()
                                }
                                onChangeText={(text) => {
                                  const updated = [...addedExercises];
                                  updated[exerciseIndex].sets[setIndex].weight =
                                    Number(text);
                                  setAddedExercises(updated);
                                }}
                                style={styles.setInput}
                                keyboardType="numeric"
                              />
                              <TextInput
                                placeholder="Reps"
                                placeholderTextColor="rgba(170,170,170,1)"
                                value={
                                  set.reps === 0 ? "" : set.reps.toString()
                                }
                                onChangeText={(text) => {
                                  const updated = [...addedExercises];
                                  updated[exerciseIndex].sets[setIndex].reps =
                                    Number(text);
                                  setAddedExercises(updated);
                                }}
                                style={styles.setInput}
                                keyboardType="numeric"
                              />
                              <TouchableOpacity
                                onPress={() => {
                                  const updated = [...addedExercises];
                                  updated[exerciseIndex].sets.splice(
                                    setIndex,
                                    1
                                  );
                                  setAddedExercises(updated);
                                }}
                              >
                                <Ionicons
                                  name="close"
                                  size={32}
                                  color="red"
                                  style={{ paddingRight: 2 }}
                                />
                              </TouchableOpacity>
                            </View>
                          ))}
                          <TouchableOpacity
                            onPress={() => {
                              const updated = [...addedExercises];
                              updated[exerciseIndex].sets.push({
                                weight: 0,
                                reps: 0,
                              });
                              setAddedExercises(updated);
                            }}
                          >
                            <Text style={styles.addSetText}>+ Add Set</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.fixedButtonsContainer}>
                <TouchableOpacity
                  style={styles.routineAddExerciseButton}
                  onPress={() => setAddExercisePage(true)}
                >
                  <Text style={styles.workoutButtonText}>Add Exercise</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>

            {/* Modal to add exercises to new routine*/}
            <AddExerciseModal
              visible={addExercisePage}
              onClose={() => {
                setAddExercisePage(false);
                setSearchText("");
              }}
              searchText={searchText}
              setSearchText={setSearchText}
              filteredWorkouts={filteredWorkouts}
              addedExercises={addedExercises}
              setAddedExercises={setAddedExercises}
              exerciseAlreadyAdded={exerciseAlreadyAdded}
              onExerciseClicked={(exercise) => setSelectedExercise(exercise)}
              selected={selectedExercise}
              styles={styles}
            />
          </Modal>

          {/* Modal to show detailed information about a routine*/}
          <Modal
            visible={routineDetailPage}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.workoutDetailOverlay}>
              <View style={styles.workoutDetailContent}>
                <View style={styles.workoutDetailHeader}>
                  <View>
                    <Text
                      style={[
                        styles.workoutDetailTitle,
                        { paddingLeft: 14, paddingTop: 5 },
                      ]}
                    >
                      {selectedRoutine?.title}
                    </Text>
                  </View>
                  <View style={styles.workoutDetailActions}>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          "Delete Workout",
                          "Are you sure you want to delete this workout?",
                          [
                            {
                              text: "Cancel",
                            },
                            {
                              text: "Delete",
                              onPress: async () => {
                                if (selectedRoutine?.id) {
                                  await deleteRoutine(selectedRoutine.id);
                                  setRoutineDetailPage(false);
                                }
                              },
                            },
                          ]
                        )
                      }
                      style={styles.deleteWorkoutButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        selectedRoutine && startEditRoutine(selectedRoutine)
                      }
                      style={styles.editWorkoutButton}
                    >
                      <Ionicons name="create-outline" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setRoutineDetailPage(false)}
                      style={styles.editWorkoutButton}
                    >
                      <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView>
                  {selectedRoutine?.exercises.map((exercise, exerciseIndex) => (
                    <View
                      key={exerciseIndex}
                      style={styles.exerciseDetailsCard}
                    >
                      <Text style={styles.exerciseDetailsName}>
                        {exercise.name}
                      </Text>
                      <View style={styles.detailSetsContainer}>
                        {exercise.sets.map((set, setIndex) => (
                          <View key={setIndex} style={styles.detailsCardRow}>
                            <Text style={styles.detailsSetNumber}>
                              Set {setIndex + 1}
                            </Text>
                            <Text style={styles.detailsCardText}>
                              {set.weight ? `${set.weight} kg` : "Bodyweight"} ×{" "}
                              {set.reps} reps
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.workoutButtonSection}>
                  <TouchableOpacity
                    style={styles.startWorkoutButton}
                    onPress={() => {
                      setStartTime(new Date());
                      setElapsedTime(0);
                      if (timerRef.current) {
                        clearInterval(timerRef.current);
                      }

                      timerRef.current = setInterval(() => {
                        setElapsedTime((prev) => prev + 1);
                      }, 1000);
                      setAddedExercises([
                        ...(selectedRoutine?.exercises || []),
                      ]);
                      setWorkoutStartedPage(true);
                    }}
                  >
                    <Text style={styles.workoutButtonText}>
                      Start Routine Workout
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {/* Started workout for saved routine in progress displayed, allow editing reps, weights and exercises*/}
            <Modal
              visible={workoutStartedPage}
              animationType="slide"
              transparent={true}
            >
              <View style={styles.addRoutineModal}>
                <View style={styles.workoutProgressHeader}>
                  <TouchableOpacity
                    onPress={() => setWorkoutStartedPage(false)}
                    style={styles.downButton}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={28}
                      color="rgb(255, 255, 255)"
                    />
                  </TouchableOpacity>
                  <Text style={styles.headerText}>Current Workout</Text>

                  <TouchableOpacity
                    style={styles.finishWorkoutButton}
                    onPress={finishWorkout}
                  >
                    <Text style={styles.workoutButtonText}>Finish</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.workoutProgressContent}>
                  <View style={styles.scrollableContent}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <View style={styles.durationContainer}>
                        <Text style={styles.timerText}>
                          {formatDuration(elapsedTime)}
                        </Text>
                      </View>

                      {addedExercises.length === 0 ? (
                        <Text style={styles.noExercisesText}>
                          No exercises added.
                        </Text>
                      ) : (
                        addedExercises.map((exercise, exerciseIndex) => (
                          <View
                            key={exerciseIndex}
                            style={styles.addedExercises}
                          >
                            <View style={styles.editExerciseHeader}>
                              <Text style={styles.exercisesAddedText}>
                                {exercise.name}
                              </Text>
                              <TouchableOpacity
                                onPress={() =>
                                  removeExerciseFromEdit(exerciseIndex)
                                }
                                style={styles.editWorkoutButton}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={20}
                                  color="#ff4c4c"
                                />
                              </TouchableOpacity>
                            </View>
                            {exercise.sets.map((set, setIndex) => (
                              <View
                                key={setIndex}
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  marginBottom: 8,
                                }}
                              >
                                <TextInput
                                  placeholder="Weight"
                                  placeholderTextColor="rgba(170,170,170,1)"
                                  value={set.weight.toString()}
                                  onChangeText={(text) => {
                                    const updated = [...addedExercises];
                                    updated[exerciseIndex].sets[
                                      setIndex
                                    ].weight = Number(text);
                                    setAddedExercises(updated);
                                  }}
                                  style={styles.setInput}
                                  keyboardType="numeric"
                                />
                                <TextInput
                                  placeholder="Reps"
                                  placeholderTextColor="rgba(170,170,170,1)"
                                  value={set.reps.toString()}
                                  onChangeText={(text) => {
                                    const updated = [...addedExercises];
                                    updated[exerciseIndex].sets[setIndex].reps =
                                      Number(text);
                                    setAddedExercises(updated);
                                  }}
                                  style={styles.setInput}
                                  keyboardType="numeric"
                                />
                                <TouchableOpacity
                                  onPress={() => {
                                    const updated = [...addedExercises];
                                    updated[exerciseIndex].sets.splice(
                                      setIndex,
                                      1
                                    );
                                    setAddedExercises(updated);
                                  }}
                                >
                                  <Ionicons
                                    name="close"
                                    size={32}
                                    color="red"
                                    style={{ paddingRight: 2 }}
                                  />
                                </TouchableOpacity>
                              </View>
                            ))}
                            <TouchableOpacity
                              onPress={() => {
                                const updated = [...addedExercises];
                                updated[exerciseIndex].sets.push({
                                  weight: 0,
                                  reps: 0,
                                });
                                setAddedExercises(updated);
                              }}
                            >
                              <Text style={styles.addSetText}>+ Add Set</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </ScrollView>
                  </View>

                  <View style={styles.fixedButtonsContainer}>
                    <TouchableOpacity
                      style={styles.cancelWorkoutButton}
                      onPress={cancelWorkout}
                    >
                      <Text style={styles.workoutButtonText}>
                        Cancel Workout
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.addExerciseButton}
                      onPress={() => setAddExercisePage(true)}
                    >
                      <Text style={styles.workoutButtonText}>Add Exercise</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Modal for adding exercises*/}
              <AddExerciseModal
                visible={addExercisePage}
                onClose={() => {
                  setAddExercisePage(false);
                  setSearchText("");
                }}
                searchText={searchText}
                setSearchText={setSearchText}
                filteredWorkouts={filteredWorkouts}
                addedExercises={addedExercises}
                setAddedExercises={setAddedExercises}
                exerciseAlreadyAdded={exerciseAlreadyAdded}
                onExerciseClicked={(exercise) => setSelectedExercise(exercise)}
                selected={selectedExercise}
                styles={styles}
              />
            </Modal>
          </Modal>

          {/* Modal to edit saved routines*/}
          <Modal
            visible={editRoutinePage}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.editWorkoutOverlay}>
              <View style={styles.editWorkoutContent}>
                <View style={styles.editWorkoutHeader}>
                  <View>
                    <Text style={styles.editWorkoutTitle}>Edit Routine</Text>
                    <View style={styles.editRoutineTitleContainer}>
                      <Ionicons name="pencil" size={18} color="#aaa" />
                      <TextInput
                        placeholder={selectedRoutine?.title}
                        placeholderTextColor="rgba(170,170,170,1)"
                        value={routineTitle}
                        onChangeText={(text) => {
                          setRoutineTitle(text);
                        }}
                        style={styles.routineTitleInput}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={cancelEditRoutine}
                    style={styles.editWorkoutButton}
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.editWorkoutScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.exercisesAddedText}>Exercises:</Text>

                  {addedExercises.map((exercise, exerciseIndex) => (
                    <View key={exerciseIndex} style={styles.editExerciseCard}>
                      <View style={styles.editExerciseHeader}>
                        <Text style={styles.exercisesAddedText}>
                          {exercise.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeExerciseFromEdit(exerciseIndex)}
                          style={styles.editWorkoutButton}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#ff4c4c"
                          />
                        </TouchableOpacity>
                      </View>

                      {exercise.sets.map((set, setIndex) => (
                        <View key={setIndex} style={styles.editSetRow}>
                          <Text style={styles.setNumberText}>
                            Set {setIndex + 1}
                          </Text>
                          <TextInput
                            placeholder="Weight"
                            placeholderTextColor="rgba(170,170,170,1)"
                            value={set.weight.toString()}
                            onChangeText={(text) => {
                              const updated = [...addedExercises];
                              updated[exerciseIndex].sets[setIndex].weight =
                                Number(text);
                              setAddedExercises(updated);
                            }}
                            style={styles.editSetInput}
                            keyboardType="numeric"
                          />
                          <TextInput
                            placeholder="Reps"
                            placeholderTextColor="rgba(170,170,170,1)"
                            value={set.reps.toString()}
                            onChangeText={(text) => {
                              const updated = [...addedExercises];
                              updated[exerciseIndex].sets[setIndex].reps =
                                Number(text);
                              setAddedExercises(updated);
                            }}
                            style={styles.editSetInput}
                            keyboardType="numeric"
                          />
                          <TouchableOpacity
                            onPress={() => {
                              const updated = [...addedExercises];
                              updated[exerciseIndex].sets.splice(setIndex, 1);
                              setAddedExercises(updated);
                            }}
                          >
                            <Ionicons name="close" size={32} color="red" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      <TouchableOpacity
                        onPress={() => {
                          const updated = [...addedExercises];
                          updated[exerciseIndex].sets.push({
                            weight: 0,
                            reps: 0,
                          });
                          setAddedExercises(updated);
                        }}
                        style={styles.editWorkoutButton}
                      >
                        <Text style={styles.addSetText}>+ Add Set</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.editWorkoutFooter}>
                  <TouchableOpacity
                    style={styles.addWorkouutButton}
                    onPress={() => setAddExercisePage(true)}
                  >
                    <Text style={styles.workoutButtonText}>+ Add Exercise</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.finishEditWorkoutButton}
                    onPress={() => {
                      saveEditedRoutine();
                    }}
                  >
                    <Text style={styles.workoutButtonText}>Finish</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {/* Modal to add exercises for routine you are currently editing*/}
            <AddExerciseModal
              visible={addExercisePage}
              onClose={() => {
                setAddExercisePage(false);
                setSearchText("");
              }}
              searchText={searchText}
              setSearchText={setSearchText}
              filteredWorkouts={filteredWorkouts}
              addedExercises={addedExercises}
              setAddedExercises={setAddedExercises}
              exerciseAlreadyAdded={exerciseAlreadyAdded}
              onExerciseClicked={(exercise) => setSelectedExercise(exercise)}
              selected={selectedExercise}
              styles={styles}
            />
          </Modal>
        </Modal>

        {/* Opens explore routines page*/}
        <Modal visible={explorePage} animationType="slide" transparent={false}>
          <View style={styles.addRoutineModal}>
            <View style={styles.workoutProgressHeader}>
              <TouchableOpacity
                onPress={() => setExplorePage(false)}
                style={styles.downButton}
              >
                <Ionicons
                  name="chevron-back"
                  size={28}
                  color="rgba(255, 255, 255, 1)"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                />
              </TouchableOpacity>
              <Text style={styles.headerText}>Explore Routines</Text>
            </View>

            <ScrollView style={{ flex: 1 }}>
              <Text style={styles.exploreSubheader}>Recommended Workouts</Text>
              {/* Horizontal scroll bar for recommended routines*/}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.exploreScrollView}
              >
                {muscleGroups.map((group, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.categoryCard}
                    onPress={() => {
                      setSelectedRoutine(workoutMap[group]);
                      setRecommendedWorkoutPage(true);
                    }}
                  >
                    <View style={styles.iconContainer}>
                      <Image
                        source={muscleGroupIcons[group]}
                        style={styles.icon}
                      />
                    </View>
                    <View style={styles.groupNameContainer}>
                      <Text style={styles.categoryText}>{group}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Vertical scroll interface for other routines by community members*/}
              <View style={{ flex: 1, paddingLeft: 14 }}>
                <Text style={styles.sectionHeader}>Your Community</Text>
                {otherUsersRoutines.length === 0 ? (
                  <Text style={styles.exploreCommunityEmpty}>
                    No routines found.
                  </Text>
                ) : (
                  otherUsersRoutines.map((routine) => (
                    <TouchableOpacity
                      key={routine.id}
                      onPress={() => {
                        setSelectedRoutine(routine);
                        setRecommendedWorkoutPage(true);
                      }}
                    >
                      <View style={styles.othersRoutineCard}>
                        <Text style={styles.othersRoutineTitle}>
                          {routine.title}
                        </Text>
                        <Text style={styles.exerciseList}>
                          {routine.exercises
                            .slice(0, 2)
                            .map((exercise) => exercise.name)
                            .join(", ")}{" "}
                          {routine.exercises.length > 2 &&
                            ` +${routine.exercises.length - 2} more`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
          {/*Displays details of recommended workouts*/}
          <Modal
            visible={recommendedWorkoutPage}
            animationType="slide"
            transparent={false}
          >
            <View style={styles.workoutDetailOverlay}>
              <View style={styles.workoutDetailContent}>
                <View style={styles.workoutDetailHeader}>
                  <View>
                    <Text
                      style={[
                        styles.workoutDetailTitle,
                        { paddingLeft: 14, fontSize: 22, paddingTop: 6 },
                      ]}
                    >
                      {selectedRoutine?.title} Exercises
                    </Text>
                  </View>
                  <View style={styles.workoutDetailActions}>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          "Confirm Save",
                          "Are you sure you want to save?",
                          [
                            { text: "Cancel" },
                            {
                              text: "Save",
                              onPress: async () => {
                                if (selectedRoutine) {
                                  try {
                                    const routineId =
                                      await saveRoutineToFirestore(
                                        selectedRoutine
                                      );
                                    if (routineId) {
                                      const savedRoutine = {
                                        ...selectedRoutine,
                                        id: routineId,
                                        userId: user?.uid || "",
                                      };
                                      setSavedRoutines((previous) => [
                                        ...previous,
                                        savedRoutine,
                                      ]);
                                    }
                                    setRecommendedWorkoutPage(false);
                                  } catch (error) {
                                    Alert.alert(
                                      "Error",
                                      "Failed to save routine"
                                    );
                                  }
                                }
                              },
                            },
                          ],
                          { cancelable: true }
                        )
                      }
                      style={styles.editWorkoutButton}
                    >
                      <Ionicons name="save-outline" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setRecommendedWorkoutPage(false)}
                      style={styles.editWorkoutButton}
                    >
                      <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView>
                  {selectedRoutine?.exercises.map((exercise, exerciseIndex) => (
                    <View
                      key={exerciseIndex}
                      style={styles.exerciseDetailsCard}
                    >
                      <Text style={styles.exerciseDetailsName}>
                        {exercise.name}
                      </Text>
                      <View style={styles.detailSetsContainer}>
                        {exercise.sets.map((set, setIndex) => (
                          <View key={setIndex} style={styles.detailsCardRow}>
                            <Text style={styles.detailsSetNumber}>
                              Set {setIndex + 1}
                            </Text>
                            <Text style={styles.detailsCardText}>
                              {set.weight ? `${set.weight} kg` : "Bodyweight"} ×{" "}
                              {set.reps} reps
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </Modal>
      </View>

      {/* Previous workouts section in main workout screen*/}
      <View style={{ flex: 1 }}>
        <ScrollView>
          {savedWorkouts.length > 0 ? (
            <View style={styles.previousWorkoutsSection}>
              <Text style={styles.subHeader}>Previous Workouts</Text>
              {savedWorkouts.map((workout, workoutIndex) => (
                <TouchableOpacity
                  key={workoutIndex}
                  style={styles.workoutCard}
                  onPress={() => openWorkoutDetail(workout)}
                  activeOpacity={0.7}
                >
                  <View style={styles.workoutCardHeader}>
                    <View>
                      <Text style={styles.workoutDate}>
                        {formatDate(workout.date)}
                      </Text>
                      <Text style={styles.workoutTime}>
                        {formatTime(workout.date)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="rgba(255,255,255,0.4)"
                    />
                  </View>

                  <View style={styles.workoutCardBody}>
                    <View style={styles.workoutStats}>
                      <View style={styles.statsItem}>
                        <Text style={styles.statsNumber}>
                          {workout.exercises.length}
                        </Text>
                        <Text style={styles.statsLabel}>exercises</Text>
                      </View>
                      <View style={styles.statsItem}>
                        <Text style={styles.statsNumber}>
                          {getTotalSets(workout.exercises)}
                        </Text>
                        <Text style={styles.statsLabel}>sets</Text>
                      </View>
                      {workout.duration && (
                        <View style={styles.statsItem}>
                          <Text style={styles.statsNumber}>
                            {workout.duration}
                          </Text>
                          <Text style={styles.statsLabel}>duration</Text>
                        </View>
                      )}
                    </View>

                    <View>
                      <Text style={styles.exercisePreviewText}>
                        {workout.exercises
                          .slice(0, 3)
                          .map((exercise) => exercise.name)
                          .join(", ")}
                        {workout.exercises.length > 3 &&
                          ` +${workout.exercises.length - 3} more`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.previousWorkoutsSection}>
              <Text style={styles.subHeader}>Previous Workouts</Text>
              <View style={styles.emptyStateContainer}>
                <Ionicons
                  name="barbell-outline"
                  size={48}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.noWorkoutsText}>
                  No workouts recorded yet
                </Text>
                <Text style={styles.noWorkoutsSubText}>
                  Start your first workout now!
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Start button / In progress buttons*/}
      <View style={styles.workoutButtonSection}>
        {startTime && !workoutStartedPage ? (
          <View style={styles.workoutInProgressContainer}>
            <Text style={styles.workoutInProgressText}>
              Workout In Progress!
            </Text>
            <View style={styles.workoutInProgressButtons}>
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={() => setWorkoutStartedPage(true)}
              >
                <Ionicons
                  name="play-circle"
                  size={24}
                  color="rgba(30, 144, 255, 0.9)"
                />
                <Text style={styles.resumeButtonText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.discardButton}
                onPress={cancelWorkout}
              >
                <Ionicons
                  name="trash-bin"
                  size={24}
                  color="rgba(230, 25, 25, 0.9)"
                />

                <Text style={styles.discardButtonText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.startWorkoutButton}
            onPress={() => {
              setStartTime(new Date());
              setElapsedTime(0);
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }

              timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
              }, 1000);
              setWorkoutStartedPage(true);
            }}
          >
            <Text style={styles.workoutButtonText}>Start Workout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Open detailed information on completed workouts*/}
      <Modal
        visible={workoutDetailPage}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.workoutDetailOverlay}>
          <View style={styles.workoutDetailContent}>
            <View style={styles.workoutDetailHeader}>
              <View>
                <Text style={styles.workoutDetailTitle}>
                  {selectedWorkout ? formatDate(selectedWorkout.date) : ""}
                </Text>
                <Text style={styles.workoutDetailSubtitle}>
                  {selectedWorkout ? formatTime(selectedWorkout.date) : ""}
                </Text>
              </View>
              <View style={styles.workoutDetailActions}>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Delete Workout",
                      "Are you sure you want to delete this workout?",
                      [
                        {
                          text: "Cancel",
                        },
                        {
                          text: "Delete",
                          onPress: async () => {
                            if (selectedWorkout?.id) {
                              await deleteWorkout(selectedWorkout.id);
                              setWorkoutDetailPage(false);
                            }
                          },
                        },
                      ]
                    )
                  }
                  style={styles.deleteWorkoutButton}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    selectedWorkout && startEditWorkout(selectedWorkout)
                  }
                  style={styles.editWorkoutButton}
                >
                  <Ionicons name="create-outline" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setWorkoutDetailPage(false)}
                  style={styles.editWorkoutButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView>
              {selectedWorkout?.exercises.map((exercise, exerciseIndex) => (
                <View key={exerciseIndex} style={styles.exerciseDetailsCard}>
                  <Text style={styles.exerciseDetailsName}>
                    {exercise.name}
                  </Text>
                  <View style={styles.detailSetsContainer}>
                    {exercise.sets.map((set, setIndex) => (
                      <View key={setIndex} style={styles.detailsCardRow}>
                        <Text style={styles.detailsSetNumber}>
                          Set {setIndex + 1}
                        </Text>
                        <Text style={styles.detailsCardText}>
                          {set.weight ? `${set.weight} kg` : "Bodyweight"} ×{" "}
                          {set.reps} reps
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Current workout in progress displayed, allow editing reps, weights and exercises*/}
      <Modal
        visible={workoutStartedPage}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.addRoutineModal}>
          <View style={styles.workoutProgressHeader}>
            <TouchableOpacity
              onPress={() => setWorkoutStartedPage(false)}
              style={styles.downButton}
            >
              <Ionicons
                name="chevron-down"
                size={28}
                color="rgb(255, 255, 255)"
              />
            </TouchableOpacity>
            <Text style={styles.headerText}>Current Workout</Text>

            <TouchableOpacity
              style={styles.finishWorkoutButton}
              onPress={finishWorkout}
            >
              <Text style={styles.workoutButtonText}>Finish</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.workoutProgressContent}>
            <View style={styles.scrollableContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.durationContainer}>
                  <Text style={styles.timerText}>
                    {formatDuration(elapsedTime)}
                  </Text>
                </View>

                {addedExercises.length === 0 ? (
                  <Text style={styles.noExercisesText}>
                    No exercises added.
                  </Text>
                ) : (
                  addedExercises.map((exercise, exerciseIndex) => (
                    <View key={exerciseIndex} style={styles.addedExercises}>
                      <View style={styles.editExerciseHeader}>
                        <Text style={styles.exercisesAddedText}>
                          {exercise.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeExerciseFromEdit(exerciseIndex)}
                          style={styles.editWorkoutButton}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#ff4c4c"
                          />
                        </TouchableOpacity>
                      </View>
                      {exercise.sets.map((set, setIndex) => (
                        <View
                          key={setIndex}
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <TextInput
                            placeholder="Weight"
                            placeholderTextColor="rgba(170,170,170,1)"
                            value={set.weight.toString()}
                            onChangeText={(text) => {
                              const updated = [...addedExercises];
                              updated[exerciseIndex].sets[setIndex].weight =
                                Number(text);
                              setAddedExercises(updated);
                            }}
                            style={styles.setInput}
                            keyboardType="numeric"
                          />
                          <TextInput
                            placeholder="Reps"
                            placeholderTextColor="rgba(170,170,170,1)"
                            value={set.reps.toString()}
                            onChangeText={(text) => {
                              const updated = [...addedExercises];
                              updated[exerciseIndex].sets[setIndex].reps =
                                Number(text);
                              setAddedExercises(updated);
                            }}
                            style={styles.setInput}
                            keyboardType="numeric"
                          />
                          <TouchableOpacity
                            onPress={() => {
                              const updated = [...addedExercises];
                              updated[exerciseIndex].sets.splice(setIndex, 1);
                              setAddedExercises(updated);
                            }}
                          >
                            <Ionicons
                              name="close"
                              size={32}
                              color="red"
                              style={{ paddingRight: 2 }}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity
                        onPress={() => {
                          const updated = [...addedExercises];
                          updated[exerciseIndex].sets.push({
                            weight: 0,
                            reps: 0,
                          });
                          setAddedExercises(updated);
                        }}
                      >
                        <Text style={styles.addSetText}>+ Add Set</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            <View style={styles.fixedButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelWorkoutButton}
                onPress={cancelWorkout}
              >
                <Text style={styles.workoutButtonText}>Cancel Workout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={() => setAddExercisePage(true)}
              >
                <Text style={styles.workoutButtonText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Modal for adding exercises*/}
        <AddExerciseModal
          visible={addExercisePage}
          onClose={() => {
            setAddExercisePage(false);
            setSearchText("");
          }}
          searchText={searchText}
          setSearchText={setSearchText}
          filteredWorkouts={filteredWorkouts}
          addedExercises={addedExercises}
          setAddedExercises={setAddedExercises}
          exerciseAlreadyAdded={exerciseAlreadyAdded}
          onExerciseClicked={(exercise) => setSelectedExercise(exercise)}
          selected={selectedExercise}
          styles={styles}
        />
      </Modal>

      {/* Modal for editing previous workouts*/}
      <Modal visible={editWorkoutPage} animationType="slide" transparent={true}>
        <View style={styles.editWorkoutOverlay}>
          <View style={styles.editWorkoutContent}>
            <View style={styles.editWorkoutHeader}>
              <View>
                <Text style={styles.editWorkoutTitle}>Edit Workout</Text>
                <Text style={styles.editWorkoutSubtitle}>
                  {currentWorkoutEdited
                    ? formatDate(currentWorkoutEdited.date)
                    : ""}
                </Text>
              </View>
              <TouchableOpacity
                onPress={cancelEditWorkout}
                style={styles.editWorkoutButton}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editWorkoutScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.exercisesAddedText}>Exercises:</Text>

              {addedExercises.map((exercise, exerciseIndex) => (
                <View key={exerciseIndex} style={styles.editExerciseCard}>
                  <View style={styles.editExerciseHeader}>
                    <Text style={styles.exercisesAddedText}>
                      {exercise.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeExerciseFromEdit(exerciseIndex)}
                      style={styles.editWorkoutButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#ff4c4c"
                      />
                    </TouchableOpacity>
                  </View>

                  {exercise.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.editSetRow}>
                      <Text style={styles.setNumberText}>
                        Set {setIndex + 1}
                      </Text>
                      <TextInput
                        placeholder="Weight"
                        placeholderTextColor="rgba(170,170,170,1)"
                        value={set.weight.toString()}
                        onChangeText={(text) => {
                          const updated = [...addedExercises];
                          updated[exerciseIndex].sets[setIndex].weight =
                            Number(text);
                          setAddedExercises(updated);
                        }}
                        style={styles.editSetInput}
                        keyboardType="numeric"
                      />
                      <TextInput
                        placeholder="Reps"
                        placeholderTextColor="rgba(170,170,170,1)"
                        value={set.reps.toString()}
                        onChangeText={(text) => {
                          const updated = [...addedExercises];
                          updated[exerciseIndex].sets[setIndex].reps =
                            Number(text);
                          setAddedExercises(updated);
                        }}
                        style={styles.editSetInput}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          const updated = [...addedExercises];
                          updated[exerciseIndex].sets.splice(setIndex, 1);
                          setAddedExercises(updated);
                        }}
                      >
                        <Ionicons name="close" size={32} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={() => {
                      const updated = [...addedExercises];
                      updated[exerciseIndex].sets.push({
                        weight: 0,
                        reps: 0,
                      });
                      setAddedExercises(updated);
                    }}
                    style={styles.editWorkoutButton}
                  >
                    <Text style={styles.addSetText}>+ Add Set</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.editWorkoutFooter}>
              <TouchableOpacity
                style={styles.addWorkouutButton}
                onPress={() => setAddExercisePage(true)}
              >
                <Text style={styles.workoutButtonText}>+ Add Exercise</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.finishEditWorkoutButton}
                onPress={() => {
                  saveEditedWorkout();
                }}
              >
                <Text style={styles.workoutButtonText}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Modal for adding new exercises for previous workouts*/}
        <AddExerciseModal
          visible={addExercisePage}
          onClose={() => {
            setAddExercisePage(false);
            setSearchText("");
          }}
          searchText={searchText}
          setSearchText={setSearchText}
          filteredWorkouts={filteredWorkouts}
          addedExercises={addedExercises}
          setAddedExercises={setAddedExercises}
          exerciseAlreadyAdded={exerciseAlreadyAdded}
          onExerciseClicked={(exercise) => setSelectedExercise(exercise)}
          selected={selectedExercise}
          styles={styles}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
  },
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    color: "rgba(255,255,255,1)",
    position: "relative",
  },
  routinesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  subHeader: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  routineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  routineBox: {
    backgroundColor: "rgba(30,30,30,0)",
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 10,
  },
  routineText: {
    color: "rgba(255,255,255,0.5)",
    marginTop: 10,
    fontSize: 14,
  },
  previousWorkoutsSection: {
    padding: 20,
    height: "80%",
  },
  workoutCard: {
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  workoutCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  workoutDate: {
    color: "rgba(255,255,255,1)",
    fontSize: 18,
    fontWeight: "bold",
  },
  workoutTime: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    marginTop: 2,
  },
  workoutCardBody: {
    gap: 12,
  },
  workoutStats: {
    flexDirection: "row",
    gap: 30,
  },
  statsItem: {
    alignItems: "center",
  },
  statsNumber: {
    color: "rgba(255, 154, 2, 1)",
    fontSize: 20,
    fontWeight: "bold",
  },
  statsLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  exercisePreviewText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noWorkoutsText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
  },
  noWorkoutsSubText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  workoutDetailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingTop: 50,
  },
  workoutDetailContent: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  workoutDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  workoutDetailTitle: {
    color: "rgba(255,255,255,1)",
    fontSize: 24,
    fontWeight: "bold",
  },
  workoutDetailSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginTop: 4,
  },
  workoutDetailActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteWorkoutButton: {
    padding: 8,
    paddingRight: 12,
  },
  editWorkoutButton: {
    padding: 8,
  },
  exerciseDetailsCard: {
    backgroundColor: "rgba(30, 30, 30, 0.6)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseDetailsName: {
    color: "rgba(255, 154, 2, 1)",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detailSetsContainer: {
    gap: 8,
  },
  detailsCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailsSetNumber: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    minWidth: 50,
  },
  detailsCardText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  workoutButtonSection: {
    backgroundColor: "rgb(0, 0, 0)",
    paddingBottom: 110,
    paddingHorizontal: 36,
  },
  startWorkoutButton: {
    position: "absolute",
    left: 36,
    right: 36,
    backgroundColor: "rgba(255, 154, 2, 1)",
    paddingVertical: 12.5,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  workoutButtonText: {
    color: "rgb(0, 0, 0)",
    fontSize: 16,
    fontWeight: "bold",
  },
  workoutProgressOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    paddingTop: 0,
  },
  downButton: {
    position: "absolute",
    left: 24,
    top: 0,
  },
  workoutProgressContent: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
    borderRadius: 12,
    paddingHorizontal: 28,
  },
  workoutProgressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "center",
    position: "relative",
    paddingTop: 4,
  },
  finishWorkoutButton: {
    backgroundColor: "rgb(46, 124, 226)",
    paddingBottom: 6,
    paddingTop: 6,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 15,
    alignItems: "center",
    position: "absolute",
    right: 16,
    top: 0,
  },
  scrollableContent: {
    flex: 1,
    marginBottom: 20,
  },
  addedExercises: {
    marginBottom: 20,
  },
  addSetText: {
    color: "#rgba(255, 154, 2, 1)",
    fontSize: 14,
  },
  exercisesAddedText: {
    color: "rgba(255,255,255,1)",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noExercisesText: {
    color: "rgba(136,136,136,1)",
  },
  setInput: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
  },
  fixedButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  addExerciseButton: {
    backgroundColor: "rgba(255, 154, 2, 1)",
    padding: 12.5,
    borderRadius: 25,
    alignItems: "center",
    width: "50%",
  },
  cancelWorkoutButton: {
    backgroundColor: "rgba(230, 25, 25, 0.9)",
    padding: 12.5,
    borderRadius: 25,
    alignItems: "center",
    width: "50%",
  },
  workoutInProgressContainer: {
    backgroundColor: "rgba(27, 27, 27, 1)",
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
  },
  workoutInProgressText: {
    color: "rgba(105, 100, 100, 0.8)",
    fontSize: 16,
    fontWeight: "600",
    paddingTop: 12,
    fontFamily: "Inter",
  },
  workoutInProgressButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 80,
  },
  discardButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  resumeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  discardButtonText: {
    color: "rgba(230, 25, 25, 0.9)",
    fontSize: 16,
    marginLeft: 12,
  },
  resumeButtonText: {
    color: "rgba(30, 144, 255, 0.9)",
    fontSize: 16,
    marginLeft: 12,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "rgba(255, 154, 2, 1)",
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 10,
  },
  addExerciseOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
  },
  addExerciseContent: {
    backgroundColor: "rgba(0,0,0, 1)",
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 26,
    flex: 1,
  },
  searchInput: {
    backgroundColor: "rgba(34,34,34,1)",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 12,
  },
  workoutItem: {
    paddingVertical: 12,
    flex: 1,
  },
  workoutItemText: {
    color: "rgba(255,255,255,1)",
    fontSize: 16,
    fontWeight: 500,
  },
  emptyWorkoutText: {
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  durationContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  timerText: {
    color: "rgba(255, 255, 255, 1)",
    fontWeight: "600",
    fontSize: 24,
  },
  editWorkoutOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingTop: 50,
  },
  editWorkoutContent: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  editWorkoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  editWorkoutTitle: {
    color: "rgba(255,255,255,1)",
    fontSize: 24,
    fontWeight: "bold",
  },
  editWorkoutSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginTop: 4,
  },
  editWorkoutScroll: {
    flex: 1,
  },
  editExerciseCard: {
    backgroundColor: "rgba(30, 30, 30, 0.6)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  editExerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  editSetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  setNumberText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    minWidth: 50,
  },
  editSetInput: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
  },
  editWorkoutFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 12,
  },
  addWorkouutButton: {
    flex: 1,
    backgroundColor: "rgba(255, 154, 2, 1)",
    padding: 12.5,
    borderRadius: 25,
    alignItems: "center",
  },
  finishEditWorkoutButton: {
    flex: 1,
    backgroundColor: "rgb(46, 124, 226)",
    padding: 12.5,
    borderRadius: 25,
    alignItems: "center",
  },
  addButtonIcon: {
    paddingLeft: 12,
    width: 32,
    alignItems: "center",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgb(118, 115, 115)",
  },
  exercisePreviewContainer: {
    width: 48,
    height: 48,
    borderRadius: 48,
    marginRight: 16,
    backgroundColor: "rgba(24, 24, 24, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseDemoPic: {
    width: "100%",
    marginTop: 20,
    height: "100%",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  exerciseDemoContainer: {
    width: "100%",
    height: 240,
    backgroundColor: "rgba(244, 244, 244, 1)",
  },
  imageModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    width: "100%",
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    borderRadius: 12,
    alignItems: "stretch",
  },
  buttonOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 6,
    borderRadius: 10,
  },
  backButton: {
    position: "absolute",
    top: 34,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 6,
  },
  selectedExerciseName: {
    marginTop: 56,
    marginLeft: 20,
    fontSize: 19,
    fontWeight: 600,
    color: "rgba(255, 255, 255, 1)",
    textAlign: "left",
  },
  addButton: {
    color: "rgb(9, 255, 70)",
    paddingRight: 34,
  },
  removeButton: {
    color: "rgb(255, 0, 0)",
    paddingRight: 34,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#121212",
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  closeIcon: {
    position: "absolute",
    left: 0,
    padding: 8,
  },
  routineItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  routineItemText: {
    color: "#fff",
    fontSize: 16,
  },
  addButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  addRoutineModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 1)",
    paddingTop: 38,
  },
  addRoutineHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 1)",
    justifyContent: "center",
    position: "relative",
    marginBottom: 30,
  },
  headerTitleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  routineCard: {
    backgroundColor: "rgba(127, 17, 224, 1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: 160,
    height: 120,
  },
  routineCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  routineHeader: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 16,
    fontWeight: "bold",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  routineTitleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(42, 42, 42, 1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 12,
    width: 220,
  },
  editRoutineTitleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(42, 42, 42, 1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 18,
    width: "150%",
  },
  routineTitleInput: {
    color: "rgba(255,255,255,1)",
    fontSize: 15,
    marginLeft: 6,
    flex: 1,
  },
  routineAddExerciseButton: {
    backgroundColor: "rgba(255, 154, 2, 1)",
    padding: 12.5,
    marginBottom: 20,
    marginHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    alignContent: "center",
    justifyContent: "center",
    width: "80%",
  },
  exploreScrollView: {
    marginVertical: 20,
    paddingLeft: 28,
  },
  exploreSubheader: {
    paddingTop: 10,
    paddingLeft: 28,
    fontSize: 18,
    color: "rgba(211, 211, 211, 1)",
    fontWeight: 500,
  },
  categoryCard: {
    backgroundColor: "rgba(133, 133, 133, 0.4)",
    height: 120,
    width: 100,
    borderRadius: 26,
    marginRight: 10,
  },
  iconContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(238, 238, 238, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  groupNameContainer: {
    position: "absolute",
    bottom: 14,
    left: 12,
    right: 10,
    alignItems: "flex-start",
  },
  categoryText: {
    color: "rgba(255,255,255,1)",
    fontWeight: "600",
  },
  routineSection: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "500",
    marginVertical: 12,
    marginLeft: 16,
    color: "rgba(211, 211, 211, 1)",
  },
  routineUser: {
    marginTop: 4,
    fontSize: 12,
    color: "#555",
  },
  exploreCommunityEmpty: {
    paddingLeft: 16,
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  othersRoutineCard: {
    padding: 16,
    marginBottom: 12,
    marginLeft: 12,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    width: 360,
    alignContent: "center",
  },
  othersRoutineTitle: {
    fontSize: 18,
    fontWeight: 500,
    color: "rgba(255,255,255,1)",
    marginBottom: 6,
  },
  exerciseList: {
    fontSize: 14,
    color: "rgba(221, 221, 221, 1)",
  },
});

export default WorkoutScreen;
