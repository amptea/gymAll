import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from "@/FirebaseConfig";
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { useEffect, useState } from 'react';

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

interface PreviewScheduleWorkoutModalProps {
  isVisible: boolean;
  onClose: () => void;
  workout: Schedule | null;
  participants: { uid: string; displayName: string }[];
  onWorkoutDeleted?: () => void;
  onEditWorkout?: (workout: Schedule) => void;
}

const PreviewScheduleWorkoutModal: React.FC<PreviewScheduleWorkoutModalProps> = 
({ isVisible, onClose, workout, participants, onWorkoutDeleted, onEditWorkout }) => {
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchParticipantNames = async () => {
      if (!workout || !workout.participants) {
        setParticipantNames([]);
        return;
      }

      try {
        const names = await Promise.all(
          workout.participants.map(async (participantId) => {
            const userRef = doc(db, 'users', participantId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return userData.username || 'Unknown User';
            }
            return 'Unknown User';
          })
        );
        
        setParticipantNames(names);
      } catch (error) {
        console.error('Error fetching participant names:', error);
        setParticipantNames([]);
      }
    };

    fetchParticipantNames();
  }, [workout]);

  const formatDate = (date: Date) => {
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

  const formatTime = (time: number) => {
    const timeString = time.toString().padStart(4, '0');
    const hours = parseInt(timeString.substring(0, 2));
    const minutes = timeString.substring(2, 4);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes} ${period}`;
  };

  const getParticipantNames = () => {
    return participantNames;
  };

  const handleEditWorkout = () => {
    if (!workout) return;
    
    if (onEditWorkout) {
      onEditWorkout(workout);
    }
    
    onClose();
  };

  const handleDeleteWorkout = async () => {
    if (!workout) return;

    Alert.alert(
      "Delete Workout",
      `Are you sure you want to delete "${workout.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const workoutRef = doc(db, "schedule", workout.id);
              await deleteDoc(workoutRef);
              
              if (onWorkoutDeleted) {
                onWorkoutDeleted();
              }
              
              onClose();
              Alert.alert("Success", "Workout deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete workout");
            }
          }
        }
      ]
    );
  };

  if (!workout) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalLayout}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.textHeader, { flex: 1, textAlign: 'center' }]}>Workout Details</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={handleEditWorkout} style={{ padding: 4, marginRight: 8 }}>
                <MaterialIcons name="edit" size={28} color="#ff9a02" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteWorkout} style={{ padding: 4 }}>
                <MaterialIcons name="delete" size={28} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView 
            style={styles.contentContainer}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Title</Text>
              <Text style={styles.sectionContent}>{workout.title}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date</Text>
              <Text style={styles.sectionContent}>{formatDate(workout.date)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time</Text>
              <Text style={styles.sectionContent}>{formatTime(workout.startTime)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <Text style={styles.sectionContent}>{workout.duration} minutes</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Participants ({workout.participants?.length || 0})</Text>
              <View style={styles.participantsContainer}>
                {getParticipantNames().map((name, index) => (
                  <View key={index} style={styles.participantItem}>
                    <Text style={styles.participantName}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {workout.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.sectionContent}>{workout.notes}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
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
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  textHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#ff9a02',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionContent: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  participantsContainer: {
    marginTop: 8,
  },
  participantItem: {
    backgroundColor: 'rgba(255, 154, 2, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 154, 2, 0.3)',
  },
  participantName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PreviewScheduleWorkoutModal; 