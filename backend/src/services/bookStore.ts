import { randomUUID } from 'node:crypto';
import { db } from './db';
import type { BookRecord, GenerationProgress } from '../types/story';

const MAX_BOOKS = 20;
const TTL_MS = 30 * 60 * 1000;

type BookRow = {
  id: string;
  title: string;
  request: string;
  pages: string;
  image_urls: string;
  cover_image_url: string;
  book_spec_uid: string;
  created_at: string;
};

function expiryThreshold(): string {
  return new Date(Date.now() - TTL_MS).toISOString();
}

function rowToRecord(row: BookRow): BookRecord {
  return {
    id: row.id,
    title: row.title,
    request: JSON.parse(row.request),
    pages: JSON.parse(row.pages),
    imageUrls: JSON.parse(row.image_urls),
    coverImageUrl: row.cover_image_url,
    bookSpecUid: row.book_spec_uid as BookRecord['bookSpecUid'],
    createdAt: row.created_at,
  };
}

const stmtInsert = db.prepare(`
  INSERT OR REPLACE INTO books
    (id, title, request, pages, image_urls, cover_image_url, book_spec_uid, created_at)
  VALUES
    (@id, @title, @request, @pages, @imageUrls, @coverImageUrl, @bookSpecUid, @createdAt)
`);

const stmtGetById = db.prepare(
  'SELECT * FROM books WHERE id = ? AND created_at > ?'
);

const stmtListAll = db.prepare(
  'SELECT * FROM books WHERE created_at > ? ORDER BY created_at ASC'
);

const stmtDeleteExpired = db.prepare(
  'DELETE FROM books WHERE created_at <= ?'
);

const stmtDeleteOldest = db.prepare(
  'DELETE FROM books WHERE id = (SELECT id FROM books ORDER BY created_at ASC LIMIT 1)'
);

const stmtCount = db.prepare('SELECT COUNT(*) as cnt FROM books');

export const bookStore = {
  save(record: BookRecord): void {
    stmtDeleteExpired.run(expiryThreshold());
    const { cnt } = stmtCount.get() as { cnt: number };
    if (cnt >= MAX_BOOKS) {
      stmtDeleteOldest.run();
    }
    stmtInsert.run({
      id: record.id,
      title: record.title,
      request: JSON.stringify(record.request),
      pages: JSON.stringify(record.pages),
      imageUrls: JSON.stringify(record.imageUrls),
      coverImageUrl: record.coverImageUrl,
      bookSpecUid: record.bookSpecUid,
      createdAt: record.createdAt,
    });
  },

  get(id: string): BookRecord | undefined {
    const row = stmtGetById.get(id, expiryThreshold()) as BookRow | undefined;
    if (!row) return undefined;
    return rowToRecord(row);
  },

  list(): BookRecord[] {
    stmtDeleteExpired.run(expiryThreshold());
    const rows = stmtListAll.all(expiryThreshold()) as BookRow[];
    return rows.map(rowToRecord);
  },
};

// --- Generation progress tracking (in-memory: resets on restart intentionally) ---
const progressStore = new Map<string, GenerationProgress>();
const skipImagesStore = new Map<string, boolean>();

export const progressTracker = {
  start(id: string, totalImages = 16): void {
    progressStore.set(id, { step: 'story', imagesCompleted: 0, totalImages });
  },
  setStep(id: string, step: GenerationProgress['step']): void {
    const p = progressStore.get(id);
    if (p) p.step = step;
  },
  incrementImages(id: string): void {
    const p = progressStore.get(id);
    if (p) p.imagesCompleted++;
  },
  resetImages(id: string, totalImages: number): void {
    const p = progressStore.get(id);
    if (p) {
      p.imagesCompleted = 0;
      p.totalImages = totalImages;
    }
  },
  get(id: string): GenerationProgress | undefined {
    return progressStore.get(id);
  },
  setError(id: string, reason: string): void {
    const p = progressStore.get(id);
    if (p) {
      p.step = 'error';
      p.reason = reason;
    } else {
      progressStore.set(id, { step: 'error', imagesCompleted: 0, totalImages: 0, reason });
    }
  },
  remove(id: string): void {
    progressStore.delete(id);
    skipImagesStore.delete(id);
  },
  setSkipImages(id: string, skip: boolean): void {
    skipImagesStore.set(id, skip);
  },
  getSkipImages(id: string): boolean {
    return skipImagesStore.get(id) ?? false;
  },
};

export function generateId(): string {
  return randomUUID();
}
