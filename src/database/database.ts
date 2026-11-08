import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("lifevault.db");

// -------------------- NOTE TYPE --------------------

export type Note = {
  id: number;
  title: string;
  content: string;
  category: string;
  isFavorite: number;
  createdAt: string;
};

// -------------------- REMINDER TYPE --------------------

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

// -------------------- INITIALIZE DATABASE --------------------

export function initializeDatabase() {
  console.log("Starting database initialization...");

  // Create notes table
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

  // Check whether the notes table has the favourite column
  const noteColumns = db.getAllSync<{ name: string }>(
    "PRAGMA table_info(notes)",
  );

  const hasFavoriteColumn = noteColumns.some(
    (column) => column.name === "isFavorite",
  );

  // Add favourite column if it does not exist
  if (!hasFavoriteColumn) {
    db.execSync("ALTER TABLE notes ADD COLUMN isFavorite INTEGER DEFAULT 0");
  }

  // Create reminders table
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

  // Check whether notificationId column exists
  const reminderColumns = db.getAllSync<{ name: string }>(
    "PRAGMA table_info(reminders)",
  );

  const hasNotificationId = reminderColumns.some(
    (column) => column.name === "notificationId",
  );

  // Add notificationId to an existing reminders table if needed
  if (!hasNotificationId) {
    db.execSync("ALTER TABLE reminders ADD COLUMN notificationId TEXT");
  }

  console.log("LifeVault database initialized successfully!");
}

// ==================================================
//                    NOTES CRUD
// ==================================================

// CREATE NOTE
export function addNote(title: string, content: string, category: string) {
  return db.runSync(
    `INSERT INTO notes (title, content, category)
     VALUES (?, ?, ?)`,
    title,
    content,
    category,
  );
}

// READ NOTES
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
//                  REMINDERS CRUD
// ==================================================

// CREATE REMINDER
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

// READ REMINDERS
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
