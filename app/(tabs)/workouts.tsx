import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
  "Push Ups",
  "Pull Ups",
  "Squats",
  "Lunges",
  "Plank",
  "Jumping Jacks",
  "Burpees",
];

interface ExerciseSet {
  weight: string;
  reps: string;
}

interface ExerciseEntry {
  name: string;
  sets: ExerciseSet[];
}

interface SavedWorkout {
  exercises: ExerciseEntry[];
  date: Date;
  duration?: number;
}

const WorkoutScreen: React.FC = () => {
  const [addExercisePage, setAddExercisePage] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [workoutStartedPage, setWorkoutStartedPage] = useState(false);
  const [addedExercises, setAddedExercises] = useState<ExerciseEntry[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(
    null
  );
  const [workoutDetailModal, setWorkoutDetailModal] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [editWorkoutModal, setEditWorkoutModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<SavedWorkout | null>(null);
  const [editingExercises, setEditingExercises] = useState<ExerciseEntry[]>([]);
  const [editingDuration, setEditingDuration] = useState("");

  const filteredWorkouts = workoutList.filter((item) =>
    item.toLowerCase().includes(searchText.toLowerCase())
  );

  const cancelWorkout = () => {
    setAddedExercises([]);
    setWorkoutDuration("");
    setWorkoutStartedPage(false);
  };

  const finishWorkout = () => {
    if (addedExercises.length > 0) {
      const newWorkout: SavedWorkout = {
        exercises: addedExercises,
        date: new Date(),
        duration: workoutDuration ? parseInt(workoutDuration) : undefined,
      };
      setSavedWorkouts((previous) => [newWorkout, ...previous]);
      setAddedExercises([]);
      setWorkoutDuration("");
      setWorkoutStartedPage(false);
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

  const getTotalSets = (exercises: ExerciseEntry[]) => {
    return exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0
    );
  };

  const openWorkoutDetail = (workout: SavedWorkout) => {
    setSelectedWorkout(workout);
    setWorkoutDetailModal(true);
  };

  const startEditWorkout = (workout: SavedWorkout) => {
    setEditingWorkout(workout);
    setEditingExercises([...workout.exercises]);
    setEditingDuration(workout.duration ? workout.duration.toString() : "");
    setEditWorkoutModal(true);
    setWorkoutDetailModal(false);
  };

  const saveEditedWorkout = () => {
    if (editingWorkout && editingExercises.length > 0) {
      const updatedWorkout: SavedWorkout = {
        ...editingWorkout,
        exercises: editingExercises,
        duration: editingDuration ? parseInt(editingDuration) : undefined,
      };

      setSavedWorkouts((previous) =>
        previous.map((workout) =>
          workout === editingWorkout ? updatedWorkout : workout
        )
      );

      setEditingWorkout(null);
      setEditingExercises([]);
      setEditingDuration("");
      setEditWorkoutModal(false);
    }
  };

  const cancelEditWorkout = () => {
    setEditingWorkout(null);
    setEditingExercises([]);
    setEditingDuration("");
    setEditWorkoutModal(false);
  };

  const removeExerciseFromEdit = (exerciseIndex: number) => {
    setEditingExercises((previous) =>
      previous.filter((_, index) => index !== exerciseIndex)
    );
  };

  const addExerciseToEdit = (exerciseName: string) => {
    setEditingExercises((previous) => [
      ...previous,
      { name: exerciseName, sets: [{ weight: "", reps: "" }] },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Workout</Text>
      </View>

      <View style={styles.contentContainer}>
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
                            {workout.duration}m
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
          <TouchableOpacity
            style={styles.startWorkoutButton}
            onPress={() => setWorkoutStartedPage(true)}
          >
            <Text style={styles.workoutButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={workoutDetailModal}
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
                  onPress={() => selectedWorkout && startEditWorkout(selectedWorkout)}
                  style={styles.editWorkoutButton}
                >
                  <Ionicons name="create-outline" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setWorkoutDetailModal(false)}
                  style={styles.closeDetailButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.workoutDetailScroll}>
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
              <ScrollView
                style={styles.exercisesAddedBox}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.exercisesAddedText}>Added Exercises:</Text>
                
                <View style={styles.durationInputContainer}>
                  <Text style={styles.durationLabel}>Workout Duration (minutes):</Text>
                  <TextInput
                    placeholder="Enter duration"
                    placeholderTextColor="rgba(170,170,170,1)"
                    value={workoutDuration}
                    onChangeText={setWorkoutDuration}
                    style={styles.durationInput}
                    keyboardType="numeric"
                  />
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
                            value={set.weight}
                            onChangeText={(text) => {
                              const updated = [...addedExercises];
                              updated[exerciseIndex].sets[setIndex].weight =
                                text;
                              setAddedExercises(updated);
                            }}
                            style={styles.setInput}
                            keyboardType="numeric"
                          />
                          <TextInput
                            placeholder="Reps"
                            placeholderTextColor="rgba(170,170,170,1)"
                            value={set.reps}
                            onChangeText={(text) => {
                              const updated = [...addedExercises];
                              updated[exerciseIndex].sets[setIndex].reps = text;
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
                            weight: "",
                            reps: "",
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
                style={styles.discardButton}
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
                        { name: item, sets: [{ weight: "", reps: "" }] },
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

      <Modal
        visible={editWorkoutModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.editWorkoutOverlay}>
          <View style={styles.editWorkoutContent}>
            <View style={styles.editWorkoutHeader}>
              <View>
                <Text style={styles.editWorkoutTitle}>Edit Workout</Text>
                <Text style={styles.editWorkoutSubtitle}>
                  {editingWorkout ? formatDate(editingWorkout.date) : ""}
                </Text>
              </View>
              <TouchableOpacity
                onPress={cancelEditWorkout}
                style={styles.closeDetailButton}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editWorkoutScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.durationInputContainer}>
                <Text style={styles.durationLabel}>Workout Duration (minutes):</Text>
                <TextInput
                  placeholder="Enter duration"
                  placeholderTextColor="rgba(170,170,170,1)"
                  value={editingDuration}
                  onChangeText={setEditingDuration}
                  style={styles.durationInput}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.exercisesAddedText}>Exercises:</Text>
              
              {editingExercises.map((exercise, exerciseIndex) => (
                <View key={exerciseIndex} style={styles.editExerciseCard}>
                  <View style={styles.editExerciseHeader}>
                    <Text style={styles.exercisesAddedText}>
                      {exercise.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeExerciseFromEdit(exerciseIndex)}
                      style={styles.removeExerciseButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff4c4c" />
                    </TouchableOpacity>
                  </View>
                  
                  {exercise.sets.map((set, setIndex) => (
                    <View
                      key={setIndex}
                      style={styles.editSetRow}
                    >
                      <Text style={styles.setNumberText}>Set {setIndex + 1}</Text>
                      <TextInput
                        placeholder="Weight"
                        placeholderTextColor="rgba(170,170,170,1)"
                        value={set.weight}
                        onChangeText={(text) => {
                          const updated = [...editingExercises];
                          updated[exerciseIndex].sets[setIndex].weight = text;
                          setEditingExercises(updated);
                        }}
                        style={styles.editSetInput}
                        keyboardType="numeric"
                      />
                      <TextInput
                        placeholder="Reps"
                        placeholderTextColor="rgba(170,170,170,1)"
                        value={set.reps}
                        onChangeText={(text) => {
                          const updated = [...editingExercises];
                          updated[exerciseIndex].sets[setIndex].reps = text;
                          setEditingExercises(updated);
                        }}
                        style={styles.editSetInput}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                  
                  <TouchableOpacity
                    onPress={() => {
                      const updated = [...editingExercises];
                      updated[exerciseIndex].sets.push({
                        weight: "",
                        reps: "",
                      });
                      setEditingExercises(updated);
                    }}
                    style={styles.addSetButton}
                  >
                    <Text style={styles.addSetText}>+ Add Set</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addExerciseToEditButton}
                onPress={() => setAddExercisePage(true)}
              >
                <Text style={styles.workoutButtonText}>+ Add Exercise</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.editWorkoutFooter}>
              <TouchableOpacity
                style={styles.saveWorkoutButton}
                onPress={saveEditedWorkout}
              >
                <Text style={styles.workoutButtonText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.finishEditWorkoutButton}
                onPress={() => {
                  saveEditedWorkout();
                  setEditWorkoutModal(false);
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
    paddingHorizontal: 16,
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
  contentContainer: {
    flex: 1,
  },
  routinesSection: {
    marginTop: 24,
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
  editWorkoutButton: {
    padding: 8,
  },
  closeDetailButton: {
    padding: 8,
  },
  workoutDetailScroll: {
    flex: 1,
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
    position: "absolute",
    bottom: 66,
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgb(0, 0, 0)",
  },
  startWorkoutButton: {
    backgroundColor: "rgba(255, 154, 2, 1)",
    padding: 12.5,
    borderRadius: 25,
    alignItems: "center",
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
  exercisesAddedBox: {
    flex: 1,
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
    flex: 1,
    backgroundColor: "rgba(255, 154, 2, 1)",
    padding: 12.5,
    borderRadius: 25,
    alignItems: "center",
  },
  discardButton: {
    flex: 1,
    backgroundColor: "#ff4c4c",
    padding: 12.5,
    borderRadius: 25,
    alignItems: "center",
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
  durationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  durationLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginRight: 10,
  },
  durationInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
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
  saveWorkoutButton: {
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
  addExerciseToEditButton: {
    backgroundColor: "rgba(255, 154, 2, 1)",
    padding: 12.5,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 16,
  },
});

export default WorkoutScreen;
