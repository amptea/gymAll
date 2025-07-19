import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { useStatistics } from "@/hooks/useStatistics";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user } = useAuth();
  const { statistics, loading, error } = useStatistics();
  const [userData, setUserData] = useState<any>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [statisticsModalVisible, setStatisticsModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [score, setScore] = useState(0);
  const [weight, setWeight] = useState(0);
  const [leaderboardModalVisible, setLeaderboardModalVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const fetchUserData = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserData(data);
        setProfilePicture(data.profilePicture || null);
        setName(data.name || "");
        setUsername(data.username || "");
        setWeight(data.weight || 0);
        setScore(data.score || 0);
      }
    });
    return () => fetchUserData();
  }, [user]);

  const handleEditProfile = () => {
    setEditProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!name || !username || !weight) {
      Alert.alert("Missing information", "Please fill in all the fields");
      return;
    }

    try {
      await updateDoc(doc(db, "users", user!.uid), {
        name: name,
        username: username,
        profilePicture: profilePicture || null,
        weight: weight,
      });

      setUserData((prev: any) => ({
        ...prev,
        name: name,
        username: username,
        profilePicture: profilePicture || null,
        weight: weight,
      }));
      setProfilePicture(profilePicture || null);
      setWeight(weight);

      setEditProfileModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take a photo"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert("Profile Picture", "Choose an option", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleStatistics = () => {
    setStatisticsModalVisible(true);
  };

  const handleSetWeight = (weight: number) => {
    setWeight(weight);
  };

  const handleLeaderboard = () => {
    setLeaderboardModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.profileSection}>
        <View style={styles.headerRow}>
          <View style={styles.profileInformationContainer}>
            <View style={styles.profilePictureContainer}>
              {profilePicture ? (
                <Image
                  source={{ uri: profilePicture }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <MaterialIcons
                    name="person"
                    size={64}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </View>
              )}
              <View style={styles.usernameContainer}>
                <Text style={styles.name}>{userData?.name}</Text>
                <Text style={styles.username}>{userData?.username}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <MaterialIcons name="edit" size={20} color="rgba(0,0,0,1)" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={handleStatistics}>
            <View style={styles.cardContent}>
              <MaterialIcons
                name="insert-chart"
                size={24}
                color="rgba(255,154,2,1)"
              />
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Statistics</Text>
                <Text style={styles.cardSubtext}>
                  View your workout analytics
                </Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color="rgba(170,170,170,1)"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={handleLeaderboard}>
            <View style={styles.cardContent}>
              <MaterialIcons
                name="leaderboard"
                size={24}
                color="rgba(255,154,2,1)"
              />
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Leaderboard</Text>
                <Text style={styles.cardSubtext}>Check your rankings!</Text>
                <Text style={styles.cardSubtext}>{score}</Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color="rgba(170,170,170,1)"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={editProfileModalVisible}
        animationType="slide"
        transparent={false}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.editModalContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.editModalHeader}>
              <TouchableOpacity
                onPress={() => setEditProfileModalVisible(false)}
                style={{ marginRight: 12 }}
              >
                <MaterialIcons
                  name="close"
                  size={28}
                  color="rgba(255, 255, 255, 1)"
                />
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Edit Profile</Text>
              <View style={{ width: 28, marginLeft: 12 }} />
            </View>

            <View style={styles.editProfilePictureSection}>
              <TouchableOpacity
                style={styles.editProfilePictureContainer}
                onPress={showImagePickerOptions}
              >
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={styles.editProfilePicture}
                  />
                ) : (
                  <View style={styles.editProfilePicturePlaceholder}>
                    <MaterialIcons
                      name="person"
                      size={32}
                      color="rgba(255, 255, 255, 0.6)"
                    />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={showImagePickerOptions}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
            <View>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.editInput}
                placeholder="Name"
                placeholderTextColor="rgba(170,170,170,1)"
                value={name}
                onChangeText={setName}
              />
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.editInput}
                placeholder="Username"
                placeholderTextColor="rgba(170,170,170,1)"
                value={username}
                onChangeText={setUsername}
              />
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.editInput}
                placeholder={weight ? weight.toString() : "Set Weight"}
                placeholderTextColor="rgba(170,170,170,1)"
                value={weight ? weight.toString() : ""}
                keyboardType="numeric"
                onChangeText={(text) => handleSetWeight(Number(text))}
              />
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={statisticsModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <ScrollView
                contentContainerStyle={styles.statisticsModalContainer}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.statisticsModalHeader}>
                  <TouchableOpacity
                    onPress={() => setStatisticsModalVisible(false)}
                    style={{ marginRight: 12 }}
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
                        <Text style={styles.statisticTitle}>
                          Total Workouts
                        </Text>
                        <Text style={styles.statisticValue}>
                          {statistics.totalWorkouts}
                        </Text>
                        <Text style={styles.statisticDescription}>
                          Workouts completed
                        </Text>
                      </View>

                      <View style={styles.statisticCard}>
                        <Text style={styles.statisticTitle}>
                          Average Weight
                        </Text>
                        <Text style={styles.statisticValue}>
                          {statistics.averageWeight} kg
                        </Text>
                        <Text style={styles.statisticDescription}>
                          Per workout session
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  profileInformationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePictureContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePicture: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profilePicturePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(34, 34, 34, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 1)",
  },
  username: {
    fontSize: 14,
    color: "rgba(170, 170, 170, 1)",
    marginTop: 4,
  },
  editButton: {
    backgroundColor: "rgba(255, 154, 2, 1)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    marginTop: 16,
  },
  card: {
    backgroundColor: "rgba(34, 34, 34, 1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(51, 51, 51, 1)",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTextContainer: {
    marginLeft: 16,
  },
  cardTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 16,
    fontWeight: "600",
  },
  cardSubtext: {
    color: "rgba(170, 170, 170, 1)",
    fontSize: 12,
    marginTop: 4,
  },
  usernameContainer: {
    flexDirection: "column",
    paddingLeft: 20,
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    padding: 24,
  },
  editModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    marginTop: 10,
  },
  editModalTitle: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "bold",
  },
  editProfilePictureSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  editProfilePictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(34, 34, 34, 1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(51, 51, 51, 1)",
  },
  editProfilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editProfilePicturePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoText: {
    color: "rgba(255, 154, 2, 1)",
    fontSize: 14,
    fontWeight: "500",
  },
  editInput: {
    width: "100%",
    height: 48,
    backgroundColor: "rgba(34, 34, 34, 1)",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(51, 51, 51, 1)",
    color: "rgba(255, 255, 255, 1)",
    paddingRight: 40,
  },
  saveButton: {
    width: "100%",
    backgroundColor: "rgba(255, 154, 2, 1)",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "rgb(0, 0, 0)",
    fontSize: 16,
    fontWeight: "bold",
  },
  statisticsModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    padding: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "80%",
    backgroundColor: "rgba(0, 0, 0, 1)",
    borderRadius: 12,
    overflow: "hidden",
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
  inputLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
});
