import { randomUUID } from 'node:crypto';
import type { BookRecord } from '../types/story';

const store = new Map<string, BookRecord>();

export const bookStore = {
  save(record: BookRecord): void {
    store.set(record.id, record);
  },

  get(id: string): BookRecord | undefined {
    return store.get(id);
  },

  list(): BookRecord[] {
    return Array.from(store.values());
  },
};

export function generateId(): string {
  return randomUUID();
}
