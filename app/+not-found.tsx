import { ThemedText } from "@/components/ThemedText";
import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <ThemedText style={styles.title}>This screen doesn't exist</ThemedText>
        <ThemedText style={styles.text}>
          The page you're looking for could not be found or has been removed.
        </ThemedText>

        <Link href="/" style={styles.link}>
          <ThemedText style={styles.linkText}>Go to home screen</ThemedText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#000",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 24,
    textAlign: "center",
  },
  link: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#1e90ff",
    borderRadius: 8,
  },
  linkText: {
    fontSize: 16,
    color: "#fff",
  },
});
