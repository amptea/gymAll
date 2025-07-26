import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDoc, collection, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import FriendSelectorModal from './FriendSelectorScheduleModal';

interface ScheduleWorkoutModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedDate: string;
  onWorkoutScheduled?: () => void;
  friends: { uid: string; displayName: string }[]; 
  editWorkout?: Schedule | null;
  onWorkoutEdited?: () => void;
}

interface Schedule {
  userId: string,
  id: string,
  title: string,
  date: Date,
  startTime: number,
  duration: number,
  notes: string,
  participants: string[], 
}

const ScheduleWorkoutModal: React.FC<ScheduleWorkoutModalProps> = 
({ isVisible, onClose, selectedDate, onWorkoutScheduled, friends, editWorkout, onWorkoutEdited }) => {
  const [scheduleDetails, setScheduleDetails] = useState({
      title: '',
      date: selectedDate,
      startTime: '',
      duration: '',
      notes: '',
  });
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]); 
  const [friendSelectorVisible, setFriendSelectorVisible] = useState(false);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState<Date | null>(null);
    const [schedule, setSchedule] = useState<Schedule[] | null>(null);
    const [errors, setErrors] = useState({
      startTime: '',
      duration: '',
      title: '',
      date: '',
    });
    const { user } = useAuth();
    
  useEffect(() => {
    if (isVisible) {
      if (editWorkout) {
        setScheduleDetails({
          title: editWorkout.title,
          date: editWorkout.date.toISOString().split('T')[0],
          startTime: editWorkout.startTime.toString(),
          duration: editWorkout.duration.toString(),
          notes: editWorkout.notes || '',
        });
        setSelectedFriends(editWorkout.participants.filter(uid => uid !== user?.uid));
      } else {
        setScheduleDetails({
          title: '',
          date: selectedDate,
          startTime: '',
          duration: '',
          notes: '',
        });
        setSelectedFriends([]); 
      }
      setErrors({
        startTime: '',
        duration: '',
        title: '',
        date: '',
      });
    }
  }, [isVisible, selectedDate, editWorkout, user?.uid]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    
    const getOrdinalSuffix = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${dayOfWeek}, ${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
  };

  const formatTimeDisplay = (time: string) => {
    if (time.length === 4) {
      const hours = parseInt(time.substring(0, 2));
      const minutes = time.substring(2, 4);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12; 
      
      return `${displayHours}:${minutes} ${period}`;
    }
    return time;
  };

  const handleTimeInput = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    const truncatedValue = numericValue.slice(0, 4);
    setScheduleDetails(prev => ({ ...prev, startTime: truncatedValue }));
    if (errors.startTime) setErrors(prev => ({ ...prev, startTime: '' }));
  };

  const handleScheduleWorkout = async () => {
    const newErrors = { startTime: '', duration: '', title: '', date: '' };
    
    if (!scheduleDetails.title || scheduleDetails.title.length === 0) {
      newErrors.title = 'Please enter a title';
    }
    
    if (!scheduleDetails.startTime || scheduleDetails.startTime.length !== 4) {
      newErrors.startTime = 'Please enter a valid time in 24-hour format (eg. 1300 for 1:00PM)';
    } else {
      const hours = parseInt(scheduleDetails.startTime.substring(0, 2));
      const minutes = parseInt(scheduleDetails.startTime.substring(2, 4));
      
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        newErrors.startTime = 'Please enter a valid time (hours: 00-23, minutes: 00-59)';
      }
    }
    
    if (!scheduleDetails.duration || parseInt(scheduleDetails.duration) <= 0) {
      newErrors.duration = 'Please enter a valid duration (in minutes)';
    }

    const selectedDate = new Date(scheduleDetails.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      newErrors.date = 'Cannot schedule workouts in the past :(';
    }
    
    if (newErrors.startTime || newErrors.duration || newErrors.title || newErrors.date) {
      setErrors(newErrors);
      return;
    }
    
    onClose();
    const participants = [user?.uid, ...selectedFriends.filter(uid => uid !== user?.uid)].filter(Boolean) as string[];
    
    if (editWorkout) {
      await updateScheduleInFirestore(editWorkout.id, {
        title: scheduleDetails.title.trim(),
        date: new Date(scheduleDetails.date),
        startTime: parseInt(scheduleDetails.startTime),
        duration: parseInt(scheduleDetails.duration),
        notes: scheduleDetails.notes,
        participants,
      });
      
      if (onWorkoutEdited) {
        onWorkoutEdited();
      }
    } else {
      const newSchedule: Schedule = {
        userId: user?.uid || '',
        id: '',
        title: scheduleDetails.title.trim(),
        date: new Date(scheduleDetails.date),
        startTime: parseInt(scheduleDetails.startTime),
        duration: parseInt(scheduleDetails.duration),
        notes: scheduleDetails.notes,
        participants,
      };
      const scheduleId = await saveScheduleToFirestore(newSchedule);
      if (scheduleId) {
        const savedSchedule = { ...newSchedule, id: scheduleId };
        setSchedule(prev => [savedSchedule, ...(prev || [])]);
        
        if (onWorkoutScheduled) {
          onWorkoutScheduled();
        }
      }
    }
  };

  const handleDateChange = (event: any, selectedDate: any) => {
    if (selectedDate) {
      setDate(selectedDate);
    } 
  };

  const handleConfirmDate = () => {
    if (date) {
      setScheduleDetails(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0]
      }));
      if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
    }
    setShowDatePicker(false);
    setDate(null);
  };

  const saveScheduleToFirestore = async (schedule: Schedule) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const scheduleData = {
        userId: user.uid,
        title: schedule.title,
        date: schedule.date,
        startTime: schedule.startTime,
        duration: schedule.duration,
        notes: schedule.notes,
        participants: schedule.participants, 
      }
      const scheduleRef = collection(db, "schedule");
      const scheduleDoc = await addDoc(scheduleRef, scheduleData);
      return scheduleDoc.id;
    } catch (error) {
      Alert.alert("Error", "Cannot save schedule successfully");
    }
  }

  const updateScheduleInFirestore = async (scheduleId: string, scheduleData: any) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const scheduleRef = doc(db, "schedule", scheduleId);
      await updateDoc(scheduleRef, scheduleData);
      Alert.alert("Success", "Workout updated successfully");
    } catch (error) {
      Alert.alert("Error", "Cannot update schedule successfully");
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalLayout} onPress={e => e.stopPropagation()}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.textHeader, { flex: 1, textAlign: 'center', marginBottom: 0 }]}>
              {editWorkout ? 'Edit Workout' : 'Schedule New Workout'}
            </Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView>
            <View style={styles.inputContainer}>
              <Text style={styles.subheader}>Workout Title
                <Text style={styles.requiredFields}>*</Text>
                </Text>
              <TextInput
                style={[styles.inputText, errors.title ? styles.inputError : null]}
                placeholder="Enter workout title"
                placeholderTextColor="#666"
                value={scheduleDetails.title}
                onChangeText={(text) => {
                  setScheduleDetails(prev => ({ ...prev, title: text }));
                  if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                }}/>
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.subheader}>Date
                <Text style={styles.requiredFields}>*</Text>
                  </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.dateButton, errors.date ? styles.inputError : null]}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(scheduleDetails.date)}
                </Text>
              </TouchableOpacity>
              {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={date || new Date(scheduleDetails.date + 'T00:00:00')}
                    mode="date"
                    display={Platform.OS ==='ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    accentColor="#ff9a02"
                    textColor="#ffffff"
                  />
                  <TouchableOpacity 
                    style={styles.confirmDateButton}
                    onPress={handleConfirmDate}
                  >
                    <Text style={styles.confirmDateButtonText}>Confirm Date</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.subheader}>Participants</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#333',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}
                onPress={() => setFriendSelectorVisible(true)}
              >
                <Text style={{ color: '#fff' }}>
                  {selectedFriends.length === 0
                    ? 'Select friends'
                    : friends.filter(friend => selectedFriends.includes(friend.uid)).map(friend => friend.displayName).join(', ')}
                </Text>
              </TouchableOpacity>
            </View>
            <FriendSelectorModal
              visible={friendSelectorVisible}
              onClose={() => setFriendSelectorVisible(false)}
              friends={friends}
              selectedFriends={selectedFriends}
              onSelect={setSelectedFriends}
            />
            <View style={styles.inputContainer}>
              <Text style={styles.subheader}>Start Time
                <Text style={styles.requiredFields}>*</Text>
                </Text>
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={[styles.inputText, errors.startTime ? styles.inputError : null]}
                  placeholder="2300"
                  placeholderTextColor="#666"
                  value={scheduleDetails.startTime}
                  onChangeText={handleTimeInput}
                  keyboardType="numeric"
                  maxLength={4}
                />
                {scheduleDetails.startTime.length === 4 && (
                  <Text style={styles.timeFormat}>
                    {formatTimeDisplay(scheduleDetails.startTime)}
                  </Text>
                )}
              </View>
              {errors.startTime ? (
                <Text style={styles.errorText}>{errors.startTime}</Text>
              ) : (
                <Text style={styles.helperText}>Enter time in 24-hour format (1300 for 1:00 PM)</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.subheader}>Duration (minutes)
                <Text style={styles.requiredFields}>*</Text>
                </Text>
              <TextInput
                style={[styles.inputText, errors.duration ? styles.inputError : null]}
                placeholder="Enter duration"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={scheduleDetails.duration}
                onChangeText={(text) => {
                  setScheduleDetails(prev => ({ ...prev, duration: text }));
                  if (errors.duration) setErrors(prev => ({ ...prev, duration: '' }));
                }}
              />
              {errors.duration ? <Text style={styles.errorText}>{errors.duration}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.subheader}>Notes</Text>
              <TextInput
                style={[styles.inputText, styles.textArea]}
                placeholder="Add workout notes (optional)"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                value={scheduleDetails.notes}
                onChangeText={(text) => setScheduleDetails(prev => ({ ...prev, notes: text }))}
              />
            </View>

            <TouchableOpacity 
              style={styles.scheduleButton}
              onPress={handleScheduleWorkout}
            >
              <Text style={styles.buttonText}>
                {editWorkout ? 'Update Workout' : 'Schedule Workout'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalLayout: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  textHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  subheader: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  inputText: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  disabledInput: {
    opacity: 0.7,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  scheduleButton: {
    backgroundColor: '#ff9a02',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  datePickerContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  confirmDateButton: {
    backgroundColor: '#ff9a02',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmDateButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  requiredFields: {
    color: '#ff9a02',
    marginLeft: 4,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeFormat: {
    color: '#ff9a02',
    marginLeft: 10,
    fontSize: 16,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
}); 

export default ScheduleWorkoutModal;