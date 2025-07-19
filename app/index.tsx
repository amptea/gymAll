import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const { initializing, handleSignIn, handleSignUp, handleEmailPasssword } =
    useAuth();
  const [weight, setWeight] = useState<number>(0);
  const [modalStep, setModalStep] = useState<null | "signup" | "profile">(null);

  if (initializing) {
    return (
      <View style={[styles.container]}>
        <ActivityIndicator size="large" color="#1e90ff" />
      </View>
    );
  }

  const handleSignupPage = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    await handleEmailPasssword(email, password);
    setModalStep("profile");
  };

  const handleCompleteSignup = async () => {
    if (!username || !name || weight === null) {
      Alert.alert("Error", "Please fill up all information.");
      return;
    }
    await handleSignUp(username, name, weight);
    setModalStep(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoTextGym}>gym</Text>
        <Text style={styles.logoTextAll}>All</Text>
      </View>

      <Text style={styles.welcomeText}>Welcome!</Text>
      <Text style={styles.messageText}>Login to your account!</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={styles.inputBox}>
          <Ionicons
            name="mail-outline"
            size={24}
            color="#888"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#aaa"
          />
        </View>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputBox}>
          <Ionicons
            name="lock-closed-outline"
            size={24}
            color="#888"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#aaa"
            secureTextEntry
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => handleSignIn(email, password)}
      >
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>
      <Text style={styles.forgotText}>Forgot Password?</Text>

      <Text style={styles.signupText}>
        Don't have an account?{" "}
        <Text style={styles.signupLink} onPress={() => setModalStep("signup")}>
          Sign Up
        </Text>
      </Text>

      <Modal visible={modalStep !== null} animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.signupContainer}>
            <View style={styles.signupHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (modalStep === "profile") {
                    setModalStep("signup");
                  } else {
                    setModalStep(null);
                  }
                }}
              >
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <Text style={styles.logoTextGym}>gym</Text>
                <Text style={styles.logoTextAll}>All</Text>
              </View>
              <View />
            </View>

            {modalStep === "signup" ? (
              <>
                <Text style={styles.headerText}>Getting Started</Text>
                <Text style={styles.subheaderText}>
                  Create an account to continue!
                </Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="mail-outline"
                      size={24}
                      color="#888"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholderTextColor="#aaa"
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={24}
                      color="#888"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholderTextColor="#aaa"
                      secureTextEntry
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={async () => {
                    handleSignupPage();
                  }}
                >
                  <Text style={styles.loginText}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.headerText}>Almost there!</Text>
                <Text style={styles.subheaderText}>
                  We just need some information to complete your signup.
                </Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="at-outline"
                      size={24}
                      color="#888"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={username}
                      onChangeText={setUsername}
                      placeholderTextColor="#aaa"
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="person-outline"
                      size={24}
                      color="#888"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholderTextColor="#aaa"
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="barbell-outline"
                      size={24}
                      color="#888"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={weight ? weight.toString() : ""}
                      onChangeText={(text) =>
                        setWeight(parseFloat(text.replace(/[^0-9.]/g, "")))
                      }
                      placeholderTextColor="#aaa"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={async () => handleCompleteSignup()}
                >
                  <Text style={styles.loginText}>Sign Up</Text>
                </TouchableOpacity>
              </>
            )}
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
    paddingTop: 10,
    paddingRight: 14,
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
  inputGroup: {
    marginBottom: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    paddingVertical: 10,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: "row",
    height: 46,
    backgroundColor: "rgba(34, 34, 34, 1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(51, 51, 51, 1)",
    color: "rgba(255, 255, 255, 1)",
    width: "100%",
  },
  inputIcon: {
    marginTop: 10,
    marginRight: 6,
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
    padding: 24,
  },
  signupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 20,
  },
  headerText: {
    color: "rgba(255, 255, 255, 1)",
    fontSize: 24,
    fontWeight: "bold",
  },
  subheaderText: {
    paddingTop: 14,
    paddingBottom: 50,
    color: "rgba(172, 169, 169, 1)",
    fontSize: 16,
  },
});
