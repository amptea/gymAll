import React, { useState } from "react";
import {
  FlatList,
  Image,
  ImageStyle,
  Modal,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import exerciseDetails from "@/assets/workoutList/exerciseDetails";
import Ionicons from "react-native-vector-icons/Ionicons";

type Exercise = {
  name: string;
  sets: { weight: number; reps: number }[];
};

type AddExerciseModalProps = {
  visible: boolean;
  onClose: () => void;
  searchText: string;
  setSearchText: (text: string) => void;
  filteredWorkouts: string[];
  addedExercises: Exercise[];
  setAddedExercises: (exercises: Exercise[]) => void;
  exerciseAlreadyAdded: (name: string) => boolean;
  onExerciseClicked: (exerciseName: string) => void;
  selected: string | null;
  styles: {
    addExerciseOverlay: StyleProp<ViewStyle>;
    addExerciseContent: StyleProp<ViewStyle>;
    searchInput: StyleProp<TextStyle>;
    exerciseRow: StyleProp<ViewStyle>;
    workoutItem: StyleProp<ViewStyle>;
    workoutItemText: StyleProp<TextStyle>;
    addButtonIcon: StyleProp<ViewStyle>;
    emptyWorkoutText: StyleProp<TextStyle>;
    closeButton: StyleProp<ViewStyle>;
    workoutButtonText: StyleProp<TextStyle>;
    imageModal: StyleProp<ViewStyle>;
    imageModalContent: StyleProp<ViewStyle>;
    exerciseDemoPic: StyleProp<ImageStyle>;
    exerciseDemoContainer: StyleProp<ViewStyle>;
    buttonOverlay: StyleProp<ViewStyle>;
    backButton: StyleProp<ViewStyle>;
    selectedExerciseName: StyleProp<TextStyle>;
    exercisePreviewContainer: StyleProp<ImageStyle>
    removeButton: StyleProp<TextStyle>
    addButton: StyleProp<TextStyle>
  };
};

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  visible,
  onClose,
  searchText,
  setSearchText,
  filteredWorkouts,
  addedExercises,
  setAddedExercises,
  exerciseAlreadyAdded,
  onExerciseClicked,
  selected,
  styles,
}) => {
  const [showExerciseDetails, setShowExerciseDetails] = useState(false);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={true}>
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
              renderItem={({ item }) => {
                const added = exerciseAlreadyAdded(item);
                return (
                  <View style={styles.exerciseRow}>
                    {exerciseDetails[item] ? (
                    <Image
                      source={exerciseDetails[item]}
                      style={styles.exercisePreviewContainer}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.exercisePreviewContainer}>
                      <Ionicons name="image-outline" size={20} color="#555" />
                    </View>
                  )}
                    <TouchableOpacity
                      style={styles.workoutItem}
                      onPress={() => {
                        onExerciseClicked(item);
                        setShowExerciseDetails(true);
                      }}
                    >
                      <Text style={styles.workoutItemText}>{item}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.addButtonIcon}
                      onPress={() => {
                        if (added) {
                          setAddedExercises(
                            addedExercises.filter((ex) => ex.name !== item)
                          );
                        } else {
                          setAddedExercises([
                            ...addedExercises,
                            { name: item, sets: [{ weight: 0, reps: 0 }] },
                          ]);
                        }
                      }}
                    >
                      <Ionicons
                        name={
                          added ? "remove-circle" : "add-circle"
                        }
                        size={28}
                        style={added ? styles.removeButton: styles.addButton}
                      />
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyWorkoutText}>No workouts found</Text>
              }
            />

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.workoutButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showExerciseDetails}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.imageModal}>
            <View style={styles.imageModalContent}>
              {selected && (
                <View>
                  <View style={styles.exerciseDemoContainer}>
                    {exerciseDetails[selected] ? (
                      <Image
                        source={exerciseDetails[selected]}
                        style={styles.exerciseDemoPic}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.emptyWorkoutText}>No image available</Text>
                    )}
                    <TouchableOpacity
                      onPress={() => setShowExerciseDetails(false)}
                      style={styles.backButton}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={28}
                        color="rgba(0, 0, 0, 1)"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.selectedExerciseName}>{selected}</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </Modal>
    </>
  );
};

export default AddExerciseModal;
