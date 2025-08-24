import PreviewScheduleWorkoutModal from "@/components/PreviewScheduleWorkoutModal";
import ScheduleWorkoutModal from "@/components/ScheduleWorkoutModal";
import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarList, DateData } from "react-native-calendars";

interface Schedule {
  userId: string;
  id: string;
  title: string;
  date: Date;
  startTime: number;
  duration: number;
  notes: string;
  participants: string[];
}

export default function SchedulerScreen() {
  const [selected, setSelected] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Schedule | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [workoutToEdit, setWorkoutToEdit] = useState<Schedule | null>(null);
  const [schedule, setSchedule] = useState<Schedule[] | null>(null);
  const [scheduleForDate, setScheduleForDate] = useState<Schedule[] | null>(
    null
  );
  const { user } = useAuth();
  const [friends, setFriends] = useState<
    { uid: string; displayName: string }[]
  >([]);
  const [allParticipants, setAllParticipants] = useState<
    { uid: string; displayName: string }[]
  >([]);
  const [datesWithWorkouts, setDatesWithWorkouts] = useState({});

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [currentDate, setCurrentDate] = useState(getCurrentDate());

  const getParticipantIndicator = (participantCount: number) => {
    if (participantCount === 1) return "1";
    if (participantCount === 2) return "2";
    if (participantCount === 3) return "3";
    if (participantCount > 3) return "3+";
    return "1";
  };

  const getParticipantDotColor = (participantCount: number) => {
    if (participantCount === 1) return "#00ff00";
    if (participantCount === 2) return "#00ffff";
    if (participantCount === 3) return "#ff00ff";
    if (participantCount > 3) return "#ff9a02";
    return "#00ff00";
  };

  const generateWorkoutIndicators = (schedules: Schedule[]) => {
    const marked: any = {};

    schedules.forEach((schedule) => {
      const dateString = schedule.date.toISOString().split("T")[0];
      const participantCount = schedule.participants
        ? schedule.participants.length
        : 0;
      const indicator = getParticipantIndicator(participantCount);

      if (marked[dateString]) {
        const existingCount = marked[dateString].participantCount || 0;
        const newCountNum = participantCount;

        if (newCountNum > existingCount) {
          marked[dateString] = {
            ...marked[dateString],
            participantCount: participantCount,
            marked: true,
            dotColor: getParticipantDotColor(participantCount),
          };
        }
      } else {
        marked[dateString] = {
          participantCount: participantCount,
          marked: true,
          dotColor: getParticipantDotColor(participantCount),
        };
      }
    });

    return marked;
  };

  useEffect(() => {
    setCurrentDate(getCurrentDate());
    setSelected(currentDate);
    getScheduleForDate(currentDate);
    loadScheduleFromFirestore();

    const interval = setInterval(() => {
      setCurrentDate(getCurrentDate());
    }, 60000);

    return () => {
      clearInterval(interval);
      setSelected("");
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadFriendsFromFirestore();
      loadAllParticipants();
    }
  }, [user]);

  const loadFriendsFromFirestore = async () => {
    if (!user) return;
    try {
      const currentUserRef = doc(db, "users", user.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      if (currentUserDoc.exists()) {
        const currentUserData = currentUserDoc.data();
        if (currentUserData.friends && Array.isArray(currentUserData.friends)) {
          const friendDocs = await Promise.all(
            currentUserData.friends.map(async (friendUid: string) => {
              const friendRef = doc(db, "users", friendUid);
              const friendDoc = await getDoc(friendRef);
              if (friendDoc.exists()) {
                const friendData = friendDoc.data();
                return {
                  uid: friendUid,
                  displayName: friendData.name || friendData.username || "null",
                };
              }
              return null;
            })
          );
          setFriends(
            friendDocs.filter(Boolean) as { uid: string; displayName: string }[]
          );
        } else {
          setFriends([]);
        }
      }
    } catch (error) {
      setFriends([]);
    }
  };

  const loadAllParticipants = async () => {
    if (!user) return;
    try {
      const scheduleRef = collection(db, "schedule");
      const scheduleList = await getDocs(scheduleRef);
      const allUserIds = new Set<string>();

      scheduleList.forEach((doc) => {
        const data = doc.data();
        if (
          data.userId === user.uid ||
          (data.participants && data.participants.includes(user.uid))
        ) {
          allUserIds.add(data.userId);
          if (data.participants && Array.isArray(data.participants)) {
            data.participants.forEach((participantId: string) => {
              allUserIds.add(participantId);
            });
          }
        }
      });

      const participantDocs = await Promise.all(
        Array.from(allUserIds).map(async (userId: string) => {
          const userRef = doc(db, "users", userId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              uid: userId,
              displayName: userData.username || "Unknown User",
            };
          }
          return null;
        })
      );

      setAllParticipants(
        participantDocs.filter(Boolean) as {
          uid: string;
          displayName: string;
        }[]
      );
    } catch (error) {
      setAllParticipants([]);
    }
  };

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
        if (scheduleItem.date.toISOString().split("T")[0] === selectedDate) {
          eventsOnDate.push(scheduleItem);
        }
      });

      setScheduleForDate(eventsOnDate);
    } catch (error) {
      Alert.alert("Error", "Failed to load schedules");
    }
  };

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

        if (
          data.userId === user.uid ||
          (data.participants && data.participants.includes(user.uid))
        ) {
          schedules.push({
            userId: data.userId,
            id: doc.id,
            title: data.title,
            date: data.date.toDate(),
            startTime: data.startTime,
            duration: data.duration,
            notes: data.notes,
            participants: data.participants,
          });
        }
      });
      setSchedule(schedules);

      const datesWithWorkoutIndicators = generateWorkoutIndicators(schedules);
      setDatesWithWorkouts(datesWithWorkoutIndicators);

      return schedules;
    } catch (error) {
      Alert.alert("Error", "Failed to load schedules");
      return [];
    }
  };

  const getDatesWithWorkouts = () => {
    const merged: any = { ...datesWithWorkouts };

    if (selected) {
      merged[selected] = {
        ...merged[selected],
        selected: true,
        selectedColor: "rgba(255, 154, 2, 0.8)",
        selectedTextColor: "rgba(0, 0, 0, 0.5)",
      };
    }

    if (currentDate) {
      merged[currentDate] = {
        ...merged[currentDate],
        selected: true,
        selectedColor:
          selected === currentDate
            ? "rgba(255, 154, 2, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        selectedTextColor: "rgba(0, 0, 0, 0.5)",
      };
    }

    return merged;
  };

  const scheduleButtonPressed = () => {
    setIsModalVisible(true);
  };

  const scheduleButtonClosed = () => {
    setIsModalVisible(false);
  };

  const openPreviewModal = (workout: Schedule) => {
    setSelectedWorkout(workout);
    setIsPreviewModalVisible(true);
  };

  const closePreviewModal = () => {
    setIsPreviewModalVisible(false);
    setSelectedWorkout(null);
  };

  const handleEditWorkout = (workout: Schedule) => {
    setWorkoutToEdit(workout);
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setWorkoutToEdit(null);
  };

  const handleWorkoutEdited = () => {
    handleNewWorkout();
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
    loadScheduleFromFirestore();
  };

  return (
    <View style={styles.container}>
      <CalendarList
        style={styles.calendar}
        markedDates={getDatesWithWorkouts()}
        theme={{
          backgroundColor: "#000000",
          calendarBackground: "#000000",
          textSectionTitleColor: "#ffffff",
          todayTextColor: "#ffffff",
          dayTextColor: "#ffffff",
          dotColor: "#ff9a02",
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
        markingType="dot"
      />

      {(selected || currentDate) && scheduleForDate?.length === 0 ? (
        <View style={styles.scheduleEmptyContainer}>
          <Text style={styles.scheduleEmptyText}>
            No workouts scheduled yet!
          </Text>
        </View>
      ) : (selected || currentDate) &&
        scheduleForDate &&
        scheduleForDate.length > 0 ? (
        <ScrollView style={styles.scheduledContainer}>
          <Text style={styles.eventsHeader}>
            {formatDate(new Date(selected)) ||
              formatDate(new Date(currentDate))}
          </Text>
          {scheduleForDate
            .sort((x, y) => x.startTime - y.startTime)
            .map((schedule, index) => (
              <TouchableOpacity
                key={schedule.id || index}
                style={styles.eventContainer}
                onPress={() => openPreviewModal(schedule)}
                activeOpacity={0.7}
              >
                <View style={styles.eventHeaderContainer}>
                  <Text style={styles.eventTitle}>{schedule.title}</Text>
                  <View style={styles.eventTimeContainer}>
                    <Text style={styles.eventTime}>
                      {String(schedule.startTime).slice(0, 2)}:
                      {String(schedule.startTime).slice(2, 4)}
                    </Text>
                    <Text style={styles.eventDuration}>
                      {schedule.duration} min
                    </Text>
                  </View>
                </View>
                {schedule.notes && (
                  <View>
                    <Text style={styles.eventNotesHeader}>Notes</Text>
                    <Text style={styles.eventNotes}>{schedule.notes}</Text>
                  </View>
                )}
              </TouchableOpacity>
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
        friends={friends}
      />

      <ScheduleWorkoutModal
        isVisible={isEditModalVisible}
        onClose={closeEditModal}
        selectedDate={selected}
        onWorkoutEdited={handleWorkoutEdited}
        friends={friends}
        editWorkout={workoutToEdit}
      />

      <PreviewScheduleWorkoutModal
        isVisible={isPreviewModalVisible}
        onClose={closePreviewModal}
        workout={selectedWorkout}
        participants={allParticipants}
        onWorkoutDeleted={handleNewWorkout}
        onEditWorkout={handleEditWorkout}
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
    padding: 30,
    paddingTop: 40,
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
