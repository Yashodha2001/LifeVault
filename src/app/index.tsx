import { useCallback, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFocusEffect, useRouter } from "expo-router";

import {
  getNotes,
  getReminders,
  type Note,
  type Reminder,
} from "../database/database";

export default function HomeScreen() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  const loadDashboardData = () => {
    try {
      const savedNotes = getNotes();
      const savedReminders = getReminders();

      setNotes(savedNotes);
      setReminders(savedReminders);
    } catch (error) {
      console.log("Dashboard loading error:", error);
    }
  };

  // Refresh dashboard whenever the screen gets focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, []),
  );

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const totalNotes = notes.length;

  const totalReminders = reminders.length;

  const pendingReminders = reminders.filter(
    (item) => item.isCompleted === 0,
  ).length;

  const completedReminders = reminders.filter(
    (item) => item.isCompleted === 1,
  ).length;

  // ==========================================
  // UPCOMING REMINDERS
  // ==========================================

  const upcomingReminders = reminders
    .filter((item) => {
      if (item.isCompleted === 1) {
        return false;
      }

      const reminderDate = new Date(item.reminderDateTime.replace(" ", "T"));

      return (
        !Number.isNaN(reminderDate.getTime()) && reminderDate >= new Date()
      );
    })
    .sort(
      (a, b) =>
        new Date(a.reminderDateTime.replace(" ", "T")).getTime() -
        new Date(b.reminderDateTime.replace(" ", "T")).getTime(),
    )
    .slice(0, 3);

  // ==========================================
  // MODULE INFORMATION
  // ==========================================

  const modules = [
    {
      title: "Password Vault",
      description: "Securely manage your passwords",
      icon: "🔐",
      route: "/password",
    },
    {
      title: "Medicine Manager",
      description: "Manage medicines and daily doses",
      icon: "💊",
      route: "/medicine",
    },
    {
      title: "Important Dates",
      description: "Remember your special dates",
      icon: "📅",
      route: "/dates",
    },
    {
      title: "Assignment Manager",
      description: "Organize assignments and deadlines",
      icon: "🎓",
      route: "/assignment",
    },
    {
      title: "Notes & Memories",
      description: "Save your important memories",
      icon: "📝",
      route: "/notes",
    },
    {
      title: "Reminders",
      description: "Manage your daily activities",
      icon: "⏰",
      route: "/reminder",
    },
    {
      title: "Document & Media Vault",
      description: "Store personal and professional files, photos and videos",
      icon: "📁",
      route: "/documents",
    },
  ];

  // ==========================================
  // FORMAT REMINDER DATE
  // ==========================================

  const formatReminderDate = (dateValue: string) => {
    const date = new Date(dateValue.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // DASHBOARD UI
  // ==========================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.logo}>🔐 LifeVault</Text>

        <Text style={styles.welcome}>Welcome to LifeVault!</Text>

        <Text style={styles.subtitle}>
          Your personal space to organize your digital life, memories, medicines
          and important activities.
        </Text>
      </View>

      {/* STATISTICS */}

      <Text style={styles.sectionTitle}>Your Overview</Text>

      <View style={styles.statsContainer}>
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
          <Text style={styles.statIcon}>⌛</Text>

          <Text style={styles.statNumber}>{pendingReminders}</Text>

          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>✅</Text>

          <Text style={styles.statNumber}>{completedReminders}</Text>

          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* UPCOMING REMINDERS */}

      <View style={styles.upcomingHeader}>
        <Text style={styles.sectionTitle}>Upcoming Reminders</Text>

        <TouchableOpacity onPress={() => router.push("/reminder")}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {upcomingReminders.length === 0 ? (
        <View style={styles.emptyReminderCard}>
          <Text style={styles.emptyIcon}>📭</Text>

          <Text style={styles.emptyTitle}>No upcoming reminders</Text>

          <Text style={styles.emptyDescription}>
            Your upcoming reminders will appear here.
          </Text>
        </View>
      ) : (
        upcomingReminders.map((item) => (
          <View key={item.id} style={styles.reminderCard}>
            <View style={styles.reminderIconContainer}>
              <Text style={styles.reminderIcon}>⏰</Text>
            </View>

            <View style={styles.reminderDetails}>
              <Text style={styles.reminderTitle}>{item.title}</Text>

              <Text style={styles.reminderDate}>
                {formatReminderDate(item.reminderDateTime)}
              </Text>

              {item.category ? (
                <Text style={styles.reminderCategory}>{item.category}</Text>
              ) : null}
            </View>
          </View>
        ))
      )}

      {/* MODULES */}

      <Text style={styles.sectionTitle}>Your Modules</Text>

      <View style={styles.moduleContainer}>
        {modules.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.moduleCard}
            activeOpacity={0.75}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.moduleIcon}>{item.icon}</Text>

            <Text style={styles.moduleTitle}>{item.title}</Text>

            <Text style={styles.moduleDescription}>{item.description}</Text>

            <Text style={styles.openModule}>Open Module →</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FOOTER */}

      <View style={styles.footer}>
        <Text style={styles.footerText}>LifeVault – Your Life, Organized.</Text>

        <Text style={styles.footerSubText}>
          Manage today. Remember tomorrow.
        </Text>
      </View>
    </ScrollView>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8FC",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    backgroundColor: "#6C63FF",
    borderRadius: 20,
    padding: 22,
    marginTop: 20,
    marginBottom: 25,
  },

  logo: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  welcome: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    color: "#F0EFFF",
    fontSize: 14,
    lineHeight: 22,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#252544",
    marginBottom: 15,
    marginTop: 5,
  },

  // Statistics

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
  },

  statIcon: {
    fontSize: 25,
    marginBottom: 8,
  },

  statNumber: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6C63FF",
  },

  statLabel: {
    fontSize: 13,
    color: "#777",
    marginTop: 5,
  },

  // Upcoming reminders

  upcomingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  viewAll: {
    color: "#6C63FF",
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 10,
  },

  emptyReminderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 22,
    alignItems: "center",
    marginBottom: 25,
  },

  emptyIcon: {
    fontSize: 30,
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },

  emptyDescription: {
    fontSize: 12,
    color: "#888",
    marginTop: 6,
    textAlign: "center",
  },

  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },

  reminderIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#F0EFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  reminderIcon: {
    fontSize: 22,
  },

  reminderDetails: {
    flex: 1,
  },

  reminderTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },

  reminderDate: {
    fontSize: 12,
    color: "#6C63FF",
    marginTop: 5,
  },

  reminderCategory: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
  },

  // Module cards

  moduleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  moduleCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    marginBottom: 14,
    minHeight: 175,
    elevation: 2,
  },

  moduleIcon: {
    fontSize: 30,
    marginBottom: 12,
  },

  moduleTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#252544",
    marginBottom: 7,
  },

  moduleDescription: {
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
    flex: 1,
  },

  openModule: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6C63FF",
    marginTop: 12,
  },

  // Footer

  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 20,
  },

  footerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6C63FF",
  },

  footerSubText: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
});
