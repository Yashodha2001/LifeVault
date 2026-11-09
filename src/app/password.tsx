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
  addPassword,
  deletePassword,
  getPassword,
  getPasswords,
  PasswordEntry,
  updatePassword,
} from "../database/database";

export default function PasswordScreen() {
  // -------------------- STATES --------------------

  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);

  const [website, setWebsite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [searchText, setSearchText] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [visiblePasswords, setVisiblePasswords] = useState<{
    [key: number]: string;
  }>({});

  const [showPassword, setShowPassword] = useState<{
    [key: number]: boolean;
  }>({});

  const [loading, setLoading] = useState(false);

  // -------------------- LOAD PASSWORDS --------------------

  useEffect(() => {
    loadPasswords();
  }, []);

  function loadPasswords() {
    try {
      const savedPasswords = getPasswords();
      setPasswords(savedPasswords);
    } catch (error) {
      console.log("Load passwords error:", error);
      Alert.alert("Error", "Unable to load saved passwords.");
    }
  }

  // -------------------- CLEAR FORM --------------------

  function clearForm() {
    setWebsite("");
    setUsername("");
    setPassword("");
    setEditingId(null);
  }

  // -------------------- SAVE PASSWORD --------------------

  async function handleSavePassword() {
    if (!website.trim() || !username.trim() || !password) {
      Alert.alert(
        "Missing Information",
        "Please enter the website, username and password.",
      );
      return;
    }

    try {
      setLoading(true);

      if (editingId !== null) {
        await updatePassword(
          editingId,
          website.trim(),
          username.trim(),
          password,
        );

        Alert.alert("Success", "Password updated successfully!");
      } else {
        await addPassword(website.trim(), username.trim(), password);

        Alert.alert("Success", "Password saved securely!");
      }

      clearForm();
      loadPasswords();
    } catch (error) {
      console.log("Save password error:", error);

      Alert.alert("Error", "Unable to save the password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // -------------------- EDIT PASSWORD --------------------

  async function handleEditPassword(item: PasswordEntry) {
    try {
      const savedPassword = await getPassword(item.id);

      if (savedPassword === null) {
        Alert.alert(
          "Password Not Found",
          "The securely stored password could not be retrieved.",
        );
        return;
      }

      setEditingId(item.id);
      setWebsite(item.website);
      setUsername(item.username);
      setPassword(savedPassword);
    } catch (error) {
      console.log("Edit password error:", error);

      Alert.alert("Error", "Unable to retrieve this password.");
    }
  }

  // -------------------- SHOW / HIDE PASSWORD --------------------

  async function togglePasswordVisibility(id: number) {
    const currentlyVisible = showPassword[id] === true;

    if (currentlyVisible) {
      setShowPassword((previous) => ({
        ...previous,
        [id]: false,
      }));
      return;
    }

    try {
      const savedPassword = await getPassword(id);

      if (savedPassword === null) {
        Alert.alert("Error", "Password not found in secure storage.");
        return;
      }

      setVisiblePasswords((previous) => ({
        ...previous,
        [id]: savedPassword,
      }));

      setShowPassword((previous) => ({
        ...previous,
        [id]: true,
      }));
    } catch (error) {
      console.log("Password retrieval error:", error);

      Alert.alert("Error", "Unable to display this password.");
    }
  }

  // -------------------- DELETE PASSWORD --------------------

  function confirmDelete(id: number) {
    Alert.alert(
      "Delete Password",
      "Are you sure you want to delete this saved password?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeletePassword(id),
        },
      ],
    );
  }

  async function handleDeletePassword(id: number) {
    try {
      await deletePassword(id);

      setVisiblePasswords((previous) => {
        const updated = { ...previous };
        delete updated[id];
        return updated;
      });

      setShowPassword((previous) => {
        const updated = { ...previous };
        delete updated[id];
        return updated;
      });

      if (editingId === id) {
        clearForm();
      }

      loadPasswords();

      Alert.alert("Success", "Password deleted successfully!");
    } catch (error) {
      console.log("Delete password error:", error);

      Alert.alert("Error", "Unable to delete this password.");
    }
  }

  // -------------------- SEARCH PASSWORDS --------------------

  const filteredPasswords = passwords.filter((item) => {
    const search = searchText.toLowerCase();

    return (
      item.website.toLowerCase().includes(search) ||
      item.username.toLowerCase().includes(search)
    );
  });

  // ==================================================
  //                       UI
  // ==================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <Text style={styles.title}>🔐 Password Vault</Text>

        <Text style={styles.subtitle}>
          Manage your saved passwords securely.
        </Text>

        {/* PASSWORD FORM */}

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingId !== null ? "Edit Password" : "Add New Password"}
          </Text>

          <Text style={styles.label}>Website / Application</Text>

          <TextInput
            style={styles.input}
            placeholder="Example: Google"
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Username / Email</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter username or email"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSavePassword}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading
                ? "Please wait..."
                : editingId !== null
                  ? "Update Password"
                  : "Save Password"}
            </Text>
          </TouchableOpacity>

          {editingId !== null && (
            <TouchableOpacity style={styles.cancelButton} onPress={clearForm}>
              <Text style={styles.cancelButtonText}>Cancel Editing</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SAVED PASSWORDS */}

        <Text style={styles.sectionTitle}>
          Saved Passwords ({passwords.length})
        </Text>

        {/* SEARCH */}

        <TextInput
          style={styles.searchInput}
          placeholder="Search website or username..."
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />

        {/* PASSWORD LIST */}

        {filteredPasswords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {passwords.length === 0
                ? "No passwords saved yet."
                : "No matching passwords found."}
            </Text>
          </View>
        ) : (
          filteredPasswords.map((item) => (
            <View key={item.id} style={styles.passwordCard}>
              <Text style={styles.websiteText}>🌐 {item.website}</Text>

              <Text style={styles.detailText}>Username: {item.username}</Text>

              <Text style={styles.detailText}>
                Password:{" "}
                {showPassword[item.id]
                  ? (visiblePasswords[item.id] ?? "")
                  : "••••••••"}
              </Text>

              {/* SHOW / HIDE */}

              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => togglePasswordVisibility(item.id)}
              >
                <Text style={styles.viewButtonText}>
                  {showPassword[item.id] ? "Hide Password" : "Show Password"}
                </Text>
              </TouchableOpacity>

              {/* EDIT AND DELETE */}

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditPassword(item)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => confirmDelete(item.id)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
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
//                       STYLES
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5FA",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6C63FF",
    textAlign: "center",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 25,
  },

  formContainer: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 15,
    elevation: 3,
    marginBottom: 25,
  },

  formTitle: {
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
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
  },

  saveButton: {
    backgroundColor: "#6C63FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  cancelButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 5,
  },

  cancelButtonText: {
    color: "#666666",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 15,
  },

  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 13,
    marginBottom: 15,
    fontSize: 14,
  },

  passwordCard: {
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 13,
    marginBottom: 15,
    elevation: 2,
  },

  websiteText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6C63FF",
    marginBottom: 12,
  },

  detailText: {
    fontSize: 14,
    color: "#555555",
    marginBottom: 10,
  },

  viewButton: {
    backgroundColor: "#EEEEFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },

  viewButtonText: {
    color: "#6C63FF",
    fontWeight: "bold",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  editButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#E53935",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
  },

  emptyText: {
    color: "#888888",
    fontSize: 14,
  },
});
