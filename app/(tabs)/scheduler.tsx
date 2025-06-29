import ScheduleWorkoutModal from "@/components/ScheduleWorkoutModal";
import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { CalendarList, DateData } from "react-native-calendars";

interface Schedule {
  userId: string,
  id: string,
  title: string,
  date: Date,
  startTime: number,
  duration: number,
  notes: string,
}

export default function SchedulerScreen() {
  const [selected, setSelected] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [schedule, setSchedule] = useState<Schedule[] | null>(null);
  const [scheduleForDate, setScheduleForDate] = useState<Schedule[] | null>(null);
  const { user } = useAuth();

  // Get current date in local timezone
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [currentDate, setCurrentDate] = useState(getCurrentDate());

  useEffect(() => {
    setCurrentDate(getCurrentDate());
    setSelected(currentDate);
    getScheduleForDate(currentDate);

    const interval = setInterval(() => {
      setCurrentDate(getCurrentDate());
    }, 60000);

    return () => {
      clearInterval(interval);
      setSelected("");
    };
  }, []);

  const getScheduleForDate = async (selectedDate: string) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      setScheduleForDate([]); 
      const schedules = await loadScheduleFromFirestore(); 
      const eventsOnDate: Schedule[] = [];
      
      schedules?.forEach((scheduleItem) => {
        if (scheduleItem.date.toISOString().split('T')[0] === selectedDate) {
          eventsOnDate.push(scheduleItem);
        }
      });
      
      setScheduleForDate(eventsOnDate);
    } catch (error) {
      Alert.alert("Error", "Failed to load schedules");
    }
  }

  const loadScheduleFromFirestore = async () => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return [];
    }
    try {
      const scheduleRef = collection(db, "schedule");
      const scheduleList = await getDocs(scheduleRef);
      const schedules: Schedule[] = [];

      scheduleList.forEach((doc) => {
        const data = doc.data();
        if (data.userId === user.uid) {
          schedules.push({
            userId: data.userId,
            id: doc.id,
            title: data.title,
            date: data.date.toDate(),
            startTime: data.startTime,
            duration: data.duration,
            notes: data.notes,
          });
        }
      })
      setSchedule(schedules);
      return schedules;
    } catch (error) {
      Alert.alert("Error", "Failed to load schedules");
      return [];
    }
  }

  const dateColours = {
    [selected]: {
      selected: true,
      selectedColor: "rgba(255, 154, 2, 0.8)",
      selectedTextColor: "rgba(0, 0, 0, 0.5)",
    },
    [currentDate]: {
      selected: true,
      selectedColor: selected === currentDate 
      ? "rgba(255, 154, 2, 0.8)" 
      : "rgba(255, 255, 255, 0.8)", 
      selectedTextColor: "rgba(0, 0, 0, 0.5)",
    },
  };

  const scheduleButtonPressed = () => {
    setIsModalVisible(true);
  };

  const scheduleButtonClosed = () => {
    setIsModalVisible(false);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    const tomorrow = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
        const day = date.getDate();
        const month = date.toLocaleDateString("en-US", { month: "short" });
        return `${day} ${month}`;
    }
  };

  const handleNewWorkout = () => {
    getScheduleForDate(selected || currentDate);
  };

  return (
    <View style={styles.container}>
      <CalendarList
        style={styles.calendar}
        markedDates={dateColours}
        theme={{
          backgroundColor: "#000000",
          calendarBackground: "#000000",
          textSectionTitleColor: "#ffffff",
          todayTextColor: "#ffffff",
          dayTextColor: "#ffffff",
          dotColor: "#00adf5",
          monthTextColor: "#ffffff",
          textMonthFontWeight: "bold",
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
        onDayPress={(day: DateData) => {
          setSelected(day.dateString);
          getScheduleForDate(day.dateString);
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

      {(selected || currentDate) && scheduleForDate?.length === 0 ? (
        <View style={styles.scheduleEmptyContainer}>
          <Text style={styles.scheduleEmptyText}>No workouts scheduled yet!</Text>
        </View>
      ) : (selected || currentDate) && scheduleForDate && scheduleForDate.length > 0 ? (
        <ScrollView style={styles.scheduledContainer}>
          <Text style={styles.eventsHeader}>
            {formatDate(new Date(selected)) || formatDate(new Date(currentDate))}
          </Text>
          {scheduleForDate.sort((x, y) => x.startTime - y.startTime).map((schedule, index) => (
            <View key={schedule.id || index} style={styles.eventContainer}>
              <View style={styles.eventHeaderContainer}>
                <Text style={styles.eventTitle}>{schedule.title}</Text>
                  <View style={styles.eventTimeContainer}>
                    <Text style={styles.eventTime}>
                    {String(schedule.startTime).slice(0, 2)}:{String(schedule.startTime).slice(2, 4)}
                    </Text>
                    <Text style={styles.eventDuration}>{schedule.duration} min</Text>
                  </View>
              </View>
              {schedule.notes && 
              <View>
                <Text style={styles.eventNotesHeader}>Notes</Text>
                <Text style={styles.eventNotes}>{schedule.notes}</Text>
              </View>
              }
            </View>
          ))}
        </ScrollView>
      ) : null}

      <TouchableOpacity
        style={styles.scheduleButton}
        onPress={scheduleButtonPressed}
      >
        <Text style={styles.buttonText}>Schedule New Workout</Text>
      </TouchableOpacity>

      <ScheduleWorkoutModal
        isVisible={isModalVisible}
        onClose={scheduleButtonClosed}
        selectedDate={selected}
        onWorkoutScheduled={handleNewWorkout}
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
  scheduleEmptyContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: 500,
    left: 100,
  },
  scheduleEmptyText: {
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
  scheduledContainer: {
    position: "absolute",
    top: 360,
    bottom: 160,
    padding: 20,
    left: 0,
    right: 0,
  },
  eventsHeader: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 5,
  },
  eventContainer: {
    backgroundColor: "rgba(127, 126, 126, 0.2)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  eventHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  eventTimeContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  eventTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventTime: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 5,
  },
  eventDuration: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "300",
  },
  eventNotes: {
    color: "#ffffff",
    fontSize: 12,
  },
  eventNotesHeader: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
});
