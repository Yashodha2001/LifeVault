import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("lifevault.db");

// ==================================================
//                     NOTE TYPE
// ==================================================

export type Note = {
  id: number;
  title: string;
  content: string;
  category: string;
  isFavorite: number;
  createdAt: string;
};

// ==================================================
//                  REMINDER TYPE
// ==================================================

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

// ==================================================
//                  PASSWORD TYPE
// ==================================================

export type PasswordEntry = {
  id: number;
  website: string;
  username: string;
  createdAt: string;
};

// ==================================================
//                INITIALIZE DATABASE
// ==================================================

export function initializeDatabase() {
  console.log("Starting database initialization...");

  // -------------------- NOTES TABLE --------------------

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

  // Check notes favourite column
  const noteColumns = db.getAllSync<{ name: string }>(
    "PRAGMA table_info(notes)",
  );

  const hasFavoriteColumn = noteColumns.some(
    (column) => column.name === "isFavorite",
  );

  if (!hasFavoriteColumn) {
    db.execSync("ALTER TABLE notes ADD COLUMN isFavorite INTEGER DEFAULT 0");
  }

  // -------------------- REMINDERS TABLE --------------------

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

  // Check notificationId column
  const reminderColumns = db.getAllSync<{ name: string }>(
    "PRAGMA table_info(reminders)",
  );

  const hasNotificationId = reminderColumns.some(
    (column) => column.name === "notificationId",
  );

  if (!hasNotificationId) {
    db.execSync("ALTER TABLE reminders ADD COLUMN notificationId TEXT");
  }

  // -------------------- PASSWORD TABLE --------------------

  // Actual passwords are NOT stored in SQLite.
  // They are stored separately using Expo SecureStore.

  db.execSync(`
    CREATE TABLE IF NOT EXISTS password_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      website TEXT NOT NULL,
      username TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("LifeVault database initialized successfully!");
}

// ==================================================
//                     NOTES CRUD
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

// GET NOTES
export function getNotes(): Note[] {
  return db.getAllSync<Note>("SELECT * FROM notes ORDER BY id DESC");
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
//                   REMINDERS CRUD
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

// GET REMINDERS
export function getReminders(): Reminder[] {
  return db.getAllSync<Reminder>(
    `SELECT * FROM reminders
     ORDER BY reminderDateTime ASC`,
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

// COMPLETE OR UNDO REMINDER
export function toggleReminderCompleted(
  id: number,
  isCompleted: number,
  notificationId: string | null,
) {
  return db.runSync(
    `UPDATE reminders
     SET isCompleted = ?, notificationId = ?
     WHERE id = ?`,
    isCompleted,
    notificationId,
    id,
  );
}

// DELETE REMINDER
export function deleteReminder(id: number) {
  return db.runSync("DELETE FROM reminders WHERE id = ?", id);
}

// ==================================================
//                   PASSWORD CRUD
// ==================================================

// Generate a unique SecureStore key
function getPasswordKey(id: number) {
  return `lifevault_password_${id}`;
}

// ADD PASSWORD
export async function addPassword(
  website: string,
  username: string,
  password: string,
): Promise<number> {
  // Save website and username in SQLite
  const result = db.runSync(
    `INSERT INTO password_entries (website, username)
     VALUES (?, ?)`,
    website,
    username,
  );

  const id = result.lastInsertRowId;

  try {
    // Store actual password securely
    await SecureStore.setItemAsync(getPasswordKey(id), password);

    return id;
  } catch (error) {
    // Roll back SQLite entry if secure storage fails
    db.runSync("DELETE FROM password_entries WHERE id = ?", id);

    throw error;
  }
}

// GET PASSWORD ENTRIES
export function getPasswords(): PasswordEntry[] {
  return db.getAllSync<PasswordEntry>(
    `SELECT * FROM password_entries
     ORDER BY id DESC`,
  );
}

// GET ACTUAL PASSWORD
export async function getPassword(id: number): Promise<string | null> {
  return await SecureStore.getItemAsync(getPasswordKey(id));
}

// UPDATE PASSWORD
export async function updatePassword(
  id: number,
  website: string,
  username: string,
  password: string,
) {
  // Update secure password first
  await SecureStore.setItemAsync(getPasswordKey(id), password);

  // Update website and username
  return db.runSync(
    `UPDATE password_entries
     SET website = ?, username = ?
     WHERE id = ?`,
    website,
    username,
    id,
  );
}

// DELETE PASSWORD
export async function deletePassword(id: number) {
  // Delete securely stored password
  await SecureStore.deleteItemAsync(getPasswordKey(id));

  // Delete SQLite entry
  return db.runSync("DELETE FROM password_entries WHERE id = ?", id);
}
