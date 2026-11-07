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
  addNote,
  deleteNote,
  getNotes,
  toggleFavorite,
  updateNote,
} from "../database/database";

import type { Note } from "../database/database";

export default function NotesScreen() {
  // Store notes retrieved from SQLite
  const [notes, setNotes] = useState<Note[]>([]);

  // Store user input
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Store selected category
  const [category, setCategory] = useState("Personal");

  // Store the ID of the note being edited
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // Load notes when the screen opens
  // Database initialization is handled by the root layout
  useEffect(() => {
    loadNotes();
  }, []);

  // READ: Load notes from SQLite
  function loadNotes() {
    try {
      const savedNotes = getNotes();

      console.log("Notes loaded from SQLite:", savedNotes);

      setNotes(savedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      Alert.alert("Error", "Unable to load notes.");
    }
  }

  // CREATE: Save a new note
  function handleAddNote() {
    if (title.trim() === "" || content.trim() === "") {
      Alert.alert("Missing information", "Please enter a title and note.");
      return;
    }

    try {
      addNote(title.trim(), content.trim(), category);

      console.log("New note saved successfully!");

      setTitle("");
      setContent("");
      setCategory("Personal");

      loadNotes();

      Alert.alert("Success", "Your note has been saved!");
    } catch (error) {
      console.error("Error saving note:", error);
      Alert.alert("Error", "Unable to save your note.");
    }
  }

  // Load an existing note into the form
  function handleEditNote(note: Note) {
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || "Personal");
    setEditingNoteId(note.id);

    console.log("Editing note ID:", note.id);
  }

  // UPDATE: Save changes to an existing note
  function handleUpdateNote() {
    if (title.trim() === "" || content.trim() === "") {
      Alert.alert("Missing information", "Please enter a title and note.");
      return;
    }

    if (editingNoteId === null) {
      return;
    }

    try {
      console.log("Updating note ID:", editingNoteId);

      const result = updateNote(
        editingNoteId,
        title.trim(),
        content.trim(),
        category,
      );

      console.log("Note update completed:", result);

      setTitle("");
      setContent("");
      setCategory("Personal");
      setEditingNoteId(null);

      loadNotes();

      Alert.alert("Success", "Your note has been updated!");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Unable to update your note.");
    }
  }

  // Cancel editing
  function handleCancelEdit() {
    setTitle("");
    setContent("");
    setCategory("Personal");
    setEditingNoteId(null);
  }

  // FAVOURITE: Toggle favourite status
  function handleToggleFavorite(note: Note) {
    try {
      const newStatus = note.isFavorite === 1 ? 0 : 1;

      console.log("Changing favourite status:", note.id, newStatus);

      const result = toggleFavorite(note.id, newStatus);

      console.log("Favourite update completed:", result);

      loadNotes();
    } catch (error) {
      console.error("Favourite error:", error);
      Alert.alert("Error", "Unable to update favourite status.");
    }
  }

  // DELETE: Delete a saved note
  function handleDeleteNote(id: number) {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          try {
            deleteNote(id);

            console.log("Note deleted:", id);

            if (editingNoteId === id) {
              handleCancelEdit();
            }

            loadNotes();
          } catch (error) {
            console.error("Delete error:", error);
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

      {/* Add or Edit note form */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>
          {editingNoteId !== null ? "Edit Note" : "Add a New Note"}
        </Text>

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

        {/* Save or Update button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={editingNoteId !== null ? handleUpdateNote : handleAddNote}
        >
          <Text style={styles.saveButtonText}>
            {editingNoteId !== null ? "Update Note" : "+ Save Note"}
          </Text>
        </TouchableOpacity>

        {/* Cancel editing button */}
        {editingNoteId !== null && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelEdit}
          >
            <Text style={styles.cancelButtonText}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
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
            {/* Note title and category */}
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>{note.title}</Text>

              <Text style={styles.noteCategory}>{note.category}</Text>
            </View>

            {/* Note content */}
            <Text style={styles.noteContent}>{note.content}</Text>

            {/* Favourite, Edit and Delete buttons */}
            <View style={styles.actionContainer}>
              {/* Favourite button */}
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleToggleFavorite(note)}
              >
                <Text style={styles.favoriteButtonText}>
                  {note.isFavorite === 1 ? "★ Favourited" : "☆ Favourite"}
                </Text>
              </TouchableOpacity>

              {/* Edit button */}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditNote(note)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              {/* Delete button */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteNote(note.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
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

  cancelButton: {
    backgroundColor: "#E5E5E5",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  cancelButtonText: {
    color: "#444444",
    fontWeight: "600",
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

  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 15,
  },

  favoriteButton: {
    backgroundColor: "#FFF4D6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  favoriteButtonText: {
    color: "#B8860B",
    fontWeight: "600",
  },

  editButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  editButtonText: {
    color: "#6C63FF",
    fontWeight: "600",
  },

  deleteButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 8,
  },

  deleteButtonText: {
    color: "#D9534F",
    fontWeight: "600",
  },
});
