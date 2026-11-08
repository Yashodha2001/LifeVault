import { useEffect, useState } from "react";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addReminder,
  deleteReminder,
  getReminders,
  Reminder,
  toggleReminderCompleted,
  updateReminder,
} from "../database/database";

import {
  cancelReminderNotification,
  scheduleReminderNotification,
} from "../utils/notifications";

// REMINDER MANAGER SCREEN
export default function ReminderScreen() {
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Personal");
  const [reminderDateTime, setReminderDateTime] = useState("");

  // Reminder list state
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);

  // Load reminders when screen opens
  useEffect(() => {
    loadReminders();
  }, []);

  // LOAD REMINDERS FROM SQLITE
  function loadReminders() {
    try {
      const data = getReminders();
      setReminders(data);
    } catch (error) {
      console.error("Loading reminders error:", error);
      Alert.alert("Error", "Could not load reminders.");
    }
  }

  // CLEAR FORM
  function clearForm() {
    setTitle("");
    setDescription("");
    setCategory("Personal");
    setReminderDateTime("");
    setEditingId(null);
  }

  // SAVE REMINDER
  async function handleSaveReminder() {
    // Check title
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a reminder title.");
      return;
    }

    // Check date and time
    if (!reminderDateTime.trim()) {
      Alert.alert("Required", "Please enter a reminder date and time.");
      return;
    }

    // Expected format: YYYY-MM-DD HH:mm
    const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

    if (!dateTimePattern.test(reminderDateTime.trim())) {
      Alert.alert("Invalid date", "Use this format: 2026-11-08 09:30");
      return;
    }

    // Separate date and time
    const [datePart, timePart] = reminderDateTime.trim().split(" ");

    const [year, month, day] = datePart.split("-").map(Number);

    const [hour, minute] = timePart.split(":").map(Number);

    const selectedDate = new Date(year, month - 1, day, hour, minute);

    // Validate actual date and time
    if (
      selectedDate.getFullYear() !== year ||
      selectedDate.getMonth() !== month - 1 ||
      selectedDate.getDate() !== day ||
      selectedDate.getHours() !== hour ||
      selectedDate.getMinutes() !== minute
    ) {
      Alert.alert("Invalid date", "Please enter a valid date and time.");
      return;
    }

    // Check future date
    if (selectedDate.getTime() <= Date.now()) {
      Alert.alert("Past date", "Please select a future date and time.");
      return;
    }

    try {
      // Schedule new phone notification
      const newNotificationId = await scheduleReminderNotification(
        title.trim(),
        description.trim(),
        reminderDateTime.trim(),
      );

      // UPDATE EXISTING REMINDER
      if (editingId !== null) {
        const oldReminder = reminders.find((item) => item.id === editingId);

        // Cancel old notification
        await cancelReminderNotification(oldReminder?.notificationId ?? null);

        // Update reminder in database
        updateReminder(
          editingId,
          title.trim(),
          description.trim(),
          category,
          reminderDateTime.trim(),
          newNotificationId,
        );
      }

      // ADD NEW REMINDER
      else {
        addReminder(
          title.trim(),
          description.trim(),
          category,
          reminderDateTime.trim(),
          newNotificationId,
        );
      }

      // Clear and reload
      clearForm();
      loadReminders();

      if (newNotificationId) {
        Alert.alert(
          "Success",
          "Reminder saved and phone notification scheduled!",
        );
      } else {
        Alert.alert(
          "Reminder saved",
          "Notification permission was not granted, so no phone notification was scheduled.",
        );
      }
    } catch (error) {
      console.error("Reminder save error:", error);

      Alert.alert("Error", "Could not save or schedule the reminder.");
    }
  }

  // EDIT REMINDER
  function handleEditReminder(reminder: Reminder) {
    setTitle(reminder.title);
    setDescription(reminder.description);
    setCategory(reminder.category);
    setReminderDateTime(reminder.reminderDateTime);
    setEditingId(reminder.id);
  }

  // COMPLETE OR UNDO REMINDER
  async function handleToggleCompleted(reminder: Reminder) {
    const newStatus = reminder.isCompleted === 1 ? 0 : 1;

    try {
      let newNotificationId = reminder.notificationId;

      // If completed, cancel notification
      if (newStatus === 1) {
        await cancelReminderNotification(reminder.notificationId);

        newNotificationId = null;
      }

      // If undone, schedule notification again
      else {
        newNotificationId = await scheduleReminderNotification(
          reminder.title,
          reminder.description,
          reminder.reminderDateTime,
        );
      }

      // Update database
      toggleReminderCompleted(reminder.id, newStatus, newNotificationId);

      loadReminders();
    } catch (error) {
      console.error("Completion update error:", error);

      Alert.alert("Error", "Could not update reminder status.");
    }
  }

  // DELETE REMINDER
  function handleDeleteReminder(id: number) {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to delete this reminder?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            try {
              const reminder = reminders.find((item) => item.id === id);

              // Cancel scheduled notification
              await cancelReminderNotification(
                reminder?.notificationId ?? null,
              );

              // Delete from database
              deleteReminder(id);

              loadReminders();

              if (editingId === id) {
                clearForm();
              }
            } catch (error) {
              console.error("Delete reminder error:", error);

              Alert.alert("Error", "Could not delete reminder.");
            }
          },
        },
      ],
    );
  }

  // SEPARATE PENDING AND COMPLETED REMINDERS
  const pendingReminders = reminders.filter((item) => item.isCompleted === 0);

  const completedReminders = reminders.filter((item) => item.isCompleted === 1);

  // CATEGORY BUTTON
  function CategoryButton({ value }: { value: string }) {
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          category === value && styles.selectedCategory,
        ]}
        onPress={() => setCategory(value)}
      >
        <Text
          style={[
            styles.categoryText,
            category === value && styles.selectedCategoryText,
          ]}
        >
          {value}
        </Text>
      </TouchableOpacity>
    );
  }

  // REMINDER CARD
  function ReminderCard({ reminder }: { reminder: Reminder }) {
    const isCompleted = reminder.isCompleted === 1;

    return (
      <View style={styles.reminderCard}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderInfo}>
            <Text
              style={[
                styles.reminderTitle,
                isCompleted && styles.completedText,
              ]}
            >
              {reminder.title}
            </Text>

            <Text style={styles.categoryLabel}>{reminder.category}</Text>
          </View>
        </View>

        {reminder.description ? (
          <Text style={styles.reminderDescription}>{reminder.description}</Text>
        ) : null}

        <Text style={styles.dateText}>Date: {reminder.reminderDateTime}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleToggleCompleted(reminder)}
          >
            <Text style={styles.buttonText}>
              {isCompleted ? "Undo" : "Complete"}
            </Text>
          </TouchableOpacity>

          {!isCompleted && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditReminder(reminder)}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteReminder(reminder.id)}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // MAIN SCREEN
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.heading}>Reminder Manager</Text>

      <Text style={styles.subtitle}>Manage your daily activities.</Text>

      {/* ADD / EDIT REMINDER FORM */}

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>
          {editingId !== null ? "Edit Reminder" : "Add New Reminder"}
        </Text>

        {/* Title */}
        <Text style={styles.label}>Reminder Title</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter reminder title"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>

        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Enter description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>

        <View style={styles.categoryRow}>
          <CategoryButton value="Personal" />
          <CategoryButton value="Study" />
          <CategoryButton value="Work" />
        </View>

        {/* Date and Time */}
        <Text style={styles.label}>Reminder Date and Time</Text>

        <TextInput
          style={styles.input}
          placeholder="2026-11-08 09:30"
          value={reminderDateTime}
          onChangeText={setReminderDateTime}
          autoCapitalize="none"
        />

        <Text style={styles.hint}>Format: YYYY-MM-DD HH:mm (24-hour time)</Text>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveReminder}
        >
          <Text style={styles.saveButtonText}>
            {editingId !== null ? "Update Reminder" : "Save Reminder"}
          </Text>
        </TouchableOpacity>

        {/* Cancel Edit */}
        {editingId !== null && (
          <TouchableOpacity style={styles.cancelButton} onPress={clearForm}>
            <Text style={styles.cancelButtonText}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DAILY REMINDERS */}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Daily Reminders</Text>

        <Text style={styles.summaryNumber}>{pendingReminders.length}</Text>

        <Text style={styles.summaryDescription}>Pending reminders</Text>
      </View>

      {/* UPCOMING / PENDING REMINDERS */}

      <Text style={styles.sectionTitle}>Upcoming Reminders</Text>

      {pendingReminders.length === 0 ? (
        <Text style={styles.emptyText}>No upcoming reminders.</Text>
      ) : (
        pendingReminders.map((reminder) => (
          <ReminderCard key={reminder.id} reminder={reminder} />
        ))
      )}

      {/* COMPLETED REMINDERS */}

      <View style={styles.completedSection}>
        <Text style={styles.sectionTitle}>Completed Reminders</Text>

        {completedReminders.length === 0 ? (
          <Text style={styles.emptyText}>No completed reminders.</Text>
        ) : (
          completedReminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ==================================================
//                       STYLES
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#20243A",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: 5,
    marginBottom: 20,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#20243A",
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 9,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },

  descriptionInput: {
    minHeight: 75,
    textAlignVertical: "top",
  },

  categoryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 5,
  },

  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    alignItems: "center",
  },

  selectedCategory: {
    backgroundColor: "#5146D8",
    borderColor: "#5146D8",
  },

  categoryText: {
    fontSize: 12,
    color: "#333333",
  },

  selectedCategoryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  hint: {
    fontSize: 11,
    color: "#888888",
    marginTop: 6,
  },

  saveButton: {
    backgroundColor: "#5146D8",
    padding: 14,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 20,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  cancelButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 5,
  },

  cancelButtonText: {
    color: "#5146D8",
    fontWeight: "600",
  },

  summaryCard: {
    backgroundColor: "#E9E8FF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 25,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },

  summaryNumber: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#5146D8",
    marginTop: 8,
  },

  summaryDescription: {
    color: "#666666",
    fontSize: 13,
  },

  reminderCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  reminderInfo: {
    flex: 1,
  },

  reminderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222222",
  },

  completedText: {
    textDecorationLine: "line-through",
    color: "#888888",
  },

  categoryLabel: {
    fontSize: 12,
    color: "#5146D8",
    marginTop: 4,
  },

  reminderDescription: {
    fontSize: 13,
    color: "#666666",
    marginTop: 10,
  },

  dateText: {
    fontSize: 12,
    color: "#888888",
    marginTop: 10,
  },

  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  completeButton: {
    flex: 1,
    backgroundColor: "#269B65",
    padding: 10,
    borderRadius: 7,
    alignItems: "center",
  },

  editButton: {
    flex: 1,
    backgroundColor: "#5146D8",
    padding: 10,
    borderRadius: 7,
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#D94343",
    padding: 10,
    borderRadius: 7,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },

  emptyText: {
    color: "#888888",
    fontSize: 14,
    marginBottom: 20,
  },

  completedSection: {
    marginTop: 20,
  },
});
