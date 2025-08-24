import { ThemedText } from "@/components/ThemedText";
import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { ExerciseEntry, SavedWorkout } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const HomepageScreen: React.FC = () => {
  const { user, handleSignOut } = useAuth();
  const [username, setUsername] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [settingsPage, setSettingsPage] = useState(false);
  const [addFriendsPage, setAddFriendsPage] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [friendsWorkouts, setFriendsWorkouts] = useState<SavedWorkout[]>([]);
  const [userIdNameMap, setUserIdNameMap] = useState<{ [key: string]: string }>(
    {}
  );
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(
    null
  );
  const [workoutDetailPage, setWorkoutDetailPage] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user]);

  useEffect(() => {
    const getUsername = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user?.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username);
          setName(userData.name);
        }
      }
    };
    getUsername();
  }, []);

  useEffect(() => {
    if (user) {
      loadFriendsFromFirestore();
    }
  }, [user]);

  useEffect(() => {
    if (user && followingUsers.size > 0) {
      loadFriendsWorkouts();
    }
  }, [user, followingUsers]);

  const searchByUsername = async (username: string) => {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("username", ">=", username),
      where("username", "<=", username + "\uf8ff")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .filter((doc) => doc.id !== user?.uid)
      .map((doc) => ({ ...doc.data(), id: doc.id }));
  };

  const addFriend = async (currentUserId: string, friendUserId: string) => {
    try {
      const currentUserRef = doc(db, "users", currentUserId);
      await updateDoc(currentUserRef, {
        friends: arrayUnion(friendUserId),
      });
      setFollowingUsers((prevSet) => new Set(prevSet).add(friendUserId));
    } catch (error) {
      Alert.alert("Error", "Friend not added successfully");
    }
  };

  const loadFriendsFromFirestore = async () => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const currentUserRef = doc(db, "users", user.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      if (currentUserDoc.exists()) {
        const currentUserData = currentUserDoc.data();
        if (currentUserData.friends) {
          setFollowingUsers(new Set(currentUserData.friends));
        }
      }
    } catch (error) {
      Alert.alert("Error", "Unable to load users followed");
    }
  };

  const removeFriend = async (currentUserId: string, friendUserId: string) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const currentUserRef = doc(db, "users", currentUserId);
      await updateDoc(currentUserRef, {
        friends: arrayRemove(friendUserId),
      });
      setFollowingUsers((prevSet) => {
        const newSet = new Set(prevSet);
        newSet.delete(friendUserId);
        return newSet;
      });
    } catch (error) {
      Alert.alert("Error", "Unable to remove friend");
    }
  };

  const toggleFollow = async (friendUserId: string) => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    const isFollowing = followingUsers.has(friendUserId);

    if (isFollowing) {
      await removeFriend(user.uid, friendUserId);
      setFriendsWorkouts((prevWorkouts) =>
        prevWorkouts.filter((workout) => workout.userId !== friendUserId)
      );
      setUserIdNameMap((prevMap) => {
        const newMap = { ...prevMap };
        delete newMap[friendUserId];
        return newMap;
      });
    } else {
      await addFriend(user.uid, friendUserId);
      await loadFriendsWorkouts();
    }
  };

  const loadFriendsWorkouts = async () => {
    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }
    try {
      const workoutRef = collection(db, "workouts");
      const workoutList = await getDocs(workoutRef);
      const workouts: SavedWorkout[] = [];
      const userIdMap: { [key: string]: string } = {};

      for (const docSnapshot of workoutList.docs) {
        const data = docSnapshot.data();
        if (followingUsers.has(data.userId)) {
          workouts.push({
            userId: data.userId,
            id: docSnapshot.id,
            exercises: data.exercises,
            date: data.date.toDate(),
            duration: data.duration,
            workoutScore: data.workoutScore,
          });

          if (data.userId && !userIdMap[data.userId]) {
            try {
              const userRef = doc(db, "users", data.userId);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userIdMap[data.userId] = userData.name;
              }
            } catch (error) {
              Alert.alert("Error", "Unable to find user");
            }
          }
        }
      }
      setFriendsWorkouts(workouts);
      setUserIdNameMap((prevMap) => ({ ...prevMap, ...userIdMap }));
    } catch (error) {
      Alert.alert("Error", "Unable to load friends workouts");
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const openWorkoutDetail = (workout: SavedWorkout) => {
    setSelectedWorkout(workout);
    setWorkoutDetailPage(true);
  };

  const getTotalSets = (exercises: ExerciseEntry[]) => {
    return exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <ThemedText style={styles.headerTextGym}>gym</ThemedText>
          <ThemedText style={styles.headerTextAll}>All</ThemedText>
        </View>
        <View style={styles.headerIconsContainer}>
          <TouchableOpacity onPress={() => setSettingsPage(true)}>
            <Ionicons
              name="settings-outline"
              size={24}
              color="rgba(255, 255, 255, 0.8)"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAddFriendsPage(true)}>
            <Ionicons
              name="person-add-outline"
              size={24}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={settingsPage} animationType="slide" transparent={true}>
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsHeader}>
            <TouchableOpacity
              onPress={() => setSettingsPage(false)}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color="rgb(255, 255, 255)"
              />
            </TouchableOpacity>
            <ThemedText style={styles.settingsHeaderText}>Settings</ThemedText>
          </View>
          <View style={styles.settingsContent}>
            <View style={styles.settingsText}>
              <ThemedText>Username: {username}</ThemedText>
              <ThemedText>Name: {name}</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={addFriendsPage} animationType="slide" transparent={true}>
        <View style={styles.addFriendsOverlay}>
          <View style={styles.settingsHeader}>
            <TouchableOpacity
              onPress={() => setAddFriendsPage(false)}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color="rgb(255, 255, 255)"
              />
            </TouchableOpacity>
            <ThemedText style={styles.addFriendsHeaderText}>Friends</ThemedText>
          </View>
          <View style={styles.addFriendsContent}>
            <ScrollView>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter username"
                placeholderTextColor="rgba(255,255,255,0.8)"
                value={searchInput}
                onChangeText={setSearchInput}
              />
              <TouchableOpacity
                onPress={async () => {
                  const results = await searchByUsername(searchInput);
                  setSearchResults(results);
                }}
                style={styles.searchButton}
              >
                <ThemedText>Search</ThemedText>
              </TouchableOpacity>
              {searchResults.length > 0 && (
                <View>
                  {searchResults.map((user, index) => {
                    const isFollowing = followingUsers.has(user.id);
                    return (
                      <View key={index}>
                        <View style={styles.userRow}>
                          <View style={styles.userInfo}>
                            {user.name && (
                              <ThemedText style={styles.nameText}>
                                {user.name}
                              </ThemedText>
                            )}
                            <ThemedText style={styles.usernameText}>
                              {user.username}
                            </ThemedText>
                          </View>
                          {isFollowing ? (
                            <TouchableOpacity
                              style={styles.followButtonFollowed}
                              onPress={() => toggleFollow(user.id)}
                            >
                              <ThemedText
                                style={styles.followButtonFollowedText}
                              >
                                Following
                              </ThemedText>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.followButtonUnfollowed}
                              onPress={() => toggleFollow(user.id)}
                            >
                              <ThemedText
                                style={styles.followButtonUnfollowedText}
                              >
                                Follow
                              </ThemedText>
                            </TouchableOpacity>
                          )}
                        </View>
                        {index < searchResults.length - 1 && (
                          <View style={styles.userSeparator} />
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
              {searchResults.length === 0 && searchInput.length > 0 && (
                <ThemedText>No users found.</ThemedText>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.homepageContainer}>
        {friendsWorkouts.length > 0 ? (
          <View style={styles.friendsWorkoutsSection}>
            <ThemedText style={styles.subHeader}>Activities</ThemedText>
            {friendsWorkouts.map((workout, workoutIndex) => (
              <TouchableOpacity
                key={workoutIndex}
                style={styles.friendsWorkoutCard}
                onPress={() => openWorkoutDetail(workout)}
                activeOpacity={0.7}
              >
                <View style={styles.friendsWorkoutCardHeader}>
                  <View>
                    <ThemedText style={styles.friendsName}>
                      {userIdNameMap[workout.userId || ""]}
                    </ThemedText>
                    <ThemedText style={styles.workoutDateTime}>
                      {formatDate(workout.date)} at {formatTime(workout.date)}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="rgba(255,255,255,0.4)"
                  />
                </View>

                <View style={styles.friendsWorkoutCardBody}>
                  <View style={styles.workoutStats}>
                    <View style={styles.statsItem}>
                      <ThemedText style={styles.statsNumber}>
                        {workout.exercises.length}
                      </ThemedText>
                      <ThemedText style={styles.statsLabel}>
                        exercises
                      </ThemedText>
                    </View>
                    <View style={styles.statsItem}>
                      <ThemedText style={styles.statsNumber}>
                        {getTotalSets(workout.exercises)}
                      </ThemedText>
                      <ThemedText style={styles.statsLabel}>sets</ThemedText>
                    </View>
                    {workout.duration && (
                      <View style={styles.statsItem}>
                        <ThemedText style={styles.statsNumber}>
                          {workout.duration}
                        </ThemedText>
                        <ThemedText style={styles.statsLabel}>
                          duration
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <View>
                    <ThemedText style={styles.exercisePreviewText}>
                      {workout.exercises
                        .slice(0, 3)
                        .map((exercise) => exercise.name)
                        .join(", ")}
                      {workout.exercises.length > 3 &&
                        ` +${workout.exercises.length - 3} more`}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.friendsWorkoutsSection}>
            <ThemedText style={styles.subHeader}>Activities</ThemedText>
            <View style={styles.emptyStateContainer}>
              <ThemedText style={styles.noActivitiesText}>
                No friends' activities yet.
              </ThemedText>
              <ThemedText style={styles.noActivitiesSubText}>
                Add a friend now to see their activities!
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
      <Modal
        visible={workoutDetailPage}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.workoutDetailOverlay}>
          <View style={styles.workoutDetailContent}>
            <View style={styles.workoutDetailHeader}>
              <View>
                <ThemedText style={styles.friendsName}>
                  {selectedWorkout
                    ? userIdNameMap[selectedWorkout.userId || ""]
                    : ""}
                </ThemedText>
                <ThemedText style={styles.workoutDateTime}>
                  {selectedWorkout
                    ? formatDate(selectedWorkout.date) +
                      " at " +
                      formatTime(selectedWorkout.date)
                    : ""}
                </ThemedText>
              </View>
              <View>
                <TouchableOpacity
                  onPress={() => setWorkoutDetailPage(false)}
                  style={styles.closeDetailButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView>
              {selectedWorkout?.exercises.map((exercise, exerciseIndex) => (
                <View key={exerciseIndex} style={styles.exerciseDetailsCard}>
                  <ThemedText style={styles.exerciseDetailsName}>
                    {exercise.name}
                  </ThemedText>
                  <View style={styles.detailSetsContainer}>
                    {exercise.sets.map((set, setIndex) => (
                      <View key={setIndex} style={styles.detailsCardRow}>
                        <ThemedText style={styles.detailsSetNumber}>
                          Set {setIndex + 1}
                        </ThemedText>
                        <ThemedText style={styles.detailsCardText}>
                          {set.weight ? `${set.weight} kg` : "Bodyweight"} ×{" "}
                          {set.reps} reps
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
  },
  header: {
    height: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34,34,34,1)",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTextGym: {
    fontSize: 24,
    fontWeight: "bold",
    color: "rgba(255,255,255,1)",
  },
  headerTextAll: {
    fontSize: 24,
    fontWeight: "bold",
    color: "rgba(255,154,2,1)",
  },
  headerIconsContainer: {
    flexDirection: "row",
    gap: 15,
  },
  settingsOverlay: {
    flex: 1,
    paddingTop: 54,
  },
  backButton: {
    position: "absolute",
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  settingsContent: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
    borderRadius: 12,
    paddingHorizontal: 26,
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "rgb(0, 0, 0)",
  },
  settingsHeaderText: {
    color: "rgba(255,255,255,1)",
    fontSize: 18,
  },
  settingsText: {
    paddingTop: 20,
    marginBottom: 30,
  },
  signOutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,77,77,0.3)",
  },
  addFriendsOverlay: {
    flex: 1,
    paddingTop: 54,
  },
  addFriendsContent: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  addFriendsHeader: {
    flexDirection: "row",
    gap: 135,
    alignItems: "center",
    paddingBottom: 20,
  },
  addFriendsHeaderText: {
    color: "rgba(255,255,255,1)",
    fontSize: 18,
  },
  searchInput: {
    backgroundColor: "rgb(47, 47, 47)",
    color: "rgba(255,255,255,1)",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  searchButton: {
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 8,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 6,
  },
  userInfo: {
    alignItems: "flex-start",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,1)",
  },
  usernameText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  followButtonUnfollowed: {
    backgroundColor: "rgba(255,154,2,0.2)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,154,2,0.4)",
  },
  followButtonFollowed: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgb(136, 125, 125)",
  },
  followButtonUnfollowedText: {
    color: "rgba(255,154,2,1)",
    fontSize: 14,
    fontWeight: "500",
  },
  followButtonFollowedText: {
    color: "rgb(136, 125, 125)",
    fontSize: 14,
    fontWeight: "500",
  },
  userSeparator: {
    height: 1,
    backgroundColor: "rgb(46, 46, 46)",
  },
  homepageContainer: {
    flex: 1,
    padding: 16,
  },
  signOutText: {
    color: "rgba(255,77,77,1)",
    fontSize: 16,
  },
  friendsWorkoutsSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  friendsWorkoutCard: {
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  friendsWorkoutCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  friendsName: {
    color: "rgba(255,255,255,1)",
    fontWeight: "bold",
    fontSize: 18,
  },
  workoutDateTime: {
    color: "rgba(255,255,255,1)",
    fontSize: 13,
  },
  friendsWorkoutCardBody: {
    gap: 12,
  },
  workoutStats: {
    flexDirection: "row",
    gap: 30,
  },
  statsItem: {
    alignItems: "center",
  },
  statsNumber: {
    color: "rgba(255, 154, 2, 1)",
    fontSize: 20,
    fontWeight: "bold",
  },
  statsLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  subHeader: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    paddingLeft: 8,
  },
  exercisePreviewText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noActivitiesText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
  },
  noActivitiesSubText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  workoutDetailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    paddingTop: 50,
  },
  workoutDetailContent: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  workoutDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    paddingLeft: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  closeDetailButton: {
    padding: 8,
  },
  exerciseDetailsCard: {
    backgroundColor: "rgba(30, 30, 30, 0.6)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseDetailsName: {
    color: "rgba(255, 154, 2, 1)",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  detailSetsContainer: {
    gap: 8,
  },
  detailsCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailsSetNumber: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    minWidth: 50,
  },
  detailsCardText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default HomepageScreen;
