import * as SQLite from "expo-sqlite";

// Connect to the existing LifeVault database.
const documentsDB = SQLite.openDatabaseSync("lifevault.db");

// Document information type.
export type VaultDocument = {
  id: number;
  name: string;
  originalName: string;
  fileUri: string;
  fileType: string;
  mimeType: string;
  category: "Personal" | "Professional";
  fileSize: number;
  isFavorite: number;
  createdAt: string;
};

// Create the documents table.
// This does not delete or modify existing tables.
export const initializeDocumentsDatabase = (): void => {
  documentsDB.execSync(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      originalName TEXT NOT NULL,
      fileUri TEXT NOT NULL,
      fileType TEXT NOT NULL,
      mimeType TEXT,
      category TEXT NOT NULL,
      fileSize INTEGER DEFAULT 0,
      isFavorite INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Documents database initialized successfully!");
};

// Add a document record.
export const addDocument = (
  document: Omit<VaultDocument, "id" | "createdAt" | "isFavorite">,
): number => {
  const result = documentsDB.runSync(
    `INSERT INTO documents
    (name, originalName, fileUri, fileType, mimeType, category, fileSize)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      document.name,
      document.originalName,
      document.fileUri,
      document.fileType,
      document.mimeType,
      document.category,
      document.fileSize,
    ],
  );

  return result.lastInsertRowId;
};

// Get all documents.
export const getDocuments = (): VaultDocument[] => {
  return documentsDB.getAllSync<VaultDocument>(
    "SELECT * FROM documents ORDER BY createdAt DESC",
  );
};

// Get documents by category.
export const getDocumentsByCategory = (
  category: "Personal" | "Professional",
): VaultDocument[] => {
  return documentsDB.getAllSync<VaultDocument>(
    "SELECT * FROM documents WHERE category = ? ORDER BY createdAt DESC",
    [category],
  );
};

// Search documents.
export const searchDocuments = (searchText: string): VaultDocument[] => {
  return documentsDB.getAllSync<VaultDocument>(
    `SELECT * FROM documents
     WHERE name LIKE ? OR originalName LIKE ?
     ORDER BY createdAt DESC`,
    [`%${searchText}%`, `%${searchText}%`],
  );
};

// Rename a document.
export const renameDocument = (id: number, newName: string): void => {
  documentsDB.runSync("UPDATE documents SET name = ? WHERE id = ?", [
    newName,
    id,
  ]);
};

// Add or remove favourite.
export const toggleDocumentFavorite = (
  id: number,
  currentFavorite: number,
): void => {
  documentsDB.runSync("UPDATE documents SET isFavorite = ? WHERE id = ?", [
    currentFavorite === 1 ? 0 : 1,
    id,
  ]);
};

// Delete a document record.
export const deleteDocumentRecord = (id: number): void => {
  documentsDB.runSync("DELETE FROM documents WHERE id = ?", [id]);
};
