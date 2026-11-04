
import React from "react";

import {
  View,
  Text,
  StyleSheet
} from "react-native";

export default function ReminderScreen() {

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Reminder Manager
      </Text>

      <Text style={styles.subtitle}>
        Manage your daily activities.
      </Text>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          ⏰ Daily Reminders
        </Text>

        <Text style={styles.description}>
          Create reminders for your daily tasks.
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          📅 Upcoming Reminders
        </Text>

        <Text style={styles.description}>
          View your upcoming activities.
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          ✅ Completed Reminders
        </Text>

        <Text style={styles.description}>
          Check your completed activities.
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
