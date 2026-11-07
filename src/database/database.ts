import * as SQLite from "expo-sqlite";

// Open or create the LifeVault database
export const db = SQLite.openDatabaseSync("lifevault.db");

// Define the Note data structure
export type Note = {
  id: number;
  title: string;
  content: string;
  category: string;
  isFavorite: number;
  createdAt: string;
};

// Initialize the database
export function initializeDatabase() {
  console.log("Starting database initialization...");

  // Create the notes table if it does not exist
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

  // Check whether the isFavorite column exists
  const columns = db.getAllSync<{ name: string }>("PRAGMA table_info(notes)");

  const hasFavoriteColumn = columns.some(
    (column) => column.name === "isFavorite",
  );

  // Add the column if it is missing
  if (!hasFavoriteColumn) {
    db.execSync("ALTER TABLE notes ADD COLUMN isFavorite INTEGER DEFAULT 0");

    console.log("isFavorite column added successfully!");
  }

  console.log("LifeVault database initialized successfully!");
}

// CREATE: Add a new note
export function addNote(title: string, content: string, category: string) {
  return db.runSync(
    `INSERT INTO notes (title, content, category)
     VALUES (?, ?, ?)`,
    title,
    content,
    category,
  );
}

// READ: Get all notes
export function getNotes(): Note[] {
  return db.getAllSync<Note>("SELECT * FROM notes ORDER BY id DESC");
}

// UPDATE: Edit an existing note
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

// FAVOURITE: Update favourite status
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

// DELETE: Delete a note
export function deleteNote(id: number) {
  return db.runSync("DELETE FROM notes WHERE id = ?", id);
}
