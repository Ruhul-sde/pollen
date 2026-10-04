/**
 * Safe localStorage wrapper with try/catch fallback for private browsing / blocked storage
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`Failed to set item "${key}" in storage:`, err);
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`Failed to remove item "${key}" from storage:`, err);
    }
  },

  getJSON: <T>(key: string, fallback: T): T => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  },

  setJSON: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Failed to set JSON for "${key}" in storage:`, err);
    }
  },
};
