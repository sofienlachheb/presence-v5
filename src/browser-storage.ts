export type BrowserStorageValue = { value: string } | null;

export interface BrowserStorageBridge {
  get(key: string, shared?: boolean): Promise<BrowserStorageValue>;
  set(key: string, value: string, shared?: boolean): Promise<{ ok: true }>;
  "delete"(key: string, shared?: boolean): Promise<{ ok: true }>;
}

declare global {
  interface Window {
    storage?: BrowserStorageBridge;
  }
}

const memoryStore = new Map<string, string>();

function readValue(key: string) {
  try {
    return window.localStorage.getItem(key) ?? memoryStore.get(key) ?? null;
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

function writeValue(key: string, value: string) {
  memoryStore.set(key, value);

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Keep the in-memory fallback for restricted browser storage contexts.
  }
}

function removeValue(key: string) {
  memoryStore.delete(key);

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing else to clear when localStorage is unavailable.
  }
}

export function installDisciplineStorageAdapter() {
  if (typeof window === "undefined" || window.storage) {
    return;
  }

  window.storage = {
    async get(key) {
      const value = readValue(key);
      return value === null ? null : { value };
    },
    async set(key, value) {
      writeValue(key, value);
      return { ok: true };
    },
    async delete(key) {
      removeValue(key);
      return { ok: true };
    },
  };
}

export function getDisciplineStorage() {
  if (typeof window === "undefined") {
    throw new Error("Discipline storage is only available in the browser.");
  }

  installDisciplineStorageAdapter();

  if (!window.storage) {
    throw new Error("Discipline storage could not be initialized.");
  }

  return window.storage;
}
