
import React from "react";

import {
  View,
  Text,
  StyleSheet
} from "react-native";

export default function NotesScreen() {

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Notes & Memories
      </Text>

      <Text style={styles.subtitle}>
        Keep your thoughts and memories in one place.
      </Text>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          📝 Personal Notes
        </Text>

        <Text style={styles.description}>
          Store your personal information and ideas.
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          🎓 Study Notes
        </Text>

        <Text style={styles.description}>
          Keep important educational information.
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          ⭐ Favourite Memories
        </Text>

        <Text style={styles.description}>
          Save memories that matter to you.
        </Text>

      </View>

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
    color: "#777777",
    marginTop: 10,
    marginBottom: 25
  },

  card: {
    backgroundColor: "#F0EFFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold"
  },

  description: {
    color: "#777777",
    marginTop: 8
  }

});
