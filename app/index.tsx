import { router } from "expo-router";
import {
  AuthError,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../FirebaseConfig";

export default function Index() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Check if the user is already logged in when the component mounts
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // If there's a user, navigate to the homepage
        router.replace("/(tabs)/homepage");
      }
      // Mark initialization as complete
      setInitializing(false);
    });

    // Clean up the auth listener on unmount
    return unsubscribe;
  }, []);

  const handleSignIn = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User signed in:", userCredential.user.uid);
      // Navigation will be handled by the auth state listener
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = authError.message || "Sign in failed";
      console.log(authError);
      Alert.alert("Sign in failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const userCredential: UserCredential =
        await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created:", userCredential.user.uid);
      // Navigation will be handled by the auth state listener
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = authError.message || "Sign up failed";
      console.log(authError);
      Alert.alert("Sign up failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show a loading spinner while checking authentication state
  if (initializing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1e90ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Login / Signup</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          styles.signupButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 40,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 15,
    color: "#fff",
    backgroundColor: "#111",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#1e90ff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  signupButton: {
    backgroundColor: "#32cd32", // green for signup
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
