import { Directory, File, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";

// LifeVault private storage folder
const VAULT_DIRECTORY = new Directory(Paths.document, "lifevault-vault");

export type SelectedVaultFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

// Create storage folder if it does not exist
export const initializeVaultStorage = async (): Promise<void> => {
  try {
    if (!VAULT_DIRECTORY.exists) {
      VAULT_DIRECTORY.create({
        intermediates: true,
        idempotent: true,
      });
    }

    console.log("LifeVault storage initialized:", VAULT_DIRECTORY.uri);
  } catch (error) {
    console.log("Storage initialization error:", error);
    throw new Error("Unable to initialize LifeVault file storage.");
  }
};

// Copy selected file into LifeVault
export const saveFileToVault = async (
  file: SelectedVaultFile,
): Promise<string> => {
  try {
    await initializeVaultStorage();

    if (!file.uri) {
      throw new Error("Selected file URI is missing.");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}_${safeName}`;

    const destinationFile = new File(VAULT_DIRECTORY, uniqueName);

    console.log("Starting file copy...");
    console.log("Source URI:", file.uri);
    console.log("Destination URI:", destinationFile.uri);

    // Use the legacy copy operation for the selected Android URI
    await FileSystem.copyAsync({
      from: file.uri,
      to: destinationFile.uri,
    });

    if (!destinationFile.exists) {
      throw new Error("Copied file could not be verified.");
    }

    console.log("File saved successfully:", destinationFile.uri);

    return destinationFile.uri;
  } catch (error) {
    console.log("Save file storage error:", error);
    throw error;
  }
};

// Delete a file from LifeVault
export const deleteFileFromVault = async (fileUri: string): Promise<void> => {
  try {
    const file = new File(fileUri);

    if (file.exists) {
      file.delete();
      console.log("File deleted:", fileUri);
    }
  } catch (error) {
    console.log("Delete file error:", error);
    throw new Error("Unable to delete the selected file.");
  }
};

// Check whether a saved file exists
export const checkVaultFileExists = async (
  fileUri: string,
): Promise<boolean> => {
  try {
    const file = new File(fileUri);
    return file.exists;
  } catch (error) {
    console.log("File check error:", error);
    return false;
  }
};
