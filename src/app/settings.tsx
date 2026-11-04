
import React from "react";

import {
  View,
  Text,
  StyleSheet
} from "react-native";

export default function SettingsScreen() {

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Settings
      </Text>

      <Text style={styles.subtitle}>
        Manage your LifeVault preferences.
      </Text>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          🔐 App Security
        </Text>

        <Text style={styles.description}>
          Manage your app security settings.
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          🔔 Notifications
        </Text>

        <Text style={styles.description}>
          Manage your reminder notifications.
        </Text>

      </View>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          ℹ️ About LifeVault
        </Text>

        <Text style={styles.description}>
          Your personal offline memory manager.
        </Text>

      </View>

      <Text style={styles.version}>
        LifeVault Version 1.0
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
  },

  version: {
    textAlign: "center",
    color: "#999999",
    marginTop: 30
  }

});
