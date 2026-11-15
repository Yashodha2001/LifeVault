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

import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import {
    addDocument,
    deleteDocumentRecord,
    getDocuments,
    initializeDocumentsDatabase,
    VaultDocument,
} from "../database/documentsDatabase";

import { deleteFileFromVault, saveFileToVault } from "../utils/documentStorage";

// --------------------------------------------------
// DOCUMENT VAULT SCREEN
// --------------------------------------------------

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<
    "Personal" | "Professional"
  >("Personal");

  const [searchText, setSearchText] = useState("");

  // --------------------------------------------------
  // LOAD DOCUMENTS
  // --------------------------------------------------

  const loadDocuments = () => {
    try {
      const data = getDocuments();
      setDocuments(data);
    } catch (error) {
      console.log("Load documents error:", error);
      Alert.alert("Error", "Unable to load saved files.");
    }
  };

  useEffect(() => {
    try {
      initializeDocumentsDatabase();
      loadDocuments();
    } catch (error) {
      console.log("Documents database error:", error);
      Alert.alert("Database Error", "Unable to initialize Document Vault.");
    }
  }, []);

  // --------------------------------------------------
  // SAVE SELECTED FILE
  // --------------------------------------------------

  const saveSelectedFile = async (
    file: {
      uri: string;
      name: string;
      mimeType?: string | null;
      size?: number | null;
    },
    fileType: string,
  ) => {
    try {
      const savedUri = await saveFileToVault(file);

      addDocument({
        name: file.name,
        originalName: file.name,
        fileUri: savedUri,
        fileType,
        mimeType: file.mimeType || "application/octet-stream",
        category: selectedCategory,
        fileSize: file.size || 0,
      });

      loadDocuments();

      Alert.alert("Success", `${file.name} saved successfully!`);
    } catch (error) {
      console.log("Save file error:", error);
      Alert.alert("Upload Error", "Unable to save this file.");
    }
  };

  // --------------------------------------------------
  // UPLOAD DOCUMENTS AND AUDIO
  // --------------------------------------------------

  const pickDocument = async (fileType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: fileType === "Audio" ? "audio/*" : "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];

      await saveSelectedFile(
        {
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
        },
        fileType,
      );
    } catch (error) {
      console.log("Document picker error:", error);
      Alert.alert("Error", "Unable to select this file.");
    }
  };

  // --------------------------------------------------
  // UPLOAD IMAGES AND VIDEOS
  // --------------------------------------------------

  const pickMedia = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photos and videos.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];

      const fileType = file.type === "video" ? "Video" : "Image";

      await saveSelectedFile(
        {
          uri: file.uri,
          name: file.fileName || `LifeVault_${Date.now()}`,
          mimeType: file.mimeType,
          size: file.fileSize,
        },
        fileType,
      );
    } catch (error) {
      console.log("Media picker error:", error);
      Alert.alert("Error", "Unable to select media.");
    }
  };

  // --------------------------------------------------
  // DELETE DOCUMENT
  // --------------------------------------------------

  const confirmDelete = (document: VaultDocument) => {
    Alert.alert(
      "Delete File",
      `Are you sure you want to delete ${document.name}?`,
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
              await deleteFileFromVault(document.fileUri);
              deleteDocumentRecord(document.id);
              loadDocuments();

              Alert.alert("Deleted", "File deleted successfully.");
            } catch (error) {
              console.log("Delete error:", error);
              Alert.alert("Error", "Unable to delete this file.");
            }
          },
        },
      ],
    );
  };

  // --------------------------------------------------
  // FILTER DOCUMENTS
  // --------------------------------------------------

  const filteredDocuments = documents.filter((item) => {
    const matchesCategory = item.category === selectedCategory;

    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchText.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // --------------------------------------------------
  // FORMAT FILE SIZE
  // --------------------------------------------------

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // --------------------------------------------------
  // FILE ICON
  // --------------------------------------------------

  const getFileIcon = (type: string) => {
    switch (type) {
      case "Image":
        return "🖼️";
      case "Video":
        return "🎬";
      case "Audio":
        return "🎵";
      default:
        return "📄";
    }
  };

  // --------------------------------------------------
  // SCREEN UI
  // --------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Document & Media Vault</Text>

      <Text style={styles.subtitle}>
        Securely organize your personal and professional files.
      </Text>

      {/* CATEGORY SELECTION */}

      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === "Personal" && styles.selectedCategory,
          ]}
          onPress={() => setSelectedCategory("Personal")}
        >
          <Text style={styles.categoryIcon}>👤</Text>
          <Text style={styles.categoryText}>Personal Vault</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === "Professional" && styles.selectedCategory,
          ]}
          onPress={() => setSelectedCategory("Professional")}
        >
          <Text style={styles.categoryIcon}>💼</Text>
          <Text style={styles.categoryText}>Professional Vault</Text>
        </TouchableOpacity>
      </View>

      {/* UPLOAD SECTION */}

      <Text style={styles.sectionTitle}>Add New Files</Text>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => pickDocument("Document")}
      >
        <Text style={styles.uploadIcon}>📄</Text>
        <View style={styles.uploadTextContainer}>
          <Text style={styles.uploadTitle}>Upload Documents</Text>
          <Text style={styles.uploadDescription}>
            PDF, DOCX, XLSX and other files
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.uploadButton} onPress={pickMedia}>
        <Text style={styles.uploadIcon}>🖼️</Text>
        <View style={styles.uploadTextContainer}>
          <Text style={styles.uploadTitle}>Images & Videos</Text>
          <Text style={styles.uploadDescription}>
            Select photos and videos from your phone
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => pickDocument("Audio")}
      >
        <Text style={styles.uploadIcon}>🎵</Text>
        <View style={styles.uploadTextContainer}>
          <Text style={styles.uploadTitle}>Upload Audio</Text>
          <Text style={styles.uploadDescription}>
            Select audio files from your phone
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* SAVED FILES */}

      <Text style={styles.sectionTitle}>
        {selectedCategory} Files ({filteredDocuments.length})
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search files..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {filteredDocuments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyTitle}>No files found</Text>
          <Text style={styles.emptyDescription}>
            Upload your first file to this vault.
          </Text>
        </View>
      ) : (
        filteredDocuments.map((item) => (
          <View key={item.id} style={styles.fileCard}>
            <Text style={styles.fileIcon}>{getFileIcon(item.fileType)}</Text>

            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {item.name}
              </Text>

              <Text style={styles.fileDetails}>
                {item.fileType} • {formatSize(item.fileSize)}
              </Text>

              <Text style={styles.fileCategory}>{item.category}</Text>
            </View>

            <TouchableOpacity
              onPress={() => confirmDelete(item)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F3FF",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  heading: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#4B2995",
    marginTop: 35,
  },

  subtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 8,
    marginBottom: 25,
  },

  categoryContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 25,
  },

  categoryButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5DDFB",
  },

  selectedCategory: {
    backgroundColor: "#E7DEFF",
    borderColor: "#7651C8",
    borderWidth: 2,
  },

  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },

  categoryText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4B2995",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#38236F",
    marginBottom: 15,
    marginTop: 5,
  },

  uploadButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  uploadIcon: {
    fontSize: 30,
    marginRight: 14,
  },

  uploadTextContainer: {
    flex: 1,
  },

  uploadTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#38236F",
  },

  uploadDescription: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },

  arrow: {
    fontSize: 28,
    color: "#7651C8",
  },

  searchInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    fontSize: 14,
  },

  fileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  fileIcon: {
    fontSize: 30,
    marginRight: 13,
  },

  fileInfo: {
    flex: 1,
  },

  fileName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#38236F",
  },

  fileDetails: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },

  fileCategory: {
    fontSize: 11,
    color: "#7651C8",
    marginTop: 4,
  },

  deleteButton: {
    padding: 8,
  },

  deleteText: {
    fontSize: 20,
  },

  emptyContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 15,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#38236F",
  },

  emptyDescription: {
    fontSize: 13,
    color: "#888",
    marginTop: 6,
    textAlign: "center",
  },
});
