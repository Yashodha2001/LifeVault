import { useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    AppState,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import * as Sharing from "expo-sharing";

import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";

import {
    addDocument,
    deleteDocumentRecord,
    getDocuments,
    initializeDocumentsDatabase,
    type VaultDocument,
} from "../database/documentsDatabase";

import { deleteFileFromVault, saveFileToVault } from "../utils/documentStorage";

import {
    createDocumentVaultPin,
    hasDocumentVaultPin,
    verifyDocumentVaultPin,
} from "../utils/documentVaultPin";

// ==================================================
// VIDEO PREVIEW
// ==================================================

function VideoPreview({ uri, onClose }: { uri: string; onClose: () => void }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.play();
  });

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.previewScreen}>
        <Text style={styles.previewTitle}>Video Preview</Text>

        <VideoView
          player={player}
          style={styles.video}
          nativeControls
          contentFit="contain"
        />

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ==================================================
// AUDIO PREVIEW
// ==================================================

function AudioPreview({
  uri,
  fileName,
  onClose,
}: {
  uri: string;
  fileName: string;
  onClose: () => void;
}) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.audioCard}>
          <Text style={styles.audioIcon}>🎵</Text>

          <Text style={styles.previewTitle}>Audio Player</Text>

          <Text style={styles.audioFileName}>{fileName}</Text>

          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            <Text style={styles.playButtonText}>
              {status.playing ? "⏸ Pause Audio" : "▶ Play Audio"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.audioStatus}>
            {status.playing ? "Playing..." : "Paused"}
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              player.pause();
              onClose();
            }}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ==================================================
// DOCUMENT VAULT SCREEN
// ==================================================

export default function DocumentsScreen() {
  // --------------------------------------------------
  // DOCUMENT STATES
  // --------------------------------------------------

  const [documents, setDocuments] = useState<VaultDocument[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<
    "Personal" | "Professional"
  >("Personal");

  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // --------------------------------------------------
  // PREVIEW STATES
  // --------------------------------------------------

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const [selectedAudio, setSelectedAudio] = useState<{
    uri: string;
    name: string;
  } | null>(null);

  // --------------------------------------------------
  // SECURITY STATES
  // --------------------------------------------------

  const [securityReady, setSecurityReady] = useState(false);

  const [pinConfigured, setPinConfigured] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [pinInput, setPinInput] = useState("");

  const [confirmPin, setConfirmPin] = useState("");

  const [authBusy, setAuthBusy] = useState(false);

  const [securityMessage, setSecurityMessage] = useState(
    "Create a PIN to protect your Document Vault.",
  );

  const authInProgress = useRef(false);

  const appIsActive = useRef(AppState.currentState === "active");

  // ==================================================
  // SCREENSHOT PROTECTION
  // ==================================================

  useEffect(() => {
    let isMounted = true;
    let protectionEnabled = false;

    async function enableScreenProtection() {
      try {
        const available = await ScreenCapture.isAvailableAsync();

        if (!available) {
          return;
        }

        await ScreenCapture.preventScreenCaptureAsync(
          "lifevault-document-vault",
        );

        protectionEnabled = true;

        if (!isMounted) {
          await ScreenCapture.allowScreenCaptureAsync(
            "lifevault-document-vault",
          );
        }
      } catch (error) {
        console.log("Screen protection error:", error);
      }
    }

    enableScreenProtection();

    return () => {
      isMounted = false;

      if (protectionEnabled) {
        ScreenCapture.allowScreenCaptureAsync("lifevault-document-vault").catch(
          (error) => {
            console.log("Screen protection release error:", error);
          },
        );
      }
    };
  }, []);

  // ==================================================
  // CHECK PIN CONFIGURATION
  // ==================================================

  useEffect(() => {
    let mounted = true;

    async function checkSecurity() {
      try {
        const exists = await hasDocumentVaultPin();

        if (mounted) {
          setPinConfigured(exists);
        }
      } catch (error) {
        console.log("Security initialization error:", error);

        Alert.alert(
          "Security Error",
          "Unable to check Document Vault security.",
        );
      } finally {
        if (mounted) {
          setSecurityReady(true);
        }
      }
    }

    checkSecurity();

    return () => {
      mounted = false;
    };
  }, []);

  // ==================================================
  // AUTOMATIC LOCK WHEN APP GOES INTO BACKGROUND
  // ==================================================

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      appIsActive.current = nextState === "active";

      if (
        (nextState === "background" || nextState === "inactive") &&
        !authInProgress.current
      ) {
        setIsAuthenticated(false);

        setDocuments([]);

        setSelectedImage(null);
        setSelectedVideo(null);
        setSelectedAudio(null);

        setPinInput("");
        setConfirmPin("");

        setLoading(true);

        setSecurityMessage("Your Document Vault is locked.");
      }
    });

    return () => subscription.remove();
  }, []);

  // ==================================================
  // LOAD DOCUMENTS
  // ==================================================

  const loadDocuments = () => {
    try {
      const data = getDocuments();

      setDocuments(data);
    } catch (error) {
      console.log("Load documents error:", error);

      Alert.alert("Error", "Unable to load saved files.");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // UNLOCK VAULT
  // ==================================================

  const unlockVault = () => {
    try {
      initializeDocumentsDatabase();

      setIsAuthenticated(true);

      setPinInput("");
      setConfirmPin("");

      setSecurityMessage("Authentication successful.");

      loadDocuments();
    } catch (error) {
      console.log("Vault unlock error:", error);

      Alert.alert("Error", "Unable to open Document Vault.");
    }
  };

  // ==================================================
  // CREATE FIRST PIN
  // ==================================================

  const handleCreatePin = async () => {
    if (!/^\d{4}$|^\d{6}$/.test(pinInput)) {
      Alert.alert("Invalid PIN", "Enter a 4-digit or 6-digit PIN.");

      return;
    }

    if (!/^\d{4}$|^\d{6}$/.test(confirmPin)) {
      Alert.alert(
        "Invalid Confirmation",
        "Confirm your PIN using 4 or 6 digits.",
      );

      return;
    }

    if (pinInput !== confirmPin) {
      Alert.alert("PIN Mismatch", "The PINs do not match.");

      return;
    }

    try {
      setAuthBusy(true);

      await createDocumentVaultPin(pinInput);

      setPinConfigured(true);

      Alert.alert(
        "Success",
        "Your Document Vault PIN was created successfully.",
      );

      unlockVault();
    } catch (error) {
      console.log("PIN creation error:", error);

      Alert.alert("Error", "Unable to create your PIN.");
    } finally {
      setAuthBusy(false);
    }
  };

  // ==================================================
  // UNLOCK USING PIN
  // ==================================================

  const handlePinUnlock = async () => {
    if (!pinInput) {
      Alert.alert("PIN Required", "Please enter your PIN.");

      return;
    }

    try {
      setAuthBusy(true);

      const valid = await verifyDocumentVaultPin(pinInput);

      if (valid) {
        unlockVault();
      } else {
        setPinInput("");

        Alert.alert(
          "Incorrect PIN",
          "The PIN you entered is incorrect. Please try again.",
        );
      }
    } catch (error) {
      console.log("PIN verification error:", error);

      Alert.alert("Error", "Unable to verify your PIN.");
    } finally {
      setAuthBusy(false);
    }
  };

  // ==================================================
  // UNLOCK USING FINGERPRINT / BIOMETRIC
  // ==================================================

  const handleBiometricUnlock = async () => {
    if (authBusy || authInProgress.current) {
      return;
    }

    try {
      setAuthBusy(true);

      authInProgress.current = true;

      const hardwareAvailable = await LocalAuthentication.hasHardwareAsync();

      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hardwareAvailable || !enrolled) {
        setSecurityMessage(
          "Biometric authentication is unavailable. Please use your PIN.",
        );

        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock LifeVault Document Vault",
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
      });

      if (!appIsActive.current) {
        return;
      }

      if (result.success) {
        unlockVault();
      } else {
        setSecurityMessage(
          "Fingerprint authentication was cancelled or unsuccessful. You can use your PIN.",
        );
      }
    } catch (error) {
      console.log("Biometric authentication error:", error);

      setSecurityMessage(
        "Fingerprint authentication failed. Please use your PIN.",
      );
    } finally {
      authInProgress.current = false;

      setAuthBusy(false);
    }
  };

  // ==================================================
  // SAVE SELECTED FILE
  // ==================================================

  const saveSelectedFile = async (
    file: {
      uri: string;
      name: string;
      mimeType?: string | null;
      size?: number | null;
    },
    fileType: string,
  ) => {
    if (uploading || !isAuthenticated) {
      return;
    }

    setUploading(true);

    try {
      console.log("Starting file save...");
      console.log("File name:", file.name);
      console.log("File URI:", file.uri);

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

      Alert.alert(
        "Upload Error",
        "Unable to save this file. Please check the file permissions and try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  // ==================================================
  // PICK DOCUMENTS AND AUDIO
  // ==================================================

  const pickDocument = async (fileType: "Document" | "Audio") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: fileType === "Audio" ? "audio/*" : "*/*",
        copyToCacheDirectory: false,
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

      Alert.alert("Picker Error", "Unable to select this file.");
    }
  };

  // ==================================================
  // PICK IMAGES AND VIDEOS
  // ==================================================

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

      const extension = file.mimeType?.split("/")[1] || "jpg";

      const fileName = file.fileName || `LifeVault_${Date.now()}.${extension}`;

      await saveSelectedFile(
        {
          uri: file.uri,
          name: fileName,
          mimeType: file.mimeType,
          size: file.fileSize,
        },
        fileType,
      );
    } catch (error) {
      console.log("Media picker error:", error);

      Alert.alert("Media Picker Error", "Unable to select media.");
    }
  };

  // ==================================================
  // OPEN SAVED FILE
  // ==================================================

  const openFile = async (item: VaultDocument) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      if (item.fileType === "Image") {
        setSelectedImage(item.fileUri);
        return;
      }

      if (item.fileType === "Video") {
        setSelectedVideo(item.fileUri);
        return;
      }

      if (item.fileType === "Audio") {
        setSelectedAudio({
          uri: item.fileUri,
          name: item.name,
        });

        return;
      }

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert(
          "Not Available",
          "Document sharing is not available on this device.",
        );

        return;
      }

      await Sharing.shareAsync(item.fileUri, {
        mimeType: item.mimeType,
        dialogTitle: `Open ${item.name}`,
      });
    } catch (error) {
      console.log("Open file error:", error);

      Alert.alert("Open Error", "Unable to open this file.");
    }
  };

  // ==================================================
  // DELETE FILE
  // ==================================================

  const confirmDelete = (item: VaultDocument) => {
    if (!isAuthenticated) {
      return;
    }

    Alert.alert(
      "Delete File",
      `Are you sure you want to delete ${item.name}?`,
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
              await deleteFileFromVault(item.fileUri);

              deleteDocumentRecord(item.id);

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

  // ==================================================
  // FILTER DOCUMENTS
  // ==================================================

  const filteredDocuments = documents.filter((item) => {
    const matchesCategory = item.category === selectedCategory;

    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchText.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // ==================================================
  // FORMAT FILE SIZE
  // ==================================================

  const formatSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ==================================================
  // FILE ICON
  // ==================================================

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

  // ==================================================
  // SECURITY SCREEN
  // ==================================================

  if (!securityReady) {
    return (
      <View style={styles.securityScreen}>
        <ActivityIndicator size="large" color="#7651C8" />

        <Text style={styles.securityText}>Checking vault security...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.securityScreen}>
        <View style={styles.securityCard}>
          <Text style={styles.securityIcon}>🔐</Text>

          <Text style={styles.securityTitle}>
            {pinConfigured
              ? "Unlock Document Vault"
              : "Create Document Vault PIN"}
          </Text>

          <Text style={styles.securityText}>
            {pinConfigured
              ? "Use your fingerprint or enter your PIN."
              : "Create a 4-digit or 6-digit PIN to protect your files."}
          </Text>

          {!pinConfigured && (
            <TextInput
              style={styles.pinInput}
              placeholder="Confirm PIN"
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
          )}

          <TextInput
            style={styles.pinInput}
            placeholder={pinConfigured ? "Enter your PIN" : "Create PIN"}
            value={pinInput}
            onChangeText={setPinInput}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />

          <TouchableOpacity
            style={styles.securityButton}
            disabled={authBusy}
            onPress={pinConfigured ? handlePinUnlock : handleCreatePin}
          >
            <Text style={styles.securityButtonText}>
              {authBusy
                ? "Please wait..."
                : pinConfigured
                  ? "Unlock with PIN"
                  : "Create PIN"}
            </Text>
          </TouchableOpacity>

          {pinConfigured && (
            <TouchableOpacity
              style={styles.secondaryButton}
              disabled={authBusy}
              onPress={handleBiometricUnlock}
            >
              <Text style={styles.secondaryButtonText}>
                👆 Unlock with Fingerprint
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.securityMessage}>{securityMessage}</Text>
        </View>
      </View>
    );
  }

  // ==================================================
  // MAIN DOCUMENT VAULT SCREEN
  // ==================================================

  return (
    <View style={styles.container}>
      <ScrollView
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
          disabled={uploading}
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

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickMedia}
          disabled={uploading}
        >
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
          disabled={uploading}
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

        {uploading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7651C8" />

            <Text style={styles.loadingText}>Saving file to LifeVault...</Text>
          </View>
        )}

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

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#7651C8"
            style={{ marginTop: 30 }}
          />
        ) : filteredDocuments.length === 0 ? (
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
              <TouchableOpacity
                style={styles.fileOpenArea}
                onPress={() => openFile(item)}
              >
                <Text style={styles.fileIcon}>
                  {getFileIcon(item.fileType)}
                </Text>

                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <Text style={styles.fileDetails}>
                    {item.fileType} • {formatSize(item.fileSize)}
                  </Text>

                  <Text style={styles.fileCategory}>{item.category}</Text>
                </View>
              </TouchableOpacity>

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

      {/* IMAGE PREVIEW */}

      <Modal
        visible={selectedImage !== null}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.previewScreen}>
          <Text style={styles.previewTitle}>Image Preview</Text>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* VIDEO PREVIEW */}

      {selectedVideo && (
        <VideoPreview
          uri={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {/* AUDIO PREVIEW */}

      {selectedAudio && (
        <AudioPreview
          uri={selectedAudio.uri}
          fileName={selectedAudio.name}
          onClose={() => setSelectedAudio(null)}
        />
      )}
    </View>
  );
}

// ==================================================
// STYLES
// ==================================================

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

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
    gap: 10,
  },

  loadingText: {
    color: "#7651C8",
    fontSize: 13,
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

  fileOpenArea: {
    flex: 1,
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

  previewScreen: {
    flex: 1,
    backgroundColor: "#171321",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  previewTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  previewImage: {
    width: "100%",
    flex: 1,
  },

  video: {
    width: "100%",
    height: 280,
    backgroundColor: "#000000",
  },

  closeButton: {
    backgroundColor: "#7651C8",
    paddingHorizontal: 35,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 20,
  },

  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  audioCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },

  audioIcon: {
    fontSize: 55,
    marginBottom: 15,
  },

  audioFileName: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginBottom: 20,
  },

  playButton: {
    backgroundColor: "#7651C8",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },

  playButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  audioStatus: {
    color: "#7651C8",
    marginTop: 15,
  },

  // SECURITY STYLES

  securityScreen: {
    flex: 1,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  securityCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 4,
  },

  securityIcon: {
    fontSize: 55,
    marginBottom: 15,
  },

  securityTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4B2995",
    textAlign: "center",
    marginBottom: 10,
  },

  securityText: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    marginBottom: 20,
  },

  pinInput: {
    width: "100%",
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#D8C9F5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    textAlign: "center",
    fontSize: 20,
    letterSpacing: 8,
  },

  securityButton: {
    width: "100%",
    backgroundColor: "#7651C8",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },

  securityButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  secondaryButton: {
    width: "100%",
    backgroundColor: "#E7DEFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  secondaryButtonText: {
    color: "#4B2995",
    fontWeight: "bold",
    fontSize: 15,
  },

  securityMessage: {
    fontSize: 12,
    color: "#777777",
    textAlign: "center",
    marginTop: 18,
  },
});
