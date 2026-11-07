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
  toggleReminderCompleted,
  updateReminder,
} from "../database/database";

import type { Reminder } from "../database/database";

export default function ReminderScreen() {
  // Store reminder information
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Form input states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Personal");
  const [reminderDateTime, setReminderDateTime] = useState("");

  // Store the ID of the reminder being edited
  const [editingId, setEditingId] = useState<number | null>(null);

  // Load reminders when the screen opens
  useEffect(() => {
    loadReminders();
  }, []);

  // READ reminders from SQLite
  function loadReminders() {
    const data = getReminders();
    setReminders(data);
  }

  // Clear the form
  function clearForm() {
    setTitle("");
    setDescription("");
    setCategory("Personal");
    setReminderDateTime("");
    setEditingId(null);
  }

  // ADD or UPDATE reminder
  function handleSaveReminder() {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a reminder title.");
      return;
    }

    if (!reminderDateTime.trim()) {
      Alert.alert("Required", "Please enter a reminder date and time.");
      return;
    }

    // Expected format: YYYY-MM-DD HH:mm
    const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

    if (!dateTimePattern.test(reminderDateTime.trim())) {
      Alert.alert("Invalid date and time", "Use this format: 2026-11-08 09:30");
      return;
    }

    // Check whether the entered date and time are valid
    const parsedDate = new Date(reminderDateTime.replace(" ", "T"));

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getFullYear() !== Number(reminderDateTime.substring(0, 4)) ||
      parsedDate.getMonth() + 1 !== Number(reminderDateTime.substring(5, 7)) ||
      parsedDate.getDate() !== Number(reminderDateTime.substring(8, 10)) ||
      parsedDate.getHours() !== Number(reminderDateTime.substring(11, 13)) ||
      parsedDate.getMinutes() !== Number(reminderDateTime.substring(14, 16))
    ) {
      Alert.alert("Invalid date", "Please enter a real date and time.");
      return;
    }

    if (editingId !== null) {
      // UPDATE existing reminder
      updateReminder(
        editingId,
        title.trim(),
        description.trim(),
        category,
        reminderDateTime.trim(),
      );

      Alert.alert("Success", "Reminder updated successfully!");
    } else {
      // CREATE new reminder
      addReminder(
        title.trim(),
        description.trim(),
        category,
        reminderDateTime.trim(),
      );

      Alert.alert("Success", "Reminder added successfully!");
    }

    clearForm();
    loadReminders();
  }

  // EDIT reminder
  function handleEditReminder(reminder: Reminder) {
    setEditingId(reminder.id);
    setTitle(reminder.title);
    setDescription(reminder.description);
    setCategory(reminder.category || "Personal");
    setReminderDateTime(reminder.reminderDateTime);
  }

  // MARK reminder as completed or pending
  function handleToggleCompleted(reminder: Reminder) {
    const newStatus = reminder.isCompleted === 1 ? 0 : 1;

    toggleReminderCompleted(reminder.id, newStatus);

    loadReminders();
  }

  // DELETE reminder
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
          onPress: () => {
            deleteReminder(id);

            loadReminders();

            if (editingId === id) {
              clearForm();
            }
          },
        },
      ],
    );
  }

  // Separate pending and completed reminders
  const pendingReminders = reminders.filter((item) => item.isCompleted === 0);

  const completedReminders = reminders.filter((item) => item.isCompleted === 1);

  // Display each reminder
  function renderReminder(reminder: Reminder) {
    return (
      <View style={styles.reminderCard} key={reminder.id}>
        <Text style={styles.reminderTitle}>{reminder.title}</Text>

        <Text style={styles.description}>
          {reminder.description || "No description"}
        </Text>

        <Text style={styles.detail}>Category: {reminder.category}</Text>

        <Text style={styles.detail}>
          Date & Time: {reminder.reminderDateTime}
        </Text>

        <Text style={styles.status}>
          {reminder.isCompleted === 1 ? "Completed" : "Pending"}
        </Text>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleToggleCompleted(reminder)}
          >
            <Text style={styles.buttonText}>
              {reminder.isCompleted === 1 ? "Undo" : "Complete"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditReminder(reminder)}
          >
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Reminder Manager</Text>

      <Text style={styles.subtitle}>Manage your daily activities.</Text>

      {/* REMINDER FORM */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {editingId !== null ? "Edit Reminder" : "Create Reminder"}
        </Text>

        <Text style={styles.label}>Reminder Title</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter reminder title"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>

        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Enter description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Category</Text>

        <View style={styles.categoryContainer}>
          {["Personal", "Study", "Work"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.categoryButton,
                category === item && styles.selectedCategory,
              ]}
              onPress={() => setCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === item && styles.selectedCategoryText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date and Time</Text>

        <TextInput
          style={styles.input}
          placeholder="2026-11-08 09:30"
          value={reminderDateTime}
          onChangeText={setReminderDateTime}
          autoCapitalize="none"
        />

        <Text style={styles.helperText}>
          Format: YYYY-MM-DD HH:mm (24-hour time)
        </Text>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveReminder}
        >
          <Text style={styles.saveButtonText}>
            {editingId !== null ? "Update Reminder" : "Add Reminder"}
          </Text>
        </TouchableOpacity>

        {editingId !== null && (
          <TouchableOpacity style={styles.cancelButton} onPress={clearForm}>
            <Text style={styles.cancelButtonText}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* PENDING REMINDERS */}
      <Text style={styles.sectionTitle}>⏰ Upcoming / Pending Reminders</Text>

      {pendingReminders.length === 0 ? (
        <Text style={styles.emptyText}>No pending reminders yet.</Text>
      ) : (
        pendingReminders.map(renderReminder)
      )}

      {/* COMPLETED REMINDERS */}
      <Text style={styles.sectionTitle}>✅ Completed Reminders</Text>

      {completedReminders.length === 0 ? (
        <Text style={styles.emptyText}>No completed reminders yet.</Text>
      ) : (
        completedReminders.map(renderReminder)
      )}
    </ScrollView>
  );
}

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#6C63FF",
  },

  subtitle: {
    color: "#777777",
    marginTop: 10,
    marginBottom: 25,
  },

  formCard: {
    backgroundColor: "#F0EFFF",
    padding: 18,
    borderRadius: 15,
    marginBottom: 25,
  },

  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6C63FF",
    marginBottom: 15,
  },

  label: {
    fontWeight: "bold",
    marginBottom: 7,
    marginTop: 10,
    color: "#333333",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },

  descriptionInput: {
    minHeight: 75,
    textAlignVertical: "top",
  },

  helperText: {
    color: "#777777",
    fontSize: 12,
    marginTop: 6,
  },

  categoryContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 3,
  },

  categoryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#6C63FF",
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 20,
  },

  selectedCategory: {
    backgroundColor: "#6C63FF",
  },

  categoryText: {
    color: "#6C63FF",
    fontWeight: "600",
  },

  selectedCategoryText: {
    color: "#FFFFFF",
  },

  saveButton: {
    backgroundColor: "#6C63FF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  cancelButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 5,
  },

  cancelButtonText: {
    color: "#6C63FF",
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#6C63FF",
    marginBottom: 15,
    marginTop: 10,
  },

  reminderCard: {
    backgroundColor: "#F0EFFF",
    padding: 17,
    borderRadius: 13,
    marginBottom: 15,
  },

  reminderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },

  description: {
    color: "#666666",
    marginTop: 8,
  },

  detail: {
    color: "#555555",
    marginTop: 8,
    fontSize: 13,
  },

  status: {
    color: "#6C63FF",
    fontWeight: "bold",
    marginTop: 10,
  },

  actionContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
  },

  completeButton: {
    backgroundColor: "#28A745",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },

  editButton: {
    backgroundColor: "#6C63FF",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },

  deleteButton: {
    backgroundColor: "#DC3545",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },

  emptyText: {
    color: "#888888",
    marginBottom: 20,
  },
});
