
import React from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from "react-native";

import { useRouter } from "expo-router";

export default function AssignmentScreen() {

  const router = useRouter();

  return (

    <View style={styles.container}>

      {/* Screen heading */}
      <Text style={styles.title}>
        Assignment Manager
      </Text>

      <Text style={styles.subtitle}>
        Manage your assignments and deadlines.
      </Text>

      {/* Add assignment button */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>
          + Add Assignment
        </Text>
      </TouchableOpacity>

      {/* Back to Home */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          ← Back to Home
        </Text>
      </TouchableOpacity>

    </View>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingTop: 60
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#6C63FF"
  },

  subtitle: {
    fontSize: 15,
    color: "#777777",
    marginTop: 10
  },

  button: {
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center"
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  },

  backButton: {
    marginTop: 25
  },

  backText: {
    color: "#6C63FF",
    fontSize: 16
  }

});
