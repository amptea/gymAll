import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { useStatistics } from "@/hooks/useStatistics";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
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
import EditProfileModal from "@/components/EditProfileModal";
import StatisticsModal from "@/components/StatisticsModal";

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
  const [topThreeUsers, setTopThreeUsers] = useState<any[]>([]);
  const [fourthToTenthUsers, setFourthToTenthUsers] = useState<any[]>([]);

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
    getLeaderboardData();
    setLeaderboardModalVisible(true);
  };

  const getLeaderboardData = async () => {
    try {
      const topTenQuery = query(
        collection(db, "users"),
        orderBy("score", "desc"),
        limit(10)
      );
      const data = await getDocs(topTenQuery);
      const leaderboard = data.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTopThreeUsers(leaderboard.slice(0, 3));
      setFourthToTenthUsers(leaderboard.slice(3));
    } catch (error) {
      Alert.alert("Failed to fetch leaderboard data", "error");
    }
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

      <EditProfileModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        profilePicture={profilePicture}
        showImagePickerOptions={showImagePickerOptions}
        name={name}
        setName={setName}
        username={username}
        setUsername={setUsername}
        weight={weight}
        setWeight={handleSetWeight}
        onSave={handleSaveProfile}
      />
      <StatisticsModal
        visible={statisticsModalVisible}
        onClose={() => setStatisticsModalVisible(false)}
        statistics={statistics}
        loading={loading}
        error={error}
      />

      <Modal
        visible={leaderboardModalVisible}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.leaderboardContainer}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.leaderboardHeaderRow}>
            <View style={styles.backButtonIcon}>
              <TouchableOpacity
                onPress={() => setLeaderboardModalVisible(false)}
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.leaderboardHeaderText}>Leaderboard</Text>
          </View>
          {/*First three places UI */}
          <View style={styles.topThreeContainer}>
            <View style={styles.runnersUpContainer}>
              {/* 2nd Place User */}
              <View
                style={[
                  styles.topUsersPictureFrame,
                  topThreeUsers[1]?.id === user?.uid && {
                    borderColor: "rgba(62, 104, 35, 1)",
                    borderWidth: 5,
                  },
                ]}
              >
                {topThreeUsers[1]?.profilePicture ? (
                  <Image
                    source={{ uri: topThreeUsers[1].profilePicture }}
                    style={styles.topUsersPicture}
                  />
                ) : (
                  <MaterialIcons
                    name="person"
                    size={90}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                )}
              </View>
              <View style={styles.positionContainer}>
                <Text style={styles.positionText}>2</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.leaderboardName}>
                  {topThreeUsers[1]?.name || "Unknown User"}
                </Text>
                <Text style={styles.leaderboardPoints}>
                  {Math.round(topThreeUsers[1]?.score) || "0"} pts
                </Text>
              </View>
            </View>
            <View style={styles.topUserContainer}>
              {/* 1st Place User */}
              <View
                style={[
                  styles.topUsersPictureFrame,
                  topThreeUsers[0]?.id === user?.uid && {
                    borderColor: "rgba(62, 104, 35, 1)",
                    borderWidth: 5,
                  },
                ]}
              >
                {topThreeUsers[0]?.profilePicture ? (
                  <Image
                    source={{ uri: topThreeUsers[0].profilePicture }}
                    style={styles.topUsersPicture}
                  />
                ) : (
                  <MaterialIcons
                    name="person"
                    size={90}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                )}
              </View>
              <View style={styles.positionContainer}>
                <Text style={styles.positionText}>1</Text>
              </View>

              <View style={styles.userDetails}>
                <Text style={styles.leaderboardName}>
                  {topThreeUsers[0]?.name || "Unknown User"}
                </Text>
                <Text style={styles.leaderboardPoints}>
                  {Math.round(topThreeUsers[0]?.score) || "0"} pts
                </Text>
              </View>
            </View>

            <View style={styles.runnersUpContainer}>
              {/* 3rd Place User */}
              <View
                style={[
                  styles.topUsersPictureFrame,
                  topThreeUsers[2]?.id === user?.uid && {
                    borderColor: "rgba(62, 104, 35, 1)",
                    borderWidth: 5,
                  },
                ]}
              >
                {topThreeUsers[2]?.profilePicture ? (
                  <Image
                    source={{ uri: topThreeUsers[2].profilePicture }}
                    style={styles.topUsersPicture}
                  />
                ) : (
                  <MaterialIcons
                    name="person"
                    size={90}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                )}
              </View>
              <View style={styles.positionContainer}>
                <Text style={styles.positionText}>3</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.leaderboardName}>
                  {topThreeUsers[2]?.name || "Unknown User"}
                </Text>
                <Text style={styles.leaderboardPoints}>
                  {Math.round(topThreeUsers[2]?.score) || "0"} pts
                </Text>
              </View>
            </View>
          </View>

          {/* 4th - 10th UI*/}
          <View style={styles.topTenContainer}>
            {fourthToTenthUsers.map((userMap, index) => {
              const isCurrentUser = userMap.id === user?.uid;
              return (
                <View
                  key={userMap.id}
                  style={[
                    styles.topTenCard,
                    isCurrentUser && {
                      backgroundColor: "rgba(62, 104, 35, 1)",
                    },
                  ]}
                >
                  <View style={styles.topTenProfileContainer}>
                    <Text style={styles.topTenNumber}>{index + 4}</Text>
                    <View style={styles.topTenProfilePicture}>
                      {userMap?.profilePicture ? (
                        <Image source={{ uri: userMap.profilePicture }} />
                      ) : (
                        <MaterialIcons
                          name="person"
                          size={40}
                          color="rgba(255, 255, 255, 0.6)"
                        />
                      )}
                    </View>
                  </View>
                  <View style={styles.topTenDetailsContainer}>
                    <Text style={styles.topTenText}>
                      {userMap?.name || "Unknown User"}{" "}
                    </Text>
                    <Text style={styles.leaderboardPoints}>
                      {Math.round(userMap?.score) || "0"} pts
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
        </SafeAreaView>
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
    borderColor: "rgba(200, 200, 200, 0.7)",
    borderWidth: 1,
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
  leaderboardContainer: {
    flex: 1,
    backgroundColor: "rgba(47, 52, 55, 1)",
  },
  topThreeContainer: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
  },
  runnersUpContainer: {
    padding: 30,
  },
  leaderboardName: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 18,
    fontWeight: 500,
  },
  leaderboardPoints: {
    color: "rgba(131, 131, 131, 1)",
  },
  topUserContainer: {
    padding: 0,
  },
  leaderboardHeaderRow: {
    flexDirection: "row",
    paddingTop: 14,
    alignContent: "center",
    justifyContent: "center",
  },
  leaderboardHeaderText: {
    fontSize: 20,
    fontWeight: "500",
    color: "white",
    marginBottom: 24,
    fontFamily: "Inter",
  },
  backButtonIcon: {
    position: "absolute",
    left: 16,
    paddingTop: 15,
  },
  userDetails: {
    paddingTop: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  positionContainer: {
    marginTop: -8,
    alignItems: "center",
    justifyContent: "center",
  },
  positionText: {
    color: "rgba(255, 255, 255, 1)",
    backgroundColor: "rgba(255, 154, 2, 0.7)",
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: 500,
  },
  topUsersPictureFrame: {
    width: 90,
    height: 90,
    borderRadius: 90,
    borderColor: "rgba(82, 77, 77, 1)",
    borderWidth: 1,
  },
  topUsersPicture: {
    width: 81,
    height: 81,
    borderRadius: 90,
  },
  topTenContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    padding: 10,
  },
  topTenCard: {
    backgroundColor: "rgba(44, 44, 44, 0.9)",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  topTenProfileContainer: {
    justifyContent: "space-evenly",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  topTenText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 17,
    fontWeight: 500,
    flex: 1,
  },
  topTenProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 32,
    borderColor: "rgba(82, 77, 77, 1)",
    borderWidth: 0.8,
  },
  topTenNumber: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 16,
    fontWeight: 500,
    width: 26,
    textAlign: "center",
    marginRight: 10,
  },
  topTenDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
});
