
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>LifeVault</Text>

      <Text style={styles.welcome}>Welcome back!</Text>

      <Text style={styles.subtitle}>Organize your life in one place.</Text>

      <Text style={styles.sectionTitle}>Your Modules</Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.navigate("/password")}
        >
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.cardTitle}>Password Vault</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.navigate("/medicine")}
        >
          <Text style={styles.icon}>💊</Text>
          <Text style={styles.cardTitle}>Medicine Manager</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.navigate("/dates")}
        >
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.cardTitle}>Important Dates</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.navigate("/assignment")}
        >
          <Text style={styles.icon}>🎓</Text>
          <Text style={styles.cardTitle}>Assignments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.navigate("/notes")}
        >
          <Text style={styles.icon}>📝</Text>
          <Text style={styles.cardTitle}>Notes & Memories</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.navigate("/reminder")}
        >
          <Text style={styles.icon}>⏰</Text>
          <Text style={styles.cardTitle}>Reminders</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6C63FF",
    marginTop: 30,
  },

  welcome: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
  },

  subtitle: {
    color: "#777777",
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 15,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#F0EFFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },

  icon: {
    fontSize: 30,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
});
