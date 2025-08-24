import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface StatisticsModalProps {
  visible: boolean;
  onClose: () => void;
  statistics: any;
  loading: boolean;
  error: string | null;
}

const StatisticsModal: React.FC<StatisticsModalProps> = ({
  visible,
  onClose,
  statistics,
  loading,
  error,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.statisticsModalHeader}>
              <TouchableOpacity
                onPress={onClose}
                style={{ marginRight: 12, paddingLeft: 16 }}
              >
                <MaterialIcons
                  name="close"
                  size={28}
                  color="rgba(255, 255, 255, 1)"
                />
              </TouchableOpacity>
              <Text style={styles.statisticsModalTitle}>Statistics</Text>
              <View style={{ width: 28, marginLeft: 12 }} />
            </View>
            <ScrollView
              contentContainerStyle={styles.statisticsModalContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.statisticsContent}>
                {loading ? (
                  <Text style={styles.statisticsText}>
                    Loading statistics...
                  </Text>
                ) : error ? (
                  <Text style={styles.statisticsText}>Error: {error}</Text>
                ) : (
                  <>
                    <View style={styles.statisticCard}>
                      <Text style={styles.statisticTitle}>
                        Lifetime Weight Lifted
                      </Text>
                      <Text style={styles.statisticValue}>
                        {statistics.totalWeight} kg
                      </Text>
                      <Text style={styles.statisticDescription}>
                        Total weight across all workouts
                      </Text>
                    </View>

                    <View style={styles.statisticCard}>
                      <Text style={styles.statisticTitle}>Total Workouts</Text>
                      <Text style={styles.statisticValue}>
                        {statistics.totalWorkouts}
                      </Text>
                      <Text style={styles.statisticDescription}>
                        Workouts completed
                      </Text>
                    </View>

                    <View style={styles.statisticCard}>
                      <Text style={styles.statisticTitle}>
                        Average Weight Lifted
                      </Text>
                      <Text style={styles.statisticValue}>
                        {statistics.averageWeight} kg
                      </Text>
                      <Text style={styles.statisticDescription}>
                        Per workout session
                      </Text>
                    </View>

                    <View style={styles.statisticCard}>
                      <Text style={styles.statisticTitle}>
                        Average No. of Reps
                      </Text>
                      <Text style={styles.statisticValue}>
                        {statistics.averageReps} reps
                      </Text>
                      <Text style={styles.statisticDescription}>
                        Per workout session
                      </Text>
                    </View>

                    <View style={styles.statisticCard}>
                      <Text style={styles.statisticTitle}>
                        Current Workout Streak
                      </Text>
                      <Text style={styles.statisticValue}>
                        {statistics.currentWorkoutStreak} days
                      </Text>
                      <Text style={styles.statisticDescription}>
                        Your current workout streak! Keep it up!
                      </Text>
                    </View>

                    <View style={styles.statisticCard}>
                      <Text style={styles.statisticTitle}>
                        Longest Workout Streak
                      </Text>
                      <Text style={styles.statisticValue}>
                        {statistics.longestWorkoutStreak} days
                      </Text>
                      <Text style={styles.statisticDescription}>
                        Longest workout streak you've ever had!
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

export default StatisticsModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "80%",
    backgroundColor: "rgba(0, 0, 0, 1)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  statisticsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    marginTop: 10,
  },
  statisticsModalTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "bold",
  },
  statisticsModalContainer: {
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    padding: 24,
  },
  statisticsContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statisticsText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 18,
    textAlign: "center",
  },
  statisticCard: {
    backgroundColor: "rgba(34, 34, 34, 1)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(51, 51, 51, 1)",
    alignItems: "center",
    width: "100%",
    height: 100,
    justifyContent: "flex-start",
  },
  statisticTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  statisticValue: {
    color: "rgba(255, 154, 2, 1)",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statisticDescription: {
    color: "rgba(170, 170, 170, 1)",
    fontSize: 12,
    textAlign: "left",
  },
});
