import { ThemedText } from "@/components/ThemedText";
import { StyleSheet, View, SafeAreaView, Image, TouchableOpacity, Text, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/FirebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editProfilePicture, setEditProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setProfilePicture(data.profilePicture || null);
            setEditName(data.name || "");
            setEditUsername(data.username || "");
            setEditProfilePicture(data.profilePicture || null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName || !editUsername) {
      Alert.alert("Missing information", "Please fill in all the fields");
      return;
    }

    try {
      await updateDoc(doc(db, "users", user!.uid), {
        name: editName,
        username: editUsername,
        profilePicture: editProfilePicture || null,
      });

      setUserData((prev: any) => ({
        ...prev,
        name: editName,
        username: editUsername,
        profilePicture: editProfilePicture || null,
      }));
      setProfilePicture(editProfilePicture || null);

      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission needed", "Camera permission is required to take a photo");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      "Profile Picture",
      "Choose an option",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <ThemedText style={styles.userName}>
          {userData?.name}
        </ThemedText>
      </View>
      
      <View style={styles.profileSection}>
        <View style={styles.profileRow}>
          <View style={styles.profilePictureContainer}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <MaterialIcons name="person" size={80} color="rgba(255, 255, 255, 0.6)" />
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={editModalVisible} animationType="slide" transparent={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.editModalContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.editModalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ marginRight: 12 }}>
                <MaterialIcons name="close" size={28} color="rgba(255, 255, 255, 1)" />
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Edit Profile</Text>
              <View style={{ width: 28, marginLeft: 12 }} />
            </View>

            <View style={styles.editProfilePictureSection}>
              <TouchableOpacity style={styles.editProfilePictureContainer} onPress={showImagePickerOptions}>
                {editProfilePicture ? (
                  <Image source={{ uri: editProfilePicture }} style={styles.editProfilePicture} />
                ) : (
                  <View style={styles.editProfilePicturePlaceholder}>
                    <MaterialIcons name="person" size={32} color="rgba(255, 255, 255, 0.6)" />
                    <Text style={styles.editProfilePictureText}>Change Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={showImagePickerOptions}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.editInput}
              placeholder="Name"
              placeholderTextColor="rgba(170,170,170,1)"
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={styles.editInput}
              placeholder="Username"
              placeholderTextColor="rgba(170,170,170,1)"
              value={editUsername}
              onChangeText={setEditUsername}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    height: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34,34,34,1)",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "rgba(255,255,255,1)",
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  profilePictureContainer: {
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: "rgba(34, 34, 34, 1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(51, 51, 51, 1)",
  },
  profilePicture: {
    width: 180,
    height: 180,
    borderRadius: 100,
  },
  profilePicturePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  profilePictureText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.8)",
  },
  editButton: {
    backgroundColor: "rgba(255, 154, 2, 1)",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 40,
  },
  editButtonText: {
    color: "rgb(0, 0, 0)",
    fontSize: 16,
    fontWeight: "600",
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
  editProfilePictureText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 4,
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
});
