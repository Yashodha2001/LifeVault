import * as FileSystem from "expo-file-system/legacy";

// Folder where LifeVault stores uploaded files.
const VAULT_DIRECTORY = `${FileSystem.documentDirectory}lifevault-vault/`;

// Information about a file selected from the phone.
export type SelectedVaultFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

// Create the storage folder if it does not exist.
export const initializeVaultStorage = async (): Promise<void> => {
  if (!FileSystem.documentDirectory) {
    throw new Error("Phone document storage is unavailable.");
  }

  const folderInfo = await FileSystem.getInfoAsync(VAULT_DIRECTORY);

  if (!folderInfo.exists) {
    await FileSystem.makeDirectoryAsync(VAULT_DIRECTORY, {
      intermediates: true,
    });
  }
};

// Copy a selected file into LifeVault storage.
export const saveFileToVault = async (
  file: SelectedVaultFile,
): Promise<string> => {
  await initializeVaultStorage();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const uniqueName = `${Date.now()}_${safeName}`;

  const destinationUri = `${VAULT_DIRECTORY}${uniqueName}`;

  await FileSystem.copyAsync({
    from: file.uri,
    to: destinationUri,
  });

  return destinationUri;
};

// Delete a stored file.
export const deleteFileFromVault = async (fileUri: string): Promise<void> => {
  const fileInfo = await FileSystem.getInfoAsync(fileUri);

  if (fileInfo.exists) {
    await FileSystem.deleteAsync(fileUri);
  }
};

// Check whether a stored file exists.
export const checkVaultFileExists = async (
  fileUri: string,
): Promise<boolean> => {
  const fileInfo = await FileSystem.getInfoAsync(fileUri);

  return fileInfo.exists;
};
