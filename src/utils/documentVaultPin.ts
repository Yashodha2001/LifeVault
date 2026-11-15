import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const PIN_STORAGE_KEY = "lifevault_document_vault_pin_v1";

// Generate a secure hash of the PIN using a random salt.
async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
}

// Check whether a PIN has already been created.
export async function hasDocumentVaultPin(): Promise<boolean> {
  const savedData = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
  return savedData !== null;
}

// Create and securely save a new PIN.
export async function createDocumentVaultPin(pin: string): Promise<void> {
  if (!/^\d{4}$|^\d{6}$/.test(pin)) {
    throw new Error("PIN must contain exactly 4 or 6 digits.");
  }

  const randomBytes = await Crypto.getRandomBytesAsync(16);
  const salt = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const hash = await hashPin(pin, salt);

  await SecureStore.setItemAsync(
    PIN_STORAGE_KEY,
    JSON.stringify({ salt, hash }),
  );
}

// Verify the entered PIN.
export async function verifyDocumentVaultPin(
  enteredPin: string,
): Promise<boolean> {
  if (!/^\d{4}$|^\d{6}$/.test(enteredPin)) {
    return false;
  }

  const savedData = await SecureStore.getItemAsync(PIN_STORAGE_KEY);

  if (!savedData) {
    return false;
  }

  const { salt, hash } = JSON.parse(savedData);

  const enteredHash = await hashPin(enteredPin, salt);

  return enteredHash === hash;
}
