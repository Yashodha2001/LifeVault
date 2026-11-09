import { useEffect, useMemo, useState } from "react";

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

type CategoryFilter = "All" | "Personal" | "Study" | "Memory";
type SortOrder = "Newest" | "Oldest";

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);

  // Note form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Personal");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // Search and filter states
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>("All");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("Newest");

  // Load notes when the screen opens
  useEffect(() => {
    loadNotes();
  }, []);

  // READ: Load notes from SQLite
  function loadNotes() {
    try {
      const savedNotes = getNotes();
      setNotes(savedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      Alert.alert("Error", "Unable to load notes.");
    }
  }

  // CREATE: Add a new note
  function handleAddNote() {
    if (title.trim() === "" || content.trim() === "") {
      Alert.alert("Missing information", "Please enter a title and note.");
      return;
    }

    try {
      addNote(title.trim(), content.trim(), category);

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
      updateNote(editingNoteId, title.trim(), content.trim(), category);

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

      toggleFavorite(note.id, newStatus);

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

  // SEARCH, FILTER AND SORT NOTES
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Search by title or content
    const search = searchText.trim().toLowerCase();

    if (search !== "") {
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(search) ||
          note.content.toLowerCase().includes(search),
      );
    }

    // Filter by category
    if (selectedFilter !== "All") {
      result = result.filter((note) => note.category === selectedFilter);
    }

    // Show only favourite notes
    if (showFavoritesOnly) {
      result = result.filter((note) => note.isFavorite === 1);
    }

    // Sort notes by creation date
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (isNaN(dateA) || isNaN(dateB)) {
        return 0;
      }

      return sortOrder === "Newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [notes, searchText, selectedFilter, showFavoritesOnly, sortOrder]);

  // Clear all search and filter selections
  function clearFilters() {
    setSearchText("");
    setSelectedFilter("All");
    setShowFavoritesOnly(false);
    setSortOrder("Newest");
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

        <TouchableOpacity
          style={styles.saveButton}
          onPress={editingNoteId !== null ? handleUpdateNote : handleAddNote}
        >
          <Text style={styles.saveButtonText}>
            {editingNoteId !== null ? "Update Note" : "+ Save Note"}
          </Text>
        </TouchableOpacity>

        {editingNoteId !== null && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelEdit}
          >
            <Text style={styles.cancelButtonText}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SEARCH SECTION */}
      <Text style={styles.sectionTitle}>Find Your Notes</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Search by title or content..."
        value={searchText}
        onChangeText={setSearchText}
        autoCapitalize="none"
      />

      {/* CATEGORY FILTER */}
      <Text style={styles.label}>Filter by Category</Text>

      <View style={styles.filterContainer}>
        {(["All", "Personal", "Study", "Memory"] as CategoryFilter[]).map(
          (item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterButton,
                selectedFilter === item && styles.selectedFilter,
              ]}
              onPress={() => setSelectedFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item && styles.selectedFilterText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      {/* FAVOURITE FILTER */}
      <TouchableOpacity
        style={[
          styles.favoriteFilterButton,
          showFavoritesOnly && styles.favoriteFilterActive,
        ]}
        onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
      >
        <Text
          style={[
            styles.favoriteFilterText,
            showFavoritesOnly && styles.favoriteFilterActiveText,
          ]}
        >
          {showFavoritesOnly
            ? "★ Showing Favourite Notes"
            : "☆ Show Favourite Notes"}
        </Text>
      </TouchableOpacity>

      {/* SORTING */}
      <View style={styles.sortHeader}>
        <Text style={styles.label}>Sort Notes</Text>

        <View style={styles.sortContainer}>
          {(["Newest", "Oldest"] as SortOrder[]).map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.sortButton,
                sortOrder === item && styles.selectedSort,
              ]}
              onPress={() => setSortOrder(item)}
            >
              <Text
                style={[
                  styles.sortText,
                  sortOrder === item && styles.selectedSortText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SAVED NOTES */}
      <View style={styles.savedHeader}>
        <Text style={styles.sectionTitle}>
          My Saved Notes ({filteredNotes.length})
        </Text>

        <TouchableOpacity onPress={clearFilters}>
          <Text style={styles.clearText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>

      {filteredNotes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {notes.length === 0
              ? "No notes yet. Add your first note!"
              : "No matching notes found."}
          </Text>
        </View>
      ) : (
        filteredNotes.map((note) => (
          <View style={styles.noteCard} key={note.id}>
            {/* Note title and category */}
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>
                {note.isFavorite === 1 ? "★ " : ""}
                {note.title}
              </Text>

              <Text style={styles.noteCategory}>
                {note.category || "Personal"}
              </Text>
            </View>

            {/* Note content */}
            <Text style={styles.noteContent}>{note.content}</Text>

            {/* Note creation date */}
            <Text style={styles.noteDate}>
              {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
            </Text>

            {/* Favourite, Edit and Delete buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleToggleFavorite(note)}
              >
                <Text style={styles.favoriteButtonText}>
                  {note.isFavorite === 1 ? "★ Favourited" : "☆ Favourite"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditNote(note)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

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

  searchInput: {
    backgroundColor: "#F8F9FC",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
  },

  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },

  filterButton: {
    backgroundColor: "#F0EFFF",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  selectedFilter: {
    backgroundColor: "#6C63FF",
  },

  filterText: {
    color: "#6C63FF",
    fontWeight: "600",
  },

  selectedFilterText: {
    color: "#FFFFFF",
  },

  favoriteFilterButton: {
    backgroundColor: "#FFF4D6",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },

  favoriteFilterActive: {
    backgroundColor: "#E6B94A",
  },

  favoriteFilterText: {
    color: "#9A6B00",
    fontWeight: "600",
  },

  favoriteFilterActiveText: {
    color: "#FFFFFF",
  },

  sortHeader: {
    marginBottom: 15,
  },

  sortContainer: {
    flexDirection: "row",
    gap: 10,
  },

  sortButton: {
    backgroundColor: "#F0EFFF",
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
  },

  selectedSort: {
    backgroundColor: "#6C63FF",
  },

  sortText: {
    color: "#6C63FF",
    fontWeight: "600",
  },

  selectedSortText: {
    color: "#FFFFFF",
  },

  savedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },

  clearText: {
    color: "#6C63FF",
    fontWeight: "600",
    marginBottom: 15,
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

  noteDate: {
    color: "#888888",
    fontSize: 11,
    marginTop: 10,
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
