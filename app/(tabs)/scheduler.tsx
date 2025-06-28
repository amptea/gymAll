import ScheduleWorkoutModal from "@/components/ScheduleWorkoutModal";
import { useEffect, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarList, DateData } from "react-native-calendars";

export default function SchedulerScreen() {
  const [selected, setSelected] = useState("");
  const [hasEvents, setHasEvents] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Get current date in local timezone
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [currentDate, setCurrentDate] = useState(getCurrentDate());

  // Update current date
  useEffect(() => {
    // Update immediately on mount
    setCurrentDate(getCurrentDate());

    // Update every min
    const interval = setInterval(() => {
      setCurrentDate(getCurrentDate());
    }, 60000);

    // Cleanup
    return () => {
      clearInterval(interval);
      setSelected("");
    };
  }, []);

  // Create grey circle for selected date and orange circle for current date
  const markedDates = {
    [selected]: {
      selected: true,
      selectedColor: "#d3d3d3",
      selectedTextColor: "#ffffff",
    },
    [currentDate]: {
      selected: true,
      selectedColor: "#ff9a02",
      selectedTextColor: "#000000",
    },
  };

  // If the selected date is the current date, prioritize the styling of the selected date
  if (selected === currentDate) {
    markedDates[currentDate] = {
      ...markedDates[currentDate],
      selectedColor: "#d3d3d3",
      selectedTextColor: "#ffffff",
    };
  }

  const scheduleButtonPressed = () => {
    setIsModalVisible(true);
  };

  const scheduleButtonClosed = () => {
    setIsModalVisible(false);
    setSelected("");
  };

  return (
    <View style={styles.container}>
      <CalendarList
        style={styles.calendar}
        theme={{
          backgroundColor: "#000000",
          calendarBackground: "#000000",
          textSectionTitleColor: "#ffffff",
          selectedDayBackgroundColor: "#ffffff",
          selectedDayTextColor: "#000000",
          todayTextColor: "#ffffff",
          dayTextColor: "#ffffff",
          textDisabledColor: "#666666",
          dotColor: "#00adf5",
          monthTextColor: "#ffffff",
          textMonthFontWeight: "bold",
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
          arrowColor: "#ffffff",
        }}
        markedDates={markedDates}
        onDayPress={(day: DateData) => {
          setSelected(day.dateString);
        }}
        horizontal={true}
        pagingEnabled={true}
        pastScrollRange={12}
        futureScrollRange={12}
        scrollEnabled={true}
        showScrollIndicator={false}
        calendarWidth={Dimensions.get("window").width}
        current={currentDate}
      />

      {selected && !hasEvents && (
        <View style={styles.noEventsContainer}>
          <Text style={styles.noEventsText}>No Workouts scheduled!</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.scheduleButton}
        onPress={scheduleButtonPressed}
      >
        <Text style={styles.buttonText}>Schedule New Workout</Text>
      </TouchableOpacity>

      <ScheduleWorkoutModal
        isVisible={isModalVisible}
        onClose={scheduleButtonClosed}
        selectedDate={selected || currentDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  calendar: {
    marginBottom: 10,
    marginTop: 40,
  },
  noEventsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "60%",
    alignItems: "center",
    transform: [{ translateY: -10 }],
  },
  noEventsText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  scheduleButton: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "#ff9a02",
    padding: 12.5,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 16,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
