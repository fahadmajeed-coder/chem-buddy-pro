// Lightweight global calculation history & favourites store.
// Every calculator can push an entry; the palette + history panel let the
// user re-open, re-run, copy, or pin frequent ones.

import { useEffect, useState } from 'react';

export interface HistoryEntry {
  id: string;
  section: string;       // e.g. 'solution', 'dilution'
  sectionLabel: string;  // human label
  title: string;         // short summary line
  result: string;        // primary result string
  inputs?: Record<string, string | number>;
  pinned?: boolean;
  at: number;            // timestamp
}

const KEY = 'calc-history-v1';
const MAX = 200;

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch { return []; }
}

function write(list: HistoryEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('calc-history-changed'));
  } catch { /* quota — silently skip */ }
}

export function pushHistory(entry: Omit<HistoryEntry, 'id' | 'at'>) {
  const list = read();
  const item: HistoryEntry = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now() };
  list.unshift(item);
  // Cap, but preserve pinned items
  if (list.length > MAX) {
    const pinned = list.filter(e => e.pinned);
    const others = list.filter(e => !e.pinned).slice(0, MAX - pinned.length);
    write([...pinned, ...others]);
  } else {
    write(list);
  }
}

export function togglePinned(id: string) {
  write(read().map(e => e.id === id ? { ...e, pinned: !e.pinned } : e));
}

export function removeEntry(id: string) {
  write(read().filter(e => e.id !== id));
}

export function clearHistory(keepPinned = true) {
  const list = read();
  write(keepPinned ? list.filter(e => e.pinned) : []);
}

export function useHistory(): HistoryEntry[] {
  const [list, setList] = useState<HistoryEntry[]>(() => read());
  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener('calc-history-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('calc-history-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return list;
}
