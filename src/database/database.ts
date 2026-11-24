import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";

// ==================================================
// DATABASE CONNECTION
// ==================================================

let db: SQLite.SQLiteDatabase;

// ==================================================
// TYPES
// ==================================================

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

export type ImportantDate = {
  id: number;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  notificationDaysBefore: number;
  notificationId: string | null;
  createdAt: string;
};

export type Assignment = {
  id: number;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  isCompleted: number;
  createdAt: string;
};

// ==================================================
// DATABASE INITIALIZATION
// ==================================================

export async function initializeDatabase() {
  console.log("Starting database initialization...");

  db = await SQLite.openDatabaseAsync("lifevault.db");

  // NOTES TABLE
  await db.execAsync(`
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
  await db.execAsync(`
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
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS password_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      website TEXT NOT NULL,
      username TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // MEDICINES TABLE
  await db.execAsync(`
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

  // IMPORTANT DATES TABLE
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS important_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      eventDate TEXT NOT NULL,
      notificationDaysBefore INTEGER DEFAULT 0,
      notificationId TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // ASSIGNMENTS TABLE
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT DEFAULT '',
      dueDate TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium',
      isCompleted INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // --------------------------------------------------
  // DATABASE MIGRATIONS
  // --------------------------------------------------

  // NOTES: Add isFavorite if missing
  const noteColumns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(notes)",
  );

  if (!noteColumns.some((column) => column.name === "isFavorite")) {
    await db.execAsync("ALTER TABLE notes ADD COLUMN isFavorite INTEGER DEFAULT 0");
  }

  // REMINDERS: Add notificationId if missing
  const reminderColumns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(reminders)",
  );

  if (!reminderColumns.some((column) => column.name === "notificationId")) {
    await db.execAsync("ALTER TABLE reminders ADD COLUMN notificationId TEXT");
  }

  // MEDICINES: Add notificationId if missing
  const medicineColumns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(medicines)",
  );

  if (!medicineColumns.some((column) => column.name === "notificationId")) {
    await db.execAsync("ALTER TABLE medicines ADD COLUMN notificationId TEXT");
  }

  // IMPORTANT DATES: Add notification columns if missing
  const importantDateColumns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(important_dates)",
  );

  if (
    !importantDateColumns.some(
      (column) => column.name === "notificationDaysBefore",
    )
  ) {
    await db.execAsync(
      "ALTER TABLE important_dates ADD COLUMN notificationDaysBefore INTEGER DEFAULT 0",
    );
  }

  if (
    !importantDateColumns.some((column) => column.name === "notificationId")
  ) {
    await db.execAsync("ALTER TABLE important_dates ADD COLUMN notificationId TEXT");
  }

  console.log("LifeVault database initialized successfully!");
  console.log("Database initialization completed!");
}

// ==================================================
// NOTES FUNCTIONS
// ==================================================

export function addNote(title: string, content: string, category: string) {
  return db.runSync(
    `INSERT INTO notes (title, content, category)
     VALUES (?, ?, ?)`,
    title,
    content,
    category,
  );
}

export function getNotes(): Note[] {
  return db.getAllSync<Note>("SELECT * FROM notes ORDER BY createdAt DESC");
}

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

export function toggleFavorite(id: number, isFavorite: number) {
  return db.runSync(
    "UPDATE notes SET isFavorite = ? WHERE id = ?",
    isFavorite,
    id,
  );
}

export function deleteNote(id: number) {
  return db.runSync("DELETE FROM notes WHERE id = ?", id);
}

// ==================================================
// REMINDER FUNCTIONS
// ==================================================

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

export function getReminders(): Reminder[] {
  return db.getAllSync<Reminder>(
    "SELECT * FROM reminders ORDER BY reminderDateTime ASC",
  );
}

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

export function toggleReminderCompleted(id: number, isCompleted: number) {
  return db.runSync(
    "UPDATE reminders SET isCompleted = ? WHERE id = ?",
    isCompleted,
    id,
  );
}

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

export function deleteReminder(id: number) {
  return db.runSync("DELETE FROM reminders WHERE id = ?", id);
}

// ==================================================
// PASSWORD VAULT FUNCTIONS
// ==================================================

// Password values are stored in SecureStore.
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
    db.runSync("DELETE FROM password_entries WHERE id = ?", id);
    throw error;
  }

  return result;
}

export function getPasswords(): PasswordEntry[] {
  return db.getAllSync<PasswordEntry>(
    "SELECT * FROM password_entries ORDER BY createdAt DESC",
  );
}

export async function getPassword(id: number): Promise<string | null> {
  return SecureStore.getItemAsync(`lifevault_password_${id}`);
}

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

export async function deletePassword(id: number) {
  await SecureStore.deleteItemAsync(`lifevault_password_${id}`);

  return db.runSync("DELETE FROM password_entries WHERE id = ?", id);
}

// ==================================================
// MEDICINE FUNCTIONS
// ==================================================

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

export function getMedicines(): Medicine[] {
  return db.getAllSync<Medicine>(
    "SELECT * FROM medicines ORDER BY createdAt DESC",
  );
}

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

export function toggleMedicineStatus(id: number, isActive: number) {
  return db.runSync(
    "UPDATE medicines SET isActive = ? WHERE id = ?",
    isActive,
    id,
  );
}

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

export function deleteMedicine(id: number) {
  return db.runSync("DELETE FROM medicines WHERE id = ?", id);
}

// ==================================================
// IMPORTANT DATES FUNCTIONS
// ==================================================

export function addImportantDate(
  title: string,
  description: string,
  category: string,
  eventDate: string,
  notificationDaysBefore: number,
) {
  return db.runSync(
    `INSERT INTO important_dates
     (title, description, category, eventDate, notificationDaysBefore)
     VALUES (?, ?, ?, ?, ?)`,
    title,
    description,
    category,
    eventDate,
    notificationDaysBefore,
  );
}

export function getImportantDates(): ImportantDate[] {
  return db.getAllSync<ImportantDate>(
    "SELECT * FROM important_dates ORDER BY eventDate ASC",
  );
}

export function updateImportantDate(
  id: number,
  title: string,
  description: string,
  category: string,
  eventDate: string,
  notificationDaysBefore: number,
) {
  return db.runSync(
    `UPDATE important_dates
     SET title = ?,
         description = ?,
         category = ?,
         eventDate = ?,
         notificationDaysBefore = ?,
         notificationId = NULL
     WHERE id = ?`,
    title,
    description,
    category,
    eventDate,
    notificationDaysBefore,
    id,
  );
}

export function updateImportantDateNotificationId(
  id: number,
  notificationId: string | null,
) {
  return db.runSync(
    "UPDATE important_dates SET notificationId = ? WHERE id = ?",
    notificationId,
    id,
  );
}

export function deleteImportantDate(id: number) {
  return db.runSync("DELETE FROM important_dates WHERE id = ?", id);
}

// ==================================================
// ASSIGNMENT MANAGER FUNCTIONS
// ==================================================

export function addAssignment(
  title: string,
  subject: string,
  description: string,
  dueDate: string,
  priority: "Low" | "Medium" | "High",
) {
  return db.runSync(
    `INSERT INTO assignments
     (title, subject, description, dueDate, priority)
     VALUES (?, ?, ?, ?, ?)`,
    title,
    subject,
    description,
    dueDate,
    priority,
  );
}

export function getAssignments(): Assignment[] {
  return db.getAllSync<Assignment>(
    `SELECT * FROM assignments
     ORDER BY dueDate ASC, id DESC`,
  );
}

export function updateAssignment(
  id: number,
  title: string,
  subject: string,
  description: string,
  dueDate: string,
  priority: "Low" | "Medium" | "High",
) {
  return db.runSync(
    `UPDATE assignments
     SET title = ?,
         subject = ?,
         description = ?,
         dueDate = ?,
         priority = ?
     WHERE id = ?`,
    title,
    subject,
    description,
    dueDate,
    priority,
    id,
  );
}

export function toggleAssignmentCompleted(id: number, isCompleted: number) {
  return db.runSync(
    `UPDATE assignments
     SET isCompleted = ?
     WHERE id = ?`,
    isCompleted,
    id,
  );
}

export function deleteAssignment(id: number) {
  return db.runSync("DELETE FROM assignments WHERE id = ?", id);
}
