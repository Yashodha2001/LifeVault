export type SelectedVaultFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

const unsupported = (): Error =>
  new Error("Document storage is not available in the web version.");

export const initializeVaultStorage = async (): Promise<void> => {
  throw unsupported();
};

export const saveFileToVault = async (
  _file: SelectedVaultFile,
): Promise<string> => {
  throw unsupported();
};

export const deleteFileFromVault = async (
  _fileUri: string,
): Promise<void> => {
  throw unsupported();
};

export const checkVaultFileExists = async (
  _fileUri: string,
): Promise<boolean> => {
  throw unsupported();
};
