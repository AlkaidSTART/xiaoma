import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { UIMessage } from 'ai';

export type McpServerKey = 'context7' | 'github' | 'playwright' | 'filesystem' | 'chrome' | 'macos';

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
  chatEvents: {
    key: number;
    value: {
      id?: number;
      chatId: string;
      eventType: 'create' | 'switch' | 'message' | 'response';
      note?: string;
      model?: string;
      timestamp: number;
    };
    indexes: {
      'by-timestamp': number;
      'by-chat': string;
    };
  };
  mcpConfigs: {
    key: McpServerKey;
    value: {
      id: McpServerKey;
      enabled: boolean;
      apiKey: string;
      params: string;
      updatedAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ChatDBSchema>> | null = null;

function normalizeMessages(messages: UIMessage[]) {
  // Ensure messages are structured-clone safe for IndexedDB.
  try {
    return JSON.parse(JSON.stringify(messages)) as UIMessage[];
  } catch {
    return messages.map((m) => {
      const unknownMessage = m as {
        id: string;
        role: string;
        content?: unknown;
        parts?: unknown;
      };
      return {
        id: unknownMessage.id,
        role: unknownMessage.role,
        content: typeof unknownMessage.content === 'string' ? unknownMessage.content : '',
        parts: unknownMessage.parts,
      };
    }) as UIMessage[];
  }
}

export const initDB = () => {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<ChatDBSchema>('gemini-clone-db', 3, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('chats')) {
          const store = db.createObjectStore('chats', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }

        if (!db.objectStoreNames.contains('chatEvents')) {
          const eventStore = db.createObjectStore('chatEvents', {
            keyPath: 'id',
            autoIncrement: true,
          });
          eventStore.createIndex('by-timestamp', 'timestamp');
          eventStore.createIndex('by-chat', 'chatId');
        }

        if (!db.objectStoreNames.contains('mcpConfigs')) {
          db.createObjectStore('mcpConfigs', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const saveChat = async (id: string, title: string, messages: UIMessage[]) => {
  const db = await initDB();
  if (!db) return;
  const existing = await db.get('chats', id);
  await db.put('chats', {
    id,
    title,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    messages: normalizeMessages(messages),
  });
};

export const addChatEvent = async (
  chatId: string,
  eventType: 'create' | 'switch' | 'message' | 'response',
  options?: { note?: string; model?: string }
) => {
  const db = await initDB();
  if (!db) return;
  await db.add('chatEvents', {
    chatId,
    eventType,
    note: options?.note,
    model: options?.model,
    timestamp: Date.now(),
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

export const clearAllChats = async () => {
  const db = await initDB();
  if (!db) return;
  await db.clear('chats');
  await db.clear('chatEvents');
};

export type McpConfigRecord = {
  enabled: boolean;
  apiKey: string;
  params: string;
};

const DEFAULT_MCP_CONFIG: McpConfigRecord = {
  enabled: false,
  apiKey: '',
  params: '',
};

export const getMcpConfig = async (serverKey: McpServerKey): Promise<McpConfigRecord> => {
  const db = await initDB();
  if (!db) return DEFAULT_MCP_CONFIG;
  const config = await db.get('mcpConfigs', serverKey);
  if (!config) return DEFAULT_MCP_CONFIG;
  return {
    enabled: config.enabled,
    apiKey: config.apiKey,
    params: config.params,
  };
};

export const getAllMcpConfigs = async (): Promise<Record<string, McpConfigRecord>> => {
  const db = await initDB();
  if (!db) return {};
  const entries = await db.getAll('mcpConfigs');
  return entries.reduce<Record<string, McpConfigRecord>>((accumulator, item) => {
    accumulator[item.id] = {
      enabled: item.enabled,
      apiKey: item.apiKey,
      params: item.params,
    };
    return accumulator;
  }, {});
};

export const saveMcpConfig = async (serverKey: McpServerKey, config: McpConfigRecord) => {
  const db = await initDB();
  if (!db) return;
  await db.put('mcpConfigs', {
    id: serverKey,
    ...config,
    updatedAt: Date.now(),
  });
};
