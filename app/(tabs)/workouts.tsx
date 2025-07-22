import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { ExerciseEntry, SavedWorkout } from "@/types/workout";
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
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const workoutList = [
  "Incline Hammer Curls",
  "Wide-grip barbell curl",
  "EZ-bar spider curl",
  "Hammer Curls",
  "Zottman Curl",
  "Barbell Curl",
  "Flexor Incline Dumbbell Curls",
  "Concentration curl",
];

const WorkoutScreen: React.FC = () => {
  const { user } = useAuth();
  const [addExercisePage, setAddExercisePage] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [workoutStartedPage, setWorkoutStartedPage] = useState(false);
  const [addedExercises, setAddedExercises] = useState<ExerciseEntry[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(
    null
  );
  const [workoutDetailPage, setWorkoutDetailPage] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [editWorkoutPage, setEditWorkoutPage] = useState(false);
  const [currentWorkoutEdited, setCurrentWorkoutEdited] =
    useState<SavedWorkout | null>(null);
  const [currentExercisesEdited, setCurrentExercisesEdited] = useState<
    ExerciseEntry[]
  >([]);
  const [currentDurationEdited, setCurrentDurationEdited] = useState("");
  const [weight, setWeight] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) {
      loadWorkoutsFromFirestore();
      loadUserInfo();
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
    const duration = "{durationInMinutes}m {durationInSeconds}s";

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

  const startEditWorkout = (workout: SavedWorkout) => {
    setCurrentWorkoutEdited(workout);
    setCurrentExercisesEdited([...workout.exercises]);
    setCurrentDurationEdited(
      workout.duration ? workout.duration.toString() : ""
    );
    setEditWorkoutPage(true);
    setWorkoutDetailPage(false);
  };

  const saveEditedWorkout = async () => {
    if (currentWorkoutEdited && currentExercisesEdited.length > 0) {
      try {
        const updatedWorkout: SavedWorkout = {
          ...currentWorkoutEdited,
          exercises: currentExercisesEdited,
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
        setCurrentExercisesEdited([]);
        setCurrentDurationEdited("");
        setEditWorkoutPage(false);
      } catch (error) {
        Alert.alert("Error", "Workout not updated successfully");
      }
    }
  };

  const cancelEditWorkout = () => {
    setCurrentWorkoutEdited(null);
    setCurrentExercisesEdited([]);
    setCurrentDurationEdited("");
    setEditWorkoutPage(false);
  };

  const removeExerciseFromEdit = (exerciseIndex: number) => {
    setCurrentExercisesEdited((previous) =>
      previous.filter((_, index) => index !== exerciseIndex)
    );
  };

  const addExerciseToEdit = (exerciseName: string) => {
    setCurrentExercisesEdited((previous) => [
      ...previous,
      { name: exerciseName, sets: [{ weight: 0, reps: 0 }] },
    ]);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Workout</Text>
      </View>

      <View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.routinesSection}>
            <Text style={styles.subHeader}>Routines</Text>
            <View style={styles.routineRow}>
              <TouchableOpacity style={styles.routineBox}>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="white"
                />
                <Text style={styles.routineText}>New Routine</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.routineBox}>
                <Ionicons name="search" size={24} color="white" />
                <Text style={styles.routineText}>Explore Routines</Text>
              </TouchableOpacity>
            </View>
          </View>

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
      </View>

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

      <Modal
        visible={workoutStartedPage}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.workoutProgressOverlay}>
          <View style={styles.workoutProgressContent}>
            <View style={styles.workoutProgressHeader}>
              <View style={styles.workoutIconBox}>
                <TouchableOpacity onPress={() => setWorkoutStartedPage(false)}>
                  <Ionicons
                    name="chevron-down"
                    size={28}
                    color="rgb(255, 255, 255)"
                  />
                </TouchableOpacity>
                <Text style={styles.currentWorkoutText}>Current Workout</Text>
              </View>

              <TouchableOpacity
                style={styles.finishWorkoutButton}
                onPress={finishWorkout}
              >
                <Text style={styles.workoutButtonText}>Finish</Text>
              </TouchableOpacity>
            </View>

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
                      <Text style={styles.exercisesAddedText}>
                        {exercise.name}
                      </Text>
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

        <Modal
          visible={addExercisePage}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.addExerciseOverlay}>
            <View style={styles.addExerciseContent}>
              <TextInput
                placeholder="Search workouts..."
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
              />

              <FlatList
                data={filteredWorkouts}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.workoutItem}
                    onPress={() => {
                      setAddedExercises((previous) => [
                        ...previous,
                        { name: item, sets: [{ weight: 0, reps: 0 }] },
                      ]);
                      setAddExercisePage(false);
                      setSearchText("");
                    }}
                  >
                    <Text style={styles.workoutItemText}>{item}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyWorkoutText}>No workouts found</Text>
                }
              />

              <TouchableOpacity
                onPress={() => {
                  setAddExercisePage(false);
                  setSearchText("");
                }}
                style={styles.closeButton}
              >
                <Text style={styles.workoutButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>

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

              {currentExercisesEdited.map((exercise, exerciseIndex) => (
                <View key={exerciseIndex} style={styles.editExerciseCard}>
                  <View style={styles.editExerciseHeader}>
                    <Text style={styles.exercisesAddedText}>
                      {exercise.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeExerciseFromEdit(exerciseIndex)}
                      style={styles.removeExerciseButton}
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
                          const updated = [...currentExercisesEdited];
                          updated[exerciseIndex].sets[setIndex].weight =
                            Number(text);
                          setCurrentExercisesEdited(updated);
                        }}
                        style={styles.editSetInput}
                        keyboardType="numeric"
                      />
                      <TextInput
                        placeholder="Reps"
                        placeholderTextColor="rgba(170,170,170,1)"
                        value={set.reps.toString()}
                        onChangeText={(text) => {
                          const updated = [...currentExercisesEdited];
                          updated[exerciseIndex].sets[setIndex].reps =
                            Number(text);
                          setCurrentExercisesEdited(updated);
                        }}
                        style={styles.editSetInput}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={() => {
                      const updated = [...currentExercisesEdited];
                      updated[exerciseIndex].sets.push({
                        weight: 0,
                        reps: 0,
                      });
                      setCurrentExercisesEdited(updated);
                    }}
                    style={styles.addSetButton}
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

        <Modal
          visible={addExercisePage}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.addExerciseOverlay}>
            <View style={styles.addExerciseContent}>
              <TextInput
                placeholder="Search workouts..."
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
              />

              <FlatList
                data={filteredWorkouts}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.workoutItem}
                    onPress={() => {
                      addExerciseToEdit(item);
                      setAddExercisePage(false);
                      setSearchText("");
                    }}
                  >
                    <Text style={styles.workoutItemText}>{item}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyWorkoutText}>No workouts found</Text>
                }
              />

              <TouchableOpacity
                onPress={() => {
                  setAddExercisePage(false);
                  setSearchText("");
                }}
                style={styles.closeButton}
              >
                <Text style={styles.workoutButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    fontWeight: "600",
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
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
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
    width: "100%",
    paddingVertical: 65,
  },
  startWorkoutButton: {
    position: "absolute",
    bottom: 0,
    left: 37,
    right: 37,
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
    paddingTop: 30,
  },
  workoutProgressContent: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
    borderRadius: 12,
    padding: 16,
  },
  workoutProgressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 130,
  },
  workoutIconBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  finishWorkoutButton: {
    backgroundColor: "rgb(46, 124, 226)",
    paddingBottom: 8,
    paddingTop: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 15,
    alignItems: "center",
    marginVertical: 10,
  },
  currentWorkoutText: {
    color: "rgba(255,255,255,1)",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
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
    paddingTop: 16,
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
    paddingBottom: 30,
    marginTop: 16,
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
    paddingBottom: 16,
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
  },
  addExerciseOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  addExerciseContent: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%",
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
    borderBottomColor: "rgba(68,68,68,1)",
    borderBottomWidth: 1,
  },
  workoutItemText: {
    color: "rgba(255,255,255,1)",
    fontSize: 16,
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
  removeExerciseButton: {
    padding: 8,
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
  addSetButton: {
    padding: 8,
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
});

export default WorkoutScreen;
