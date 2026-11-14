import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  addImportantDate,
  getImportantDates,
  type ImportantDate,
} from "../database/database";

// Available event categories
const CATEGORIES = ["Birthday", "Anniversary", "Exam", "Academic", "Other"];

export default function DatesScreen() {
  const [events, setEvents] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Birthday");
  const [eventDate, setEventDate] = useState("");
  const [notificationDays, setNotificationDays] = useState("0");

  // LOAD EVENTS FROM SQLITE
  const loadEvents = () => {
    try {
      const savedEvents = getImportantDates();
      setEvents(savedEvents);
    } catch (error) {
      console.log("Load important dates error:", error);
      Alert.alert("Error", "Unable to load important dates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // VALIDATE DATE (YYYY-MM-DD)
  const isValidDate = (date: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (!match) {
      return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const parsedDate = new Date(year, month - 1, day);

    return (
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === month - 1 &&
      parsedDate.getDate() === day
    );
  };

  // CLEAR FORM
  const clearForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Birthday");
    setEventDate("");
    setNotificationDays("0");
  };

  // OPEN ADD EVENT FORM
  const openAddForm = () => {
    clearForm();
    setShowForm(true);
  };

  // SAVE IMPORTANT DATE
  const handleSaveEvent = () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanDate = eventDate.trim();

    if (!cleanTitle) {
      Alert.alert("Required", "Please enter an event title.");
      return;
    }

    if (!cleanDate) {
      Alert.alert("Required", "Please enter the event date.");
      return;
    }

    if (!isValidDate(cleanDate)) {
      Alert.alert(
        "Invalid Date",
        "Please enter a valid date using YYYY-MM-DD format.",
      );
      return;
    }

    const daysBefore = Number(notificationDays);

    if (!Number.isInteger(daysBefore) || daysBefore < 0 || daysBefore > 30) {
      Alert.alert(
        "Invalid Notification Days",
        "Enter a whole number between 0 and 30.",
      );
      return;
    }

    try {
      addImportantDate(
        cleanTitle,
        cleanDescription,
        category,
        cleanDate,
        daysBefore,
      );

      loadEvents();

      setShowForm(false);
      clearForm();

      Alert.alert(
        "Success",
        "Your important date has been saved successfully!",
      );
    } catch (error) {
      console.log("Save important date error:", error);
      Alert.alert("Error", "Unable to save the important date.");
    }
  };

  // EVENT CATEGORY ICON
  const getCategoryIcon = (eventCategory: string) => {
    switch (eventCategory) {
      case "Birthday":
        return "🎂";

      case "Anniversary":
        return "❤️";

      case "Exam":
        return "📝";

      case "Academic":
        return "🎓";

      default:
        return "📌";
    }
  };

  // DISPLAY EVENT CARD
  const renderEvent = ({ item }: { item: ImportantDate }) => {
    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventIcon}>
            <Text style={styles.eventIconText}>
              {getCategoryIcon(item.category)}
            </Text>
          </View>

          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventCategory}>{item.category}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.eventDescription}>{item.description}</Text>
        ) : null}

        <View style={styles.eventFooter}>
          <Text style={styles.eventDate}>📅 {item.eventDate}</Text>

          <Text style={styles.notificationInfo}>
            🔔{" "}
            {item.notificationDaysBefore === 0
              ? "No advance notification"
              : `${item.notificationDaysBefore} days before`}
          </Text>
        </View>
      </View>
    );
  };

  // MAIN SCREEN
  return (
    <View style={styles.container}>
      {!showForm ? (
        <>
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Important Dates</Text>

              <Text style={styles.subtitle}>
                Never forget important moments.
              </Text>
            </View>

            <View style={styles.countBox}>
              <Text style={styles.countNumber}>{events.length}</Text>

              <Text style={styles.countLabel}>Events</Text>
            </View>
          </View>

          {/* ADD EVENT BUTTON */}
          <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
            <Text style={styles.addButtonText}>+ Add Important Date</Text>
          </TouchableOpacity>

          {/* EVENT LIST */}
          <Text style={styles.sectionTitle}>Your Saved Events</Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#6C63FF"
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderEvent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📅</Text>

                  <Text style={styles.emptyTitle}>No Important Dates Yet</Text>

                  <Text style={styles.emptyDescription}>
                    Add birthdays, anniversaries, exams and other special
                    events.
                  </Text>
                </View>
              }
            />
          )}

          {/* ADD EVENT MODAL */}
        </>
      ) : null}

      {/* INLINE ADD FORM - NO MODAL */}
      {showForm ? (
        <KeyboardAvoidingView
          style={styles.formScreen}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.formScrollView}
            contentContainerStyle={styles.formScrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={styles.modalTitle}>Add Important Date</Text>

            {/* EVENT TITLE */}
            <Text style={styles.inputLabel}>Event Title *</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. Mother's Birthday"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              returnKeyType="next"
            />

            {/* DESCRIPTION */}
            <Text style={styles.inputLabel}>Description</Text>

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Enter event details..."
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
            />

            {/* CATEGORY */}
            <Text style={styles.inputLabel}>Event Category</Text>

            <View style={styles.categoryContainer}>
              {CATEGORIES.map((item) => (
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

            {/* EVENT DATE */}
            <Text style={styles.inputLabel}>Event Date *</Text>

            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (e.g. 2026-12-25)"
              value={eventDate}
              onChangeText={setEventDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            {/* NOTIFICATION DAYS */}
            <Text style={styles.inputLabel}>Notify Before (Days)</Text>

            <TextInput
              style={styles.input}
              placeholder="0 = No advance notification"
              value={notificationDays}
              onChangeText={setNotificationDays}
              keyboardType="number-pad"
              maxLength={2}
            />

            <Text style={styles.helperText}>
              Enter 0 to disable advance notification. You can select between 0
              and 30 days.
            </Text>

            {/* ACTION BUTTONS */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowForm(false);
                  clearForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEvent}
              >
                <Text style={styles.saveButtonText}>Save Event</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8FC",
    padding: 20,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#6C63FF",
  },

  subtitle: {
    color: "#777777",
    marginTop: 8,
    fontSize: 14,
  },

  countBox: {
    backgroundColor: "#EAE8FF",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },

  countNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6C63FF",
  },

  countLabel: {
    fontSize: 11,
    color: "#777777",
  },

  addButton: {
    backgroundColor: "#6C63FF",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 25,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15,
  },

  listContent: {
    paddingBottom: 30,
    flexGrow: 1,
  },

  eventCard: {
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 2,
  },

  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  eventIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#F0EFFF",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  eventIconText: {
    fontSize: 23,
  },

  eventInfo: {
    marginLeft: 12,
    flex: 1,
  },

  eventTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333333",
  },

  eventCategory: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
  },

  eventDescription: {
    fontSize: 14,
    color: "#666666",
    marginTop: 13,
    lineHeight: 21,
  },

  eventFooter: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  eventDate: {
    fontSize: 13,
    color: "#555555",
    marginBottom: 7,
  },

  notificationInfo: {
    fontSize: 12,
    color: "#6C63FF",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 65,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#444444",
  },

  emptyDescription: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },

  loader: {
    marginTop: 40,
  },

  // INLINE FORM STYLES
  formScreen: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
  },

  formScrollView: {
    flex: 1,
  },

  formScrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6C63FF",
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444444",
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#F5F5FA",
    borderWidth: 1,
    borderColor: "#E5E5EF",
    borderRadius: 11,
    padding: 13,
    fontSize: 14,
    color: "#333333",
  },

  descriptionInput: {
    height: 75,
    textAlignVertical: "top",
  },

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F0F0F5",
    borderWidth: 1,
    borderColor: "#E5E5EF",
  },

  selectedCategory: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  categoryText: {
    fontSize: 12,
    color: "#555555",
  },

  selectedCategoryText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  helperText: {
    fontSize: 11,
    color: "#888888",
    marginTop: 7,
    lineHeight: 16,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 25,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#EEEEF5",
    padding: 14,
    borderRadius: 11,
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#555555",
    fontWeight: "bold",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#6C63FF",
    padding: 14,
    borderRadius: 11,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
