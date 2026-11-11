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
  addMedicine,
  deleteMedicine,
  getMedicines,
  toggleMedicineStatus,
  updateMedicine,
  type Medicine,
} from "../database/database";

export default function MedicineScreen() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [frequency, setFrequency] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadMedicines();
  }, []);

  // Load medicines from SQLite
  const loadMedicines = () => {
    try {
      const data = getMedicines();
      setMedicines(data);
    } catch (error) {
      console.log("Load medicine error:", error);
      Alert.alert("Error", "Unable to load medicines.");
    }
  };

  // Clear form
  const clearForm = () => {
    setName("");
    setDosage("");
    setInstructions("");
    setFrequency("");
    setReminderTime("");
    setStartDate("");
    setEndDate("");
    setEditingId(null);
  };

  // Save or update medicine
  const handleSaveMedicine = () => {
    if (
      !name.trim() ||
      !dosage.trim() ||
      !frequency.trim() ||
      !reminderTime.trim() ||
      !startDate.trim()
    ) {
      Alert.alert(
        "Missing Information",
        "Please enter medicine name, dosage, frequency, reminder time and start date.",
      );
      return;
    }

    // Validate time format (HH:MM)
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!timePattern.test(reminderTime.trim())) {
      Alert.alert(
        "Invalid Time",
        "Please enter time in HH:MM format. Example: 08:30",
      );
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(startDate.trim())) {
      Alert.alert(
        "Invalid Start Date",
        "Please enter date in YYYY-MM-DD format.",
      );
      return;
    }

    if (endDate.trim() && !datePattern.test(endDate.trim())) {
      Alert.alert(
        "Invalid End Date",
        "Please enter date in YYYY-MM-DD format.",
      );
      return;
    }

    if (endDate.trim() && endDate.trim() < startDate.trim()) {
      Alert.alert(
        "Invalid Date Range",
        "End date cannot be before start date.",
      );
      return;
    }

    try {
      if (editingId !== null) {
        updateMedicine(
          editingId,
          name.trim(),
          dosage.trim(),
          instructions.trim(),
          frequency.trim(),
          reminderTime.trim(),
          startDate.trim(),
          endDate.trim(),
        );

        Alert.alert("Success", "Medicine updated successfully!");
      } else {
        addMedicine(
          name.trim(),
          dosage.trim(),
          instructions.trim(),
          frequency.trim(),
          reminderTime.trim(),
          startDate.trim(),
          endDate.trim(),
        );

        Alert.alert("Success", "Medicine added successfully!");
      }

      clearForm();
      loadMedicines();
    } catch (error) {
      console.log("Save medicine error:", error);
      Alert.alert("Error", "Unable to save medicine.");
    }
  };

  // Edit medicine
  const handleEditMedicine = (medicine: Medicine) => {
    setEditingId(medicine.id);
    setName(medicine.name);
    setDosage(medicine.dosage);
    setInstructions(medicine.instructions);
    setFrequency(medicine.frequency);
    setReminderTime(medicine.reminderTime);
    setStartDate(medicine.startDate);
    setEndDate(medicine.endDate || "");

    Alert.alert(
      "Edit Medicine",
      "Medicine details loaded. Update the fields and press Update Medicine.",
    );
  };

  // Delete medicine
  const handleDeleteMedicine = (id: number) => {
    Alert.alert(
      "Delete Medicine",
      "Are you sure you want to delete this medicine?",
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
              deleteMedicine(id);
              loadMedicines();

              if (editingId === id) {
                clearForm();
              }

              Alert.alert("Success", "Medicine deleted successfully!");
            } catch (error) {
              console.log("Delete medicine error:", error);
              Alert.alert("Error", "Unable to delete medicine.");
            }
          },
        },
      ],
    );
  };

  // Activate or deactivate medicine
  const handleToggleStatus = (medicine: Medicine) => {
    try {
      toggleMedicineStatus(medicine.id, medicine.isActive === 1 ? 0 : 1);

      loadMedicines();
    } catch (error) {
      console.log("Medicine status error:", error);
      Alert.alert("Error", "Unable to update medicine status.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Medicine Manager</Text>

        <Text style={styles.subtitle}>Manage your medicine schedules.</Text>

        {/* MEDICINE FORM */}

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>
            {editingId !== null ? "Edit Medicine" : "Add New Medicine"}
          </Text>

          <Text style={styles.label}>Medicine Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter medicine name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Dosage *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter prescribed dosage"
            value={dosage}
            onChangeText={setDosage}
          />

          <Text style={styles.label}>Instructions</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter doctor's or pharmacist's instructions"
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />

          <Text style={styles.label}>Frequency *</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Once daily"
            value={frequency}
            onChangeText={setFrequency}
          />

          <Text style={styles.label}>Reminder Time *</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM (Example: 08:30)"
            value={reminderTime}
            onChangeText={setReminderTime}
          />

          <Text style={styles.label}>Start Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={startDate}
            onChangeText={setStartDate}
          />

          <Text style={styles.label}>End Date (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={endDate}
            onChangeText={setEndDate}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveMedicine}
          >
            <Text style={styles.saveButtonText}>
              {editingId !== null ? "Update Medicine" : "Save Medicine"}
            </Text>
          </TouchableOpacity>

          {editingId !== null && (
            <TouchableOpacity style={styles.cancelButton} onPress={clearForm}>
              <Text style={styles.cancelButtonText}>Cancel Editing</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SAVED MEDICINES */}

        <Text style={styles.listTitle}>My Medicines ({medicines.length})</Text>

        {medicines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No medicines added yet.</Text>
          </View>
        ) : (
          medicines.map((medicine) => (
            <View key={medicine.id} style={styles.medicineCard}>
              <Text style={styles.medicineName}>{medicine.name}</Text>

              <Text style={styles.detail}>Dosage: {medicine.dosage}</Text>

              <Text style={styles.detail}>Frequency: {medicine.frequency}</Text>

              <Text style={styles.detail}>
                Reminder: {medicine.reminderTime}
              </Text>

              <Text style={styles.detail}>
                Start Date: {medicine.startDate}
              </Text>

              <Text style={styles.detail}>
                End Date: {medicine.endDate || "Not specified"}
              </Text>

              {medicine.instructions ? (
                <Text style={styles.detail}>
                  Instructions: {medicine.instructions}
                </Text>
              ) : null}

              <Text
                style={[
                  styles.status,
                  medicine.isActive === 1
                    ? styles.activeStatus
                    : styles.inactiveStatus,
                ]}
              >
                {medicine.isActive === 1 ? "Active" : "Inactive"}
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditMedicine(medicine)}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => handleToggleStatus(medicine)}
                >
                  <Text style={styles.buttonText}>
                    {medicine.isActive === 1 ? "Deactivate" : "Activate"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteMedicine(medicine.id)}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#6C63FF",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#777777",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 25,
  },

  form: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 15,
    elevation: 3,
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444444",
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 9,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
    color: "#333333",
  },

  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  saveButton: {
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  cancelButton: {
    backgroundColor: "#777777",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  listTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15,
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
  },

  emptyText: {
    color: "#888888",
    fontSize: 15,
  },

  medicineCard: {
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 13,
    marginBottom: 15,
    elevation: 2,
  },

  medicineName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#6C63FF",
    marginBottom: 10,
  },

  detail: {
    fontSize: 14,
    color: "#555555",
    marginBottom: 6,
  },

  status: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 12,
  },

  activeStatus: {
    color: "#219653",
  },

  inactiveStatus: {
    color: "#E67E22",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
  },

  editButton: {
    backgroundColor: "#3498DB",
    padding: 10,
    borderRadius: 7,
    flex: 1,
    alignItems: "center",
  },

  statusButton: {
    backgroundColor: "#8E44AD",
    padding: 10,
    borderRadius: 7,
    flex: 1,
    alignItems: "center",
  },

  deleteButton: {
    backgroundColor: "#E74C3C",
    padding: 10,
    borderRadius: 7,
    flex: 1,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
});
