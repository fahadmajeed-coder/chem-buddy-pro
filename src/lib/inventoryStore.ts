import { chemicalInventory as defaultInventory, ChemicalCompound } from './chemicalInventory';

const STORAGE_KEY = 'chemanalyst-inventory';

export function loadInventory(): ChemicalCompound[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...defaultInventory];
}

export function saveInventory(inventory: ChemicalCompound[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}

export function resetInventory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function searchStoredInventory(query: string): ChemicalCompound[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const inventory = loadInventory();
  return inventory.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.formula.toLowerCase().includes(q)
  ).slice(0, 10);
}
