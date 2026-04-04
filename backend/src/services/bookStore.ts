import { randomUUID } from 'node:crypto';
import type { BookRecord, GenerationProgress } from '../types/story';

const MAX_BOOKS = 20;
const TTL_MS = 30 * 60 * 1000; // 30 minutes

const store = new Map<string, { record: BookRecord; storedAt: number }>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.storedAt > TTL_MS) store.delete(key);
  }
}

export const bookStore = {
  save(record: BookRecord): void {
    evictExpired();
    // If still at capacity, remove oldest entry
    if (store.size >= MAX_BOOKS) {
      const oldest = store.keys().next().value!;
      store.delete(oldest);
    }
    store.set(record.id, { record, storedAt: Date.now() });
  },

  get(id: string): BookRecord | undefined {
    const entry = store.get(id);
    if (!entry) return undefined;
    if (Date.now() - entry.storedAt > TTL_MS) {
      store.delete(id);
      return undefined;
    }
    return entry.record;
  },

  list(): BookRecord[] {
    evictExpired();
    return Array.from(store.values()).map((e) => e.record);
  },
};

// --- Generation progress tracking ---
const progressStore = new Map<string, GenerationProgress>();

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
  },
};

export function generateId(): string {
  return randomUUID();
}
