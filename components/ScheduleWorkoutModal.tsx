import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Pressable, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ScheduleWorkoutModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedDate: string;
}

export default function ScheduleWorkoutModal({ isVisible, onClose, selectedDate }: ScheduleWorkoutModalProps) {
  const [workoutDetails, setWorkoutDetails] = useState({
    title: '',
    date: '',
    startTime: '',
    duration: '',
    notes: '',
  });

  const [errors, setErrors] = useState({
    title: '',
    startTime: '',
    duration: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // Update date when modal opens or whenselected date changes
  useEffect(() => {
    if (isVisible) {
      setWorkoutDetails(prev => ({
        ...prev,
        date: selectedDate
      }));
      
      setErrors({
        title: '',
        startTime: '',
        duration: '',
      });
    } else {
      // Reset form 
      setWorkoutDetails({
        title: '',
        date: '',
        startTime: '',
        duration: '',
        notes: '',
      });
      setErrors({
        title: '',
        startTime: '',
        duration: '',
      });
    }
  }, [isVisible, selectedDate]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    
    // Add ordinal suffix
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

  const validateFields = () => {
    let isValid = true;
    const newErrors = {
      title: '',
      startTime: '',
      duration: '',
    };

    if (!workoutDetails.title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    if (!workoutDetails.startTime.trim()) {
      newErrors.startTime = 'Start time is required';
      isValid = false;
    } else {
      const timeValue = parseInt(workoutDetails.startTime);
      const hours = Math.floor(timeValue / 100);
      const minutes = timeValue % 100;
      
      if (isNaN(timeValue) || 
          workoutDetails.startTime.length !== 4 || 
          hours < 0 || hours > 23 || 
          minutes < 0 || minutes > 59) {
        newErrors.startTime = 'Invalid time format (0000-2359)';
        isValid = false;
      }
    }

    if (!workoutDetails.duration.trim()) {
      newErrors.duration = 'Duration is required';
      isValid = false;
    } else if (isNaN(Number(workoutDetails.duration)) || Number(workoutDetails.duration) <= 0) {
      newErrors.duration = 'Duration must be a positive number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const formatTimeDisplay = (time: string) => {
    if (time.length === 4) {
      const hours = parseInt(time.substring(0, 2));
      const minutes = time.substring(2, 4);
      
      // Convert to 12-hour format
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12; 
      
      return `${displayHours}:${minutes} ${period}`;
    }
    return time;
  };

  const handleTimeInput = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    
    // 4 digit limit
    const truncatedValue = numericValue.slice(0, 4);
    
    setWorkoutDetails(prev => ({ ...prev, startTime: truncatedValue }));
    if (errors.startTime) setErrors(prev => ({ ...prev, startTime: '' }));
  };

  const handleScheduleWorkout = () => {
    if (validateFields()) {
      // See how to save to backend in the future, now just console log
      console.log('Workout scheduled:', workoutDetails);
      onClose();
    }
  };

  const handleDateChange = (event: any, selectedDate: any) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleConfirmDate = () => {
    if (tempDate) {
      setWorkoutDetails(prev => ({
        ...prev,
        date: tempDate.toISOString().split('T')[0]
      }));
    }
    setShowDatePicker(false);
    setTempDate(null);
  };

  // Maximum date is end of current month
  const getEndOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalView} onPress={e => e.stopPropagation()}>
          <ScrollView>
            <Text style={styles.header}>Schedule New Workout</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Workout Title<Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.title ? styles.inputError : null]}
                placeholder="Enter workout title"
                placeholderTextColor="#666"
                value={workoutDetails.title}
                onChangeText={(text) => {
                  setWorkoutDetails(prev => ({ ...prev, title: text }));
                  if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                }}
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date<Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(workoutDetails.date)}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={tempDate || new Date(workoutDetails.date)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
              <Text style={styles.label}>Start Time<Text style={styles.required}>*</Text></Text>
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={[styles.input, errors.startTime ? styles.inputError : null]}
                  placeholder="2359"
                  placeholderTextColor="#666"
                  value={workoutDetails.startTime}
                  onChangeText={handleTimeInput}
                  keyboardType="numeric"
                  maxLength={4}
                />
                {workoutDetails.startTime.length === 4 && (
                  <Text style={styles.timeFormat}>
                    {formatTimeDisplay(workoutDetails.startTime)}
                  </Text>
                )}
              </View>
              {errors.startTime ? (
                <Text style={styles.errorText}>{errors.startTime}</Text>
              ) : (
                <Text style={styles.helperText}>Enter time in 24-hour format (1430 for 2:30 PM)</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Duration (minutes)<Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.duration ? styles.inputError : null]}
                placeholder="Enter duration"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={workoutDetails.duration}
                onChangeText={(text) => {
                  setWorkoutDetails(prev => ({ ...prev, duration: text }));
                  if (errors.duration) setErrors(prev => ({ ...prev, duration: '' }));
                }}
              />
              {errors.duration ? <Text style={styles.errorText}>{errors.duration}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add workout notes (optional)"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                value={workoutDetails.notes}
                onChangeText={(text) => setWorkoutDetails(prev => ({ ...prev, notes: text }))}
              />
            </View>

            <TouchableOpacity 
              style={styles.scheduleButton}
              onPress={handleScheduleWorkout}
            >
              <Text style={styles.buttonText}>Schedule Workout</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
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
  required: {
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