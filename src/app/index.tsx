import { useCallback, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect, useRouter } from "expo-router";
import { db } from "../database/database";

// TypeScript type for reminder records
type Reminder = {
  id: number;
  title: string;
  description: string;
  reminderDateTime: string;
  isCompleted: number;
};

export default function HomeScreen() {
  const router = useRouter();

  // Dashboard statistics
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalReminders, setTotalReminders] = useState(0);
  const [pendingReminders, setPendingReminders] = useState(0);
  const [completedReminders, setCompletedReminders] = useState(0);

  // Upcoming reminder list
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);

  // Load dashboard information from SQLite
  const loadDashboardData = () => {
    try {
      // Get total number of notes
      const notesResult = db.getFirstSync<{ total: number }>(
        "SELECT COUNT(*) AS total FROM notes",
      );

      setTotalNotes(notesResult?.total ?? 0);

      // Get total number of reminders
      const remindersResult = db.getFirstSync<{ total: number }>(
        "SELECT COUNT(*) AS total FROM reminders",
      );

      setTotalReminders(remindersResult?.total ?? 0);

      // Get pending reminders
      const pendingResult = db.getFirstSync<{ total: number }>(
        "SELECT COUNT(*) AS total FROM reminders WHERE isCompleted = 0",
      );

      setPendingReminders(pendingResult?.total ?? 0);

      // Get completed reminders
      const completedResult = db.getFirstSync<{ total: number }>(
        "SELECT COUNT(*) AS total FROM reminders WHERE isCompleted = 1",
      );

      setCompletedReminders(completedResult?.total ?? 0);

      // Get reminders that are not completed
      const allPending = db.getAllSync<Reminder>(
        "SELECT id, title, description, reminderDateTime, isCompleted FROM reminders WHERE isCompleted = 0",
      );

      // Convert stored date strings into JavaScript Date objects
      const now = new Date();

      const upcoming = allPending
        .filter((reminder) => {
          const reminderDate = new Date(
            reminder.reminderDateTime.replace(" ", "T"),
          );

          return !isNaN(reminderDate.getTime()) && reminderDate >= now;
        })
        .sort((a, b) => {
          return (
            new Date(a.reminderDateTime.replace(" ", "T")).getTime() -
            new Date(b.reminderDateTime.replace(" ", "T")).getTime()
          );
        })
        .slice(0, 3);

      setUpcomingReminders(upcoming);
    } catch (error) {
      console.error("Dashboard loading error:", error);
    }
  };

  // Refresh dashboard whenever this screen becomes active
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, []),
  );

  // Format reminder date and time
  const formatReminderDate = (dateTime: string) => {
    const date = new Date(dateTime.replace(" ", "T"));

    if (isNaN(date.getTime())) {
      return dateTime;
    }

    return date.toLocaleString();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Dashboard heading */}
      <Text style={styles.heading}>LifeVault</Text>

      <Text style={styles.welcome}>Welcome back!</Text>

      <Text style={styles.subtitle}>Organize your life in one place.</Text>

      {/* Statistics section */}
      <Text style={styles.sectionTitle}>Your Overview</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statNumber}>{totalNotes}</Text>
          <Text style={styles.statLabel}>Total Notes</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏰</Text>
          <Text style={styles.statNumber}>{totalReminders}</Text>
          <Text style={styles.statLabel}>Total Reminders</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📌</Text>
          <Text style={styles.statNumber}>{pendingReminders}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statNumber}>{completedReminders}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Upcoming reminders section */}
      <View style={styles.upcomingHeader}>
        <Text style={styles.sectionTitle}>Upcoming Reminders</Text>

        <TouchableOpacity onPress={() => router.navigate("/reminder")}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {upcomingReminders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No upcoming reminders.</Text>
        </View>
      ) : (
        upcomingReminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderCard}>
            <Text style={styles.reminderTitle}>⏰ {reminder.title}</Text>

            <Text style={styles.reminderDate}>
              {formatReminderDate(reminder.reminderDateTime)}
            </Text>
          </View>
        ))
      )}

      {/* Existing modules */}
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

// Dashboard styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
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

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    backgroundColor: "#F0EFFF",
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    alignItems: "center",
  },

  statIcon: {
    fontSize: 27,
    marginBottom: 8,
  },

  statNumber: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#6C63FF",
  },

  statLabel: {
    fontSize: 14,
    color: "#555555",
    marginTop: 5,
  },

  upcomingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  viewAll: {
    color: "#6C63FF",
    fontWeight: "bold",
    marginTop: 15,
  },

  emptyCard: {
    backgroundColor: "#F7F7FC",
    padding: 18,
    borderRadius: 12,
  },

  emptyText: {
    color: "#777777",
    textAlign: "center",
  },

  reminderCard: {
    backgroundColor: "#F7F7FC",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#6C63FF",
  },

  reminderTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  reminderDate: {
    fontSize: 13,
    color: "#777777",
    marginTop: 7,
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
