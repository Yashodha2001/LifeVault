import * as SQLite from "expo-sqlite";

// Open or create the LifeVault database
export const db = SQLite.openDatabaseSync("lifevault.db");

// ===============================
// NOTE DATA TYPE
// ===============================
export type Note = {
  id: number;
  title: string;
  content: string;
  category: string;
  isFavorite: number;
  createdAt: string;
};

// ===============================
// REMINDER DATA TYPE
// ===============================
export type Reminder = {
  id: number;
  title: string;
  description: string;
  category: string;
  reminderDateTime: string;
  isCompleted: number;
  createdAt: string;
};

// ===============================
// INITIALIZE DATABASE
// ===============================
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

  // Check whether isFavorite column exists
  const columns = db.getAllSync<{ name: string }>("PRAGMA table_info(notes)");

  const hasFavoriteColumn = columns.some(
    (column) => column.name === "isFavorite",
  );

  // Add isFavorite column if missing
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
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("LifeVault database initialized successfully!");
}

// ======================================
// NOTES DATABASE FUNCTIONS
// ======================================

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
  const result = db.runSync(
    `UPDATE notes
     SET title = ?, content = ?, category = ?
     WHERE id = ?`,
    title,
    content,
    category,
    id,
  );

  console.log("Update result:", result);
  return result;
}

// FAVOURITE NOTE
export function toggleFavorite(id: number, isFavorite: number) {
  const result = db.runSync(
    `UPDATE notes
     SET isFavorite = ?
     WHERE id = ?`,
    isFavorite,
    id,
  );

  console.log("Favourite result:", result);
  return result;
}

// DELETE NOTE
export function deleteNote(id: number) {
  return db.runSync("DELETE FROM notes WHERE id = ?", id);
}

// ======================================
// REMINDER DATABASE FUNCTIONS
// ======================================

// CREATE REMINDER
export function addReminder(
  title: string,
  description: string,
  category: string,
  reminderDateTime: string,
) {
  return db.runSync(
    `INSERT INTO reminders
     (title, description, category, reminderDateTime)
     VALUES (?, ?, ?, ?)`,
    title,
    description,
    category,
    reminderDateTime,
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
) {
  return db.runSync(
    `UPDATE reminders
     SET title = ?,
         description = ?,
         category = ?,
         reminderDateTime = ?
     WHERE id = ?`,
    title,
    description,
    category,
    reminderDateTime,
    id,
  );
}

// MARK REMINDER AS COMPLETED OR PENDING
export function toggleReminderCompleted(id: number, isCompleted: number) {
  return db.runSync(
    `UPDATE reminders
     SET isCompleted = ?
     WHERE id = ?`,
    isCompleted,
    id,
  );
}

// DELETE REMINDER
export function deleteReminder(id: number) {
  return db.runSync("DELETE FROM reminders WHERE id = ?", id);
}
