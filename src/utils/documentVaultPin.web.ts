import * as Crypto from "expo-crypto";

const PIN_STORAGE_KEY = "lifevault_document_vault_pin_v1";

function getLocalStorage(): Storage {
  if (typeof localStorage === "undefined") {
    throw new Error("Document Vault PIN storage is unavailable.");
  }

  return localStorage;
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
}

export async function hasDocumentVaultPin(): Promise<boolean> {
  return getLocalStorage().getItem(PIN_STORAGE_KEY) !== null;
}

export async function createDocumentVaultPin(pin: string): Promise<void> {
  if (!/^\d{4}$|^\d{6}$/.test(pin)) {
    throw new Error("PIN must contain exactly 4 or 6 digits.");
  }

  const randomBytes = await Crypto.getRandomBytesAsync(16);
  const salt = Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const hash = await hashPin(pin, salt);

  getLocalStorage().setItem(PIN_STORAGE_KEY, JSON.stringify({ salt, hash }));
}

export async function verifyDocumentVaultPin(
  enteredPin: string,
): Promise<boolean> {
  if (!/^\d{4}$|^\d{6}$/.test(enteredPin)) {
    return false;
  }

  const savedData = getLocalStorage().getItem(PIN_STORAGE_KEY);
  if (!savedData) {
    return false;
  }

  const { salt, hash } = JSON.parse(savedData) as {
    salt: string;
    hash: string;
  };
  const enteredHash = await hashPin(enteredPin, salt);

  return enteredHash === hash;
}
