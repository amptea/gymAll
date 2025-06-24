import { ThemedText } from "@/components/ThemedText";
import { StyleSheet, View } from "react-native";

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.text}>Profile page to be done.</ThemedText>
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
  },
});
