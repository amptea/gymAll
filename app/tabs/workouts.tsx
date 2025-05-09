import { ThemedText } from "@/components/ThemedText";
import { StyleSheet, View } from "react-native";

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.text}>Workout page to be done.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center", // center vertically
    alignItems: "center", // center horizontally
    backgroundColor: "#000", // black background
  },
  text: {
    color: "#fff", // white text
    fontSize: 18,
  },
});
