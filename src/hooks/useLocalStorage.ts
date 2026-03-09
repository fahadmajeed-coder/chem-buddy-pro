import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Use ref to track if we just wrote, to avoid re-reading our own event
  const isWriting = useRef(false);

  useEffect(() => {
    try {
      isWriting.current = true;
      window.localStorage.setItem(key, JSON.stringify(storedValue));
      // Dispatch custom event so other hooks with same key re-sync
      window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
      // Reset flag after microtask
      Promise.resolve().then(() => { isWriting.current = false; });
    } catch {
      isWriting.current = false;
      console.warn('Failed to save to localStorage');
    }
  }, [key, storedValue]);

  // Listen for sync events from other components using the same key
  useEffect(() => {
    const handler = (e: Event) => {
      // Skip if we just wrote this event
      if (isWriting.current) return;
      const detail = (e as CustomEvent).detail;
      if (detail?.key !== key) return;
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          setStoredValue(parsed);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('local-storage-sync', handler);
    return () => window.removeEventListener('local-storage-sync', handler);
  }, [key]);

  return [storedValue, setStoredValue];
}
