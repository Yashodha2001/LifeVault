
import React from "react";

import {
  View,
  Text,
  StyleSheet
} from "react-native";

export default function DatesScreen() {

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Important Dates
      </Text>

      <Text style={styles.subtitle}>
        Never forget important moments.
      </Text>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          🎂 Birthdays
        </Text>

        <Text style={styles.description}>
          Remember your friends' and family's birthdays.
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          ❤️ Anniversaries
        </Text>

        <Text style={styles.description}>
          Keep track of special anniversaries.
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          📌 Other Events
        </Text>

        <Text style={styles.description}>
          Save appointments and other important events.
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
