import { ThemedText } from "@/components/ThemedText";
import { db } from "@/FirebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
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
    }
    getUsername();
  }, []);

  const searchByUsername = async (username: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", ">=", username), where("username", "<=", username + "\uf8ff"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .filter((doc) => doc.id !== user?.uid)
      .map((doc) => ({ ...doc.data(), id: doc.id }));
  }

  const addFriend = async (currentUserId: string, friendUserId: string) => {
    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      await updateDoc(currentUserRef, {
        friends: arrayUnion(friendUserId),
      });
      setFollowingUsers(prev => new Set(prev).add(friendUserId));
    } catch (error) {
      Alert.alert("Error", error as string);
    }
  };

  const removeFriend = async (currentUserId: string, friendUserId: string) => {
    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      await updateDoc(currentUserRef, {
        friends: arrayRemove(friendUserId),
      });
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendUserId);
        return newSet;
      });
    } catch (error) {
      Alert.alert("Error", error as string);
    }
  };

  const toggleFollow = async (friendUserId: string) => {
    if (!user) return;
    
    const isFollowing = followingUsers.has(friendUserId);
    
    if (isFollowing) {
      await removeFriend(user.uid, friendUserId);
    } else {
      await addFriend(user.uid, friendUserId);
    }
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
          <Ionicons name="settings-outline" size={24} color="rgba(255, 255, 255, 0.8)" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAddFriendsPage(true)}>
        <Ionicons name="person-add-outline" size={24} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={settingsPage}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsContent}>
            <View style={styles.settingsHeader}>
            <TouchableOpacity onPress={() => setSettingsPage(false)}>
                  <Ionicons
                    name="chevron-back"
                    size={28}
                    color="rgb(255, 255, 255)"
                  />
                </TouchableOpacity>
            <ThemedText style={styles.settingsHeaderText}>Settings</ThemedText>
            </View>
            {/* To be continued, now just shows username and name */}
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

      <Modal
        visible={addFriendsPage}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.addFriendsOverlay}>
          <View style={styles.addFriendsContent}>
            <View style={styles.addFriendsHeader}>
            <TouchableOpacity onPress={() => setAddFriendsPage(false)}>
                  <Ionicons
                    name="chevron-back"
                    size={28}
                    color="rgb(255, 255, 255)"
                  />
                </TouchableOpacity>
            <ThemedText style={styles.addFriendsHeaderText}>Friends</ThemedText>
            </View>
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
                        {user.name && <ThemedText style={styles.nameText}>{user.name}</ThemedText>}
                          <ThemedText style={styles.usernameText}>{user.username}</ThemedText>
                        </View>
                        { isFollowing ? (
                          <TouchableOpacity 
                            style={styles.followButtonFollowed} 
                            onPress={() => toggleFollow(user.id)}
                          >
                            <ThemedText style={styles.followButtonFollowedText}>Following</ThemedText>
                          </TouchableOpacity>
                          ) : (
                          <TouchableOpacity 
                            style={styles.followButtonUnfollowed} 
                            onPress={() => toggleFollow(user.id)}
                          >
                            <ThemedText style={styles.followButtonUnfollowedText}>Follow</ThemedText>
                          </TouchableOpacity>
                        )}
                      </View>
                      {index < searchResults.length - 1 && <View style={styles.userSeparator} />}
                    </View>
                  );
                })}
              </View>
            )}
            {searchResults.length === 0 && searchInput.length > 0 && (
              <ThemedText>No users found.</ThemedText>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <ThemedText>Homepage to be done.</ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
  },
  header: {
    height: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34,34,34,1)",
    flexDirection: "row",
    gap: 236,
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
    paddingTop: 30,
  },
  settingsContent: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
    borderRadius: 12,
    padding: 16,
  },
  settingsHeader: {
    flexDirection: "row",
    gap: 135,
    alignItems: "center",
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
    paddingTop: 30,
  },
  addFriendsContent: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
    borderRadius: 12,
    padding: 16,
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  signOutText: {
    color: "rgba(255,77,77,1)",
    fontSize: 16,
  },
});

export default HomepageScreen;