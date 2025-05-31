import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { AuthError, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  SafeAreaView,
} from "react-native";
import { auth } from "../../FirebaseConfig";

export default function HomepageScreen() {
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace("/");
      }
    });

    // Clean up the listener on unmount
    return unsubscribe;
  }, []);

  const handleSignOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign out error:", authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <ThemedText style={styles.headerTextGym}>gym</ThemedText>
          <ThemedText style={styles.headerTextAll}>All</ThemedText>
        </View>
      </View>
      <View style={styles.container}>
        <ThemedText style={styles.text}>Homepage to be done.</ThemedText>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSignOut}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ff4d4d" />
          ) : (
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          )}
        </TouchableOpacity>
      </View>
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
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextGym: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerTextAll: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff9a02",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 18,
    marginVertical: 10,
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  signOutText: {
    color: "#ff4d4d", // red color for sign out
    fontSize: 16,
  },
});
