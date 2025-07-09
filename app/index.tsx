import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from "react-native";
import * as ImagePicker from 'expo-image-picker';

import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function Index() {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [signupPage, setSignupPage] = useState<boolean>(false);
  const { initializing, handleSignIn, handleSignUp } = useAuth();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
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
        setProfilePicture(result.assets[0].uri);
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

  if (initializing) {
    return (
      <View style={[styles.container]}>
        <ActivityIndicator size="large" color="#1e90ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoTextGym}>gym</Text>
        <Text style={styles.logoTextAll}>All</Text>
      </View>

      <Text style={styles.welcomeText}>Welcome!</Text>
      <Text style={styles.messageText}>Login to your account!</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => handleSignIn(email, password)}
      >
      <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>
      <Text style={styles.forgotText}>Forgot Password?</Text>

      <Text style={styles.signupText}>
        Don't have an account?{" "}
        <Text style={styles.signupLink} onPress={() => setSignupPage(true)}>
          Sign Up
        </Text>
      </Text>

      <Modal visible={signupPage} animationType="slide" transparent={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.signupContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.signupHeader}>
              <TouchableOpacity onPress={() => setSignupPage(false)} style={{ marginRight: 12 }}>
                <Ionicons name="chevron-back" style={{ paddingBottom: 12 }} size={28} color="rgba(255, 255, 255, 1)" />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <Text style={styles.logoTextGym}>gym</Text>
                <Text style={styles.logoTextAll}>All</Text>
              </View>
              <View style={{ width: 28, marginLeft: 12 }} />
            </View>
            <Text style={styles.createAccountText}>Create your account</Text>
            
            <View style={styles.profilePictureSection}>
              <TouchableOpacity style={styles.profilePictureContainer} onPress={showImagePickerOptions}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
                ) : (
                  <View style={styles.profilePicturePlaceholder}>
                    <MaterialIcons name="person" size={32} color="rgba(255, 255, 255, 0.6)" />
                    <Text style={styles.profilePictureText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={showImagePickerOptions}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="rgba(170,170,170,1)"
              value={username}
              onChangeText={setUsername}
            />
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="rgba(170,170,170,1)"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(170,170,170,1)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(170,170,170,1)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => handleSignUp(email, password, username, name, profilePicture)}
            >
            <Text style={styles.loginText}>Sign Up</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logoTextGym: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 36,
    fontWeight: "bold",
  },
  logoTextAll: {
    color: "rgba(255, 154, 2, 1)",
    fontSize: 36,
    fontWeight: "bold",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
    color: "rgba(255, 255, 255, 1)",
  },
  messageText: {
    fontSize: 14,
    color: "rgba(204, 204, 204, 1)",
    marginBottom: 24,
  },
  input: {
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
  loginButton: {
    width: "100%",
    backgroundColor: "rgba(30, 144, 255, 1)",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  loginText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotText: {
    color: "rgba(204, 204, 204, 1)",
    marginTop: 12,
    fontSize: 13,
  },
  signupText: {
    marginTop: 20,
    fontSize: 14,
    color: "#ccc",
  },
  signupLink: {
    color: "#1e90ff",
    fontWeight: "bold",
  },
  signupContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,1)",
    justifyContent: "center",
    padding: 24,
  },
  signupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    marginTop: 10,
  },
  createAccountText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  profilePictureSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePictureContainer: {
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
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicturePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  profilePictureText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 4,
  },
  changePhotoText: {
    color: "rgba(30, 144, 255, 1)",
    fontSize: 14,
    fontWeight: "500",
  },
});
