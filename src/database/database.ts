import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";

// --------------------------------------------------
// DATABASE CONNECTION
// --------------------------------------------------

export const db = SQLite.openDatabaseSync("lifevault.db");

// --------------------------------------------------
// TYPES
// --------------------------------------------------

export type Note = {
  id: number;
  title: string;
  content: string;
  category: string;
  isFavorite: number;
  createdAt: string;
};

export type Reminder = {
  id: number;
  title: string;
  description: string;
  category: string;
  reminderDateTime: string;
  isCompleted: number;
  notificationId: string | null;
  createdAt: string;
};

export type PasswordEntry = {
  id: number;
  website: string;
  username: string;
  createdAt: string;
};

export type Medicine = {
  id: number;
  name: string;
  dosage: string;
  instructions: string;
  frequency: string;
  reminderTime: string;
  startDate: string;
  endDate: string | null;
  isActive: number;
  notificationId: string | null;
  createdAt: string;
};

// --------------------------------------------------
// DATABASE INITIALIZATION
// --------------------------------------------------

export function initializeDatabase() {
  console.log("Starting database initialization...");

  // NOTES TABLE
  db.execSync(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      isFavorite INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // REMINDERS TABLE
  db.execSync(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      reminderDateTime TEXT NOT NULL,
      isCompleted INTEGER DEFAULT 0,
      notificationId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // PASSWORD VAULT TABLE
  db.execSync(`
    CREATE TABLE IF NOT EXISTS password_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      website TEXT NOT NULL,
      username TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // MEDICINES TABLE
  db.execSync(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      instructions TEXT,
      frequency TEXT NOT NULL,
      reminderTime TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT,
      isActive INTEGER DEFAULT 1,
      notificationId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ------------------------------------------------
  // DATABASE MIGRATIONS
  // ------------------------------------------------

  // NOTES: Add isFavorite column if missing
  const noteColumns = db.getAllSync<{ name: string }>(
    "PRAGMA table_info(notes)",
  );

  const hasFavorite = noteColumns.some(
    (column) => column.name === "isFavorite",
  );

  if (!hasFavorite) {
    db.execSync("ALTER TABLE notes ADD COLUMN isFavorite INTEGER DEFAULT 0");
  }

  // REMINDERS: Add notificationId column if missing
  const reminderColumns = db.getAllSync<{ name: string }>(
    "PRAGMA table_info(reminders)",
  );

  const hasReminderNotificationId = reminderColumns.some(
    (column) => column.name === "notificationId",
  );

  if (!hasReminderNotificationId) {
    db.execSync("ALTER TABLE reminders ADD COLUMN notificationId TEXT");
  }

  // MEDICINES: Add notificationId column if missing
  const medicineColumns = db.getAllSync<{ name: string }>(
    "PRAGMA table_info(medicines)",
  );

  const hasMedicineNotificationId = medicineColumns.some(
    (column) => column.name === "notificationId",
  );

  if (!hasMedicineNotificationId) {
    db.execSync("ALTER TABLE medicines ADD COLUMN notificationId TEXT");
  }

  console.log("LifeVault database initialized successfully!");
  console.log("Database initialization completed!");
}

// ==================================================
// NOTES FUNCTIONS
// ==================================================

// ADD NOTE
export function addNote(title: string, content: string, category: string) {
  return db.runSync(
    `INSERT INTO notes (title, content, category)
     VALUES (?, ?, ?)`,
    title,
    content,
    category,
  );
}

// GET ALL NOTES
export function getNotes(): Note[] {
  return db.getAllSync<Note>("SELECT * FROM notes ORDER BY createdAt DESC");
}

// UPDATE NOTE
export function updateNote(
  id: number,
  title: string,
  content: string,
  category: string,
) {
  return db.runSync(
    `UPDATE notes
     SET title = ?, content = ?, category = ?
     WHERE id = ?`,
    title,
    content,
    category,
    id,
  );
}

// TOGGLE NOTE FAVOURITE
export function toggleFavorite(id: number, isFavorite: number) {
  return db.runSync(
    "UPDATE notes SET isFavorite = ? WHERE id = ?",
    isFavorite,
    id,
  );
}

// DELETE NOTE
export function deleteNote(id: number) {
  return db.runSync("DELETE FROM notes WHERE id = ?", id);
}

// ==================================================
// REMINDER FUNCTIONS
// ==================================================

// ADD REMINDER
export function addReminder(
  title: string,
  description: string,
  category: string,
  reminderDateTime: string,
  notificationId: string | null,
) {
  return db.runSync(
    `INSERT INTO reminders
     (title, description, category, reminderDateTime, notificationId)
     VALUES (?, ?, ?, ?, ?)`,
    title,
    description,
    category,
    reminderDateTime,
    notificationId,
  );
}

// GET ALL REMINDERS
export function getReminders(): Reminder[] {
  return db.getAllSync<Reminder>(
    "SELECT * FROM reminders ORDER BY reminderDateTime ASC",
  );
}

// UPDATE REMINDER
export function updateReminder(
  id: number,
  title: string,
  description: string,
  category: string,
  reminderDateTime: string,
  notificationId: string | null,
) {
  return db.runSync(
    `UPDATE reminders
     SET title = ?,
         description = ?,
         category = ?,
         reminderDateTime = ?,
         notificationId = ?
     WHERE id = ?`,
    title,
    description,
    category,
    reminderDateTime,
    notificationId,
    id,
  );
}

// TOGGLE REMINDER COMPLETED
export function toggleReminderCompleted(id: number, isCompleted: number) {
  return db.runSync(
    "UPDATE reminders SET isCompleted = ? WHERE id = ?",
    isCompleted,
    id,
  );
}

// UPDATE REMINDER NOTIFICATION ID
export function updateReminderNotificationId(
  id: number,
  notificationId: string | null,
) {
  return db.runSync(
    "UPDATE reminders SET notificationId = ? WHERE id = ?",
    notificationId,
    id,
  );
}

// DELETE REMINDER
export function deleteReminder(id: number) {
  return db.runSync("DELETE FROM reminders WHERE id = ?", id);
}

// ==================================================
// PASSWORD VAULT FUNCTIONS
// ==================================================

// ADD PASSWORD
// Actual password is stored securely in Expo SecureStore.
// Only website and username are stored in SQLite.

export async function addPassword(
  website: string,
  username: string,
  password: string,
) {
  const result = db.runSync(
    `INSERT INTO password_entries (website, username)
     VALUES (?, ?)`,
    website,
    username,
  );

  const id = result.lastInsertRowId;

  try {
    await SecureStore.setItemAsync(`lifevault_password_${id}`, password);
  } catch (error) {
    // Remove the database record if secure storage fails.
    db.runSync("DELETE FROM password_entries WHERE id = ?", id);

    throw error;
  }

  return result;
}

// GET ALL PASSWORD ENTRIES
export function getPasswords(): PasswordEntry[] {
  return db.getAllSync<PasswordEntry>(
    "SELECT * FROM password_entries ORDER BY createdAt DESC",
  );
}

// GET ONE PASSWORD
export async function getPassword(id: number): Promise<string | null> {
  return SecureStore.getItemAsync(`lifevault_password_${id}`);
}

// UPDATE PASSWORD ENTRY
export async function updatePassword(
  id: number,
  website: string,
  username: string,
  password: string,
) {
  db.runSync(
    `UPDATE password_entries
     SET website = ?, username = ?
     WHERE id = ?`,
    website,
    username,
    id,
  );

  await SecureStore.setItemAsync(`lifevault_password_${id}`, password);
}

// DELETE PASSWORD ENTRY
export async function deletePassword(id: number) {
  await SecureStore.deleteItemAsync(`lifevault_password_${id}`);

  return db.runSync("DELETE FROM password_entries WHERE id = ?", id);
}

// ==================================================
// MEDICINE FUNCTIONS
// ==================================================

// ADD MEDICINE
export function addMedicine(
  name: string,
  dosage: string,
  instructions: string,
  frequency: string,
  reminderTime: string,
  startDate: string,
  endDate: string,
) {
  return db.runSync(
    `INSERT INTO medicines
     (
       name,
       dosage,
       instructions,
       frequency,
       reminderTime,
       startDate,
       endDate,
       isActive
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    name,
    dosage,
    instructions,
    frequency,
    reminderTime,
    startDate,
    endDate,
  );
}

// GET ALL MEDICINES
export function getMedicines(): Medicine[] {
  return db.getAllSync<Medicine>(
    "SELECT * FROM medicines ORDER BY createdAt DESC",
  );
}

// UPDATE MEDICINE
export function updateMedicine(
  id: number,
  name: string,
  dosage: string,
  instructions: string,
  frequency: string,
  reminderTime: string,
  startDate: string,
  endDate: string,
) {
  return db.runSync(
    `UPDATE medicines
     SET name = ?,
         dosage = ?,
         instructions = ?,
         frequency = ?,
         reminderTime = ?,
         startDate = ?,
         endDate = ?
     WHERE id = ?`,
    name,
    dosage,
    instructions,
    frequency,
    reminderTime,
    startDate,
    endDate,
    id,
  );
}

// ACTIVATE / DEACTIVATE MEDICINE
export function toggleMedicineStatus(id: number, isActive: number) {
  return db.runSync(
    "UPDATE medicines SET isActive = ? WHERE id = ?",
    isActive,
    id,
  );
}

// UPDATE MEDICINE NOTIFICATION ID
export function updateMedicineNotificationId(
  id: number,
  notificationId: string | null,
) {
  return db.runSync(
    "UPDATE medicines SET notificationId = ? WHERE id = ?",
    notificationId,
    id,
  );
}

// DELETE MEDICINE
export function deleteMedicine(id: number) {
  return db.runSync("DELETE FROM medicines WHERE id = ?", id);
}
