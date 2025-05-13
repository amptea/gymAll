import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { AuthError, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
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
