import * as SQLite from "expo-sqlite";

// Open or create the local database
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

// Create the database table
export function initializeDatabase() {
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

// READ: Get all saved notes
export function getNotes(): Note[] {
  return db.getAllSync<Note>("SELECT * FROM notes ORDER BY id DESC");
}

// DELETE: Delete a note using its ID
export function deleteNote(id: number) {
  return db.runSync("DELETE FROM notes WHERE id = ?", id);
}

// UPDATE: Edit an existing note
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

// FAVOURITE: Toggle favourite status
export function toggleFavorite(id: number, isFavorite: number) {
  return db.runSync(
    `UPDATE notes
     SET isFavorite = ?
     WHERE id = ?`,
    isFavorite,
    id,
  );
}
