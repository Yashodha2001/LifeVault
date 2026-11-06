import * as SQLite from "expo-sqlite";

// Open or create the local database
export const db = SQLite.openDatabaseSync("lifevault.db");

// Create the database tables
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
