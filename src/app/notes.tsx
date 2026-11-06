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

import { addNote, deleteNote, getNotes, Note } from "../database/database";

export default function NotesScreen() {
  // Store notes retrieved from SQLite
  const [notes, setNotes] = useState<Note[]>([]);

  // Store user input
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Store selected category
  const [category, setCategory] = useState("Personal");

  // Load notes when the screen opens
  useEffect(() => {
    loadNotes();
  }, []);

  // Read notes from SQLite
  function loadNotes() {
    try {
      const savedNotes = getNotes();
      setNotes(savedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      Alert.alert("Error", "Unable to load notes.");
    }
  }

  // Save a new note
  function handleAddNote() {
    if (title.trim() === "" || content.trim() === "") {
      Alert.alert("Missing information", "Please enter a title and note.");
      return;
    }

    try {
      addNote(title.trim(), content.trim(), category);

      // Clear input fields
      setTitle("");
      setContent("");

      // Refresh the notes list
      loadNotes();

      Alert.alert("Success", "Your note has been saved!");
    } catch (error) {
      console.error("Error saving note:", error);
      Alert.alert("Error", "Unable to save your note.");
    }
  }

  // Delete a saved note
  function handleDeleteNote(id: number) {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          try {
            deleteNote(id);
            loadNotes();
          } catch (error) {
            console.error("Error deleting note:", error);
            Alert.alert("Error", "Unable to delete note.");
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Screen heading */}
      <Text style={styles.title}>Notes & Memories</Text>

      <Text style={styles.subtitle}>
        Keep your thoughts and memories in one place.
      </Text>

      {/* Add note form */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Add a New Note</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter note title"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your note here..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Choose Category</Text>

        <View style={styles.categoryContainer}>
          {["Personal", "Study", "Memory"].map((item) => (
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

        <TouchableOpacity style={styles.saveButton} onPress={handleAddNote}>
          <Text style={styles.saveButtonText}>+ Save Note</Text>
        </TouchableOpacity>
      </View>

      {/* Display saved notes */}
      <Text style={styles.sectionTitle}>My Saved Notes ({notes.length})</Text>

      {notes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No notes yet. Add your first note!
          </Text>
        </View>
      ) : (
        notes.map((note) => (
          <View style={styles.noteCard} key={note.id}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>{note.title}</Text>

              <Text style={styles.noteCategory}>{note.category}</Text>
            </View>

            <Text style={styles.noteContent}>{note.content}</Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteNote(note.id)}
            >
              <Text style={styles.deleteButtonText}>Delete Note</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// Screen styles
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
    backgroundColor: "#F8F9FC",
    padding: 18,
    borderRadius: 15,
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#20243A",
    marginBottom: 15,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 13,
    marginBottom: 12,
    fontSize: 15,
  },

  textArea: {
    height: 110,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    color: "#20243A",
  },

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
    gap: 8,
  },

  categoryButton: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#EAF0FF",
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
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  emptyCard: {
    backgroundColor: "#F8F9FC",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },

  emptyText: {
    color: "#777777",
  },

  noteCard: {
    backgroundColor: "#F0EFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
  },

  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 8,
  },

  noteTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#20243A",
    flexShrink: 1,
  },

  noteCategory: {
    color: "#6C63FF",
    fontSize: 12,
    fontWeight: "bold",
  },

  noteContent: {
    color: "#555555",
    fontSize: 14,
    lineHeight: 21,
  },

  deleteButton: {
    alignSelf: "flex-end",
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 13,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },

  deleteButtonText: {
    color: "#D9534F",
    fontWeight: "600",
  },
});
