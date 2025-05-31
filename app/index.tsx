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

      <Text style={styles.welcome}>Welcome!</Text>
      <Text style={styles.message}>Login to your account!</Text>

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
        style={[styles.loginButton, loading && styles.disabledButton]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.forgotText}>Forgot Password?</Text>

      <Text style={styles.signupText}>
        Don't have an account?{ " "}
        <Text style={styles.signupLink} onPress={handleSignUp}>
          Sign Up
          </Text>
        </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D2951",
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoTextGym: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "bold"
  },
  logoTextAll: {
    color: "#ff9a02",
    fontSize: 36,
    fontWeight: "bold"
  },
  welcome: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
    color: "#fff",
  },
  message: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    height: 48,
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
    color: "#fff",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#1e90ff",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotText: {
    color: "#ccc",
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
  disabledButton: {
    opacity: 0.6,
  },
});
