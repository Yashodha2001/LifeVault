
import React from "react";

import {
  View,
  Text,
  StyleSheet
} from "react-native";

export default function CalendarScreen() {

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        My Calendar
      </Text>

      <Text style={styles.subtitle}>
        Keep track of your important dates.
      </Text>

      <View style={styles.calendarCard}>

        <Text style={styles.month}>
          November 2026
        </Text>

        <Text style={styles.description}>
          Your events and deadlines will appear here.
        </Text>

      </View>

      <Text style={styles.sectionTitle}>
        Upcoming Activities
      </Text>

      <Text style={styles.emptyText}>
        No upcoming activities yet.
      </Text>

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
    marginTop: 10
  },

  calendarCard: {
    backgroundColor: "#F0EFFF",
    padding: 25,
    borderRadius: 15,
    marginTop: 30
  },

  month: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6C63FF"
  },

  description: {
    color: "#777777",
    marginTop: 15
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 30
  },

  emptyText: {
    color: "#999999",
    marginTop: 15
  }

});
