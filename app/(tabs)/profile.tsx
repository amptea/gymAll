import { ThemedText } from "@/components/ThemedText";
import {View, StyleSheet } from 'react-native';

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
    justifyContent: 'center', // center vertically
    alignItems: 'center',     // center horizontally
    backgroundColor: '#000',  // black background
  },
  text: {
    color: '#fff',
    fontSize: 18,            // font size
  },
});