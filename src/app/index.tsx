
import React from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from "react-native";

import { useRouter } from "expo-router";

// All module names and routes
const modules = [
  {
    title: "Password Vault",
    icon: "🔐",
    route: "/password"
  },
  {
    title: "Medicine Manager",
    icon: "💊",
    route: "/medicine"
  },
  {
    title: "Important Dates",
    icon: "📅",
    route: "/dates"
  },
  {
    title: "Assignments",
    icon: "🎓",
    route: "/assignment"
  },
  {
    title: "Notes & Memories",
    icon: "📝",
    route: "/notes"
  },
  {
    title: "Reminders",
    icon: "⏰",
    route: "/reminder"
  }
];

export default function HomeScreen() {

  const router = useRouter();

  return (

    <ScrollView style={styles.container}>

      <Text style={styles.heading}>
        LifeVault
      </Text>

      <Text style={styles.welcome}>
        Welcome back!
      </Text>

      <Text style={styles.subtitle}>
        Organize your life in one place.
      </Text>

      <Text style={styles.sectionTitle}>
        Your Modules
      </Text>

      <View style={styles.grid}>

        {modules.map((item) => (

          <TouchableOpacity
            key={item.route}
            style={styles.card}
            onPress={() => router.push(item.route as any)}
          >

            <Text style={styles.icon}>
              {item.icon}
            </Text>

            <Text style={styles.cardTitle}>
              {item.title}
            </Text>

          </TouchableOpacity>

        ))}

      </View>

    </ScrollView>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6C63FF",
    marginTop: 30
  },

  welcome: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20
  },

  subtitle: {
    color: "#777777",
    marginTop: 5
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 15
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  card: {
    width: "48%",
    backgroundColor: "#F0EFFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15
  },

  icon: {
    fontSize: 30,
    marginBottom: 10
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "600"
  }

});
