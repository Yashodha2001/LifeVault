import { useEffect, useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addAssignment,
  deleteAssignment,
  getAssignments,
  toggleAssignmentCompleted,
  updateAssignment,
  type Assignment,
} from "../database/database";

type Priority = "Low" | "Medium" | "High";
type Filter = "All" | "Pending" | "Completed" | "Overdue";

export default function AssignmentScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  // ------------------------------------------
  // LOAD ASSIGNMENTS FROM SQLITE
  // ------------------------------------------

  const loadAssignments = () => {
    try {
      const savedAssignments = getAssignments();
      setAssignments(savedAssignments);
    } catch (error) {
      console.log("Load assignments error:", error);
      Alert.alert("Error", "Unable to load assignments.");
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  // ------------------------------------------
  // DATE VALIDATION
  // Format: YYYY-MM-DD
  // ------------------------------------------

  const isValidDate = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  // ------------------------------------------
  // CLEAR FORM
  // ------------------------------------------

  const clearForm = () => {
    setTitle("");
    setSubject("");
    setDescription("");
    setDueDate("");
    setPriority("Medium");
    setEditingId(null);
  };

  // ------------------------------------------
  // SAVE OR UPDATE ASSIGNMENT
  // ------------------------------------------

  const handleSave = () => {
    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();
    const cleanDate = dueDate.trim();

    if (!cleanTitle || !cleanSubject || !cleanDate) {
      Alert.alert(
        "Missing Information",
        "Please enter the assignment title, subject and due date.",
      );
      return;
    }

    if (!isValidDate(cleanDate)) {
      Alert.alert(
        "Invalid Date",
        "Please enter a valid date using YYYY-MM-DD format.",
      );
      return;
    }

    try {
      if (editingId !== null) {
        updateAssignment(
          editingId,
          cleanTitle,
          cleanSubject,
          cleanDescription,
          cleanDate,
          priority,
        );

        Alert.alert("Success", "Assignment updated successfully.");
      } else {
        addAssignment(
          cleanTitle,
          cleanSubject,
          cleanDescription,
          cleanDate,
          priority,
        );

        Alert.alert("Success", "Assignment added successfully.");
      }

      clearForm();
      loadAssignments();
    } catch (error) {
      console.log("Save assignment error:", error);
      Alert.alert("Error", "Unable to save assignment.");
    }
  };

  // ------------------------------------------
  // EDIT ASSIGNMENT
  // ------------------------------------------

  const handleEdit = (item: Assignment) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSubject(item.subject);
    setDescription(item.description || "");
    setDueDate(item.dueDate);
    setPriority(item.priority);
  };

  // ------------------------------------------
  // DELETE ASSIGNMENT
  // ------------------------------------------

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Assignment",
      "Are you sure you want to delete this assignment?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              deleteAssignment(id);

              if (editingId === id) {
                clearForm();
              }

              loadAssignments();

              Alert.alert("Deleted", "Assignment deleted successfully.");
            } catch (error) {
              console.log("Delete assignment error:", error);
              Alert.alert("Error", "Unable to delete assignment.");
            }
          },
        },
      ],
    );
  };

  // ------------------------------------------
  // COMPLETE / UNDO ASSIGNMENT
  // ------------------------------------------

  const handleToggleComplete = (item: Assignment) => {
    try {
      const newStatus = item.isCompleted === 1 ? 0 : 1;

      toggleAssignmentCompleted(item.id, newStatus);

      loadAssignments();
    } catch (error) {
      console.log("Update assignment status error:", error);
      Alert.alert("Error", "Unable to update assignment status.");
    }
  };

  // ------------------------------------------
  // CHECK OVERDUE ASSIGNMENTS
  // ------------------------------------------

  const isOverdue = (item: Assignment) => {
    if (item.isCompleted === 1) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = item.dueDate.split("-").map(Number);

    const deadline = new Date(year, month - 1, day);

    return deadline < today;
  };

  // ------------------------------------------
  // SEARCH AND FILTER
  // ------------------------------------------

  const filteredAssignments = assignments.filter((item) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      item.title.toLowerCase().includes(searchText) ||
      item.subject.toLowerCase().includes(searchText);

    let matchesFilter = true;

    if (filter === "Pending") {
      matchesFilter = item.isCompleted === 0 && !isOverdue(item);
    }

    if (filter === "Completed") {
      matchesFilter = item.isCompleted === 1;
    }

    if (filter === "Overdue") {
      matchesFilter = isOverdue(item);
    }

    return matchesSearch && matchesFilter;
  });

  // ------------------------------------------
  // STATISTICS
  // ------------------------------------------

  const totalCount = assignments.length;

  const pendingCount = assignments.filter(
    (item) => item.isCompleted === 0,
  ).length;

  const completedCount = assignments.filter(
    (item) => item.isCompleted === 1,
  ).length;

  const overdueCount = assignments.filter(isOverdue).length;

  // ------------------------------------------
  // PRIORITY COLORS
  // ------------------------------------------

  const getPriorityColor = (value: string) => {
    if (value === "High") return "#E74C3C";
    if (value === "Medium") return "#E6A23C";
    return "#27AE60";
  };

  // ------------------------------------------
  // SCREEN UI
  // ------------------------------------------

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>📚 Assignment Manager</Text>

        <Text style={styles.subtitle}>
          Organize your university assignments and deadlines.
        </Text>

        {/* STATISTICS */}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{overdueCount}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

        {/* ADD / EDIT FORM */}

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {editingId !== null ? "Edit Assignment" : "Add New Assignment"}
          </Text>

          <Text style={styles.label}>Assignment Title *</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter assignment title"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Subject *</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter subject name"
            placeholderTextColor="#999"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.label}>Description</Text>

          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Enter assignment details"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Due Date *</Text>

          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (Example: 2026-12-20)"
            placeholderTextColor="#999"
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Priority</Text>

          <View style={styles.priorityContainer}>
            {(["Low", "Medium", "High"] as Priority[]).map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.priorityButton,
                  priority === value && {
                    backgroundColor: getPriorityColor(value),
                    borderColor: getPriorityColor(value),
                  },
                ]}
                onPress={() => setPriority(value)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    priority === value && styles.selectedPriorityText,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {editingId !== null ? "Update Assignment" : "Save Assignment"}
            </Text>
          </TouchableOpacity>

          {editingId !== null && (
            <TouchableOpacity style={styles.cancelButton} onPress={clearForm}>
              <Text style={styles.cancelText}>Cancel Editing</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ASSIGNMENT LIST */}

        <Text style={styles.sectionTitle}>My Assignments</Text>

        {/* SEARCH */}

        <TextInput
          style={styles.input}
          placeholder="Search by title or subject..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />

        {/* FILTERS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {(["All", "Pending", "Completed", "Overdue"] as Filter[]).map(
            (value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.filterButton,
                  filter === value && styles.activeFilter,
                ]}
                onPress={() => setFilter(value)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === value && styles.activeFilterText,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>

        {/* EMPTY STATE */}

        {filteredAssignments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No assignments found</Text>

            <Text style={styles.emptyText}>
              Add an assignment using the form above.
            </Text>
          </View>
        ) : (
          filteredAssignments.map((item) => (
            <View style={styles.assignmentCard} key={item.id}>
              <View style={styles.cardHeader}>
                <Text style={styles.assignmentTitle}>{item.title}</Text>

                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor: getPriorityColor(item.priority),
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>{item.priority}</Text>
                </View>
              </View>

              <Text style={styles.subjectText}>Subject: {item.subject}</Text>

              {item.description ? (
                <Text style={styles.descriptionText}>{item.description}</Text>
              ) : null}

              <Text style={styles.dateText}>📅 Due Date: {item.dueDate}</Text>

              {isOverdue(item) && (
                <Text style={styles.overdueText}>⚠ Overdue</Text>
              )}

              {item.isCompleted === 1 && (
                <Text style={styles.completedText}>✓ Completed</Text>
              )}

              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleToggleComplete(item)}
                >
                  <Text style={styles.actionText}>
                    {item.isCompleted === 1 ? "Undo" : "Complete"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(item)}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },

  content: {
    padding: 18,
    paddingBottom: 45,
  },

  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#202B45",
    marginTop: 15,
  },

  subtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 7,
    marginBottom: 20,
  },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#3157A4",
  },

  statLabel: {
    color: "#777",
    marginTop: 5,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 17,
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#202B45",
    marginBottom: 13,
    marginTop: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    backgroundColor: "#F5F6F9",
    borderWidth: 1,
    borderColor: "#E1E4EA",
    borderRadius: 9,
    padding: 13,
    fontSize: 14,
    color: "#222",
  },

  descriptionInput: {
    minHeight: 85,
  },

  priorityContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
  },

  priorityButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 11,
    alignItems: "center",
  },

  priorityText: {
    fontWeight: "600",
    color: "#444",
  },

  selectedPriorityText: {
    color: "#FFFFFF",
  },

  saveButton: {
    backgroundColor: "#3157A4",
    padding: 15,
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

  cancelText: {
    color: "#555",
    fontWeight: "600",
  },

  filterContainer: {
    marginBottom: 15,
  },

  filterButton: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginRight: 8,
  },

  activeFilter: {
    backgroundColor: "#3157A4",
  },

  filterText: {
    color: "#555",
    fontWeight: "600",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
  },

  emptyText: {
    color: "#888",
    marginTop: 7,
    textAlign: "center",
  },

  assignmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 13,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  assignmentTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#202B45",
    flex: 1,
  },

  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },

  subjectText: {
    color: "#555",
    marginTop: 10,
  },

  descriptionText: {
    color: "#777",
    marginTop: 7,
    lineHeight: 20,
  },

  dateText: {
    color: "#3157A4",
    fontWeight: "600",
    marginTop: 10,
  },

  overdueText: {
    color: "#E74C3C",
    fontWeight: "bold",
    marginTop: 8,
  },

  completedText: {
    color: "#27AE60",
    fontWeight: "bold",
    marginTop: 8,
  },

  actionContainer: {
    flexDirection: "row",
    gap: 7,
    marginTop: 15,
  },

  completeButton: {
    flex: 1,
    backgroundColor: "#27AE60",
    padding: 10,
    borderRadius: 7,
    alignItems: "center",
  },

  editButton: {
    flex: 1,
    backgroundColor: "#E6A23C",
    padding: 10,
    borderRadius: 7,
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#E74C3C",
    padding: 10,
    borderRadius: 7,
    alignItems: "center",
  },

  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});
