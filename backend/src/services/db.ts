import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH = path.resolve(__dirname, '../../fairyweave.db');

export const db = new Database(DB_PATH);

// Initialize immediately so tables exist before any prepared statements compile
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.prepare(`
  CREATE TABLE IF NOT EXISTS books (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    request         TEXT NOT NULL,
    pages           TEXT NOT NULL,
    image_urls      TEXT NOT NULL,
    cover_image_url TEXT NOT NULL,
    book_spec_uid   TEXT NOT NULL,
    created_at      TEXT NOT NULL
  )
`).run();

// Kept for explicit call in index.ts startup sequence (no-op after first run)
export function initDb(): void {}
