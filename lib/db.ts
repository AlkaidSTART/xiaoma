import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { UIMessage } from 'ai';

interface ChatDBSchema extends DBSchema {
  chats: {
    key: string;
    value: {
      id: string;
      title: string;
      createdAt: number;
      updatedAt: number;
      messages: UIMessage[];
    };
    indexes: { 'by-updated': number };
  };
}

let dbPromise: Promise<IDBPDatabase<ChatDBSchema>> | null = null;

export const initDB = () => {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<ChatDBSchema>('gemini-clone-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('chats', { keyPath: 'id' });
        store.createIndex('by-updated', 'updatedAt');
      },
    });
  }
  return dbPromise;
};

export const saveChat = async (id: string, title: string, messages: UIMessage[]) => {
  const db = await initDB();
  if (!db) return;
  await db.put('chats', {
    id,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages,
  });
};

export const getChat = async (id: string) => {
  const db = await initDB();
  if (!db) return null;
  return await db.get('chats', id);
};

export const getAllChats = async () => {
  const db = await initDB();
  if (!db) return [];
  return await db.getAllFromIndex('chats', 'by-updated');
};

export const deleteChat = async (id: string) => {
  const db = await initDB();
  if (!db) return;
  await db.delete('chats', id);
};
