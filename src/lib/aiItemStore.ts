import type { GeneratedItem } from '@/lib/aiChat';
import type { SOPEntry } from '@/lib/sopData';
import type { ChemicalCompound } from '@/lib/chemicalInventory';
import { loadInventory, saveInventory } from '@/lib/inventoryStore';

/**
 * Add an AI-generated SOP to the custom SOPs list in localStorage.
 */
export function addGeneratedSOP(data: Record<string, unknown>): boolean {
  try {
    const sop: SOPEntry = {
      id: `ai-sop-${Date.now()}`,
      name: data.name as string,
      category: data.category as string || 'AI Generated',
      principle: data.principle as string,
      apparatus: data.apparatus as string[],
      reagents: data.reagents as string[],
      procedure: data.procedure as string[],
      calculations: data.calculations as string,
      resultInterpretation: data.resultInterpretation as string,
    };

    const existing: SOPEntry[] = JSON.parse(localStorage.getItem('chemanalyst-custom-sops') || '[]');
    existing.push(sop);
    localStorage.setItem('chemanalyst-custom-sops', JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: 'chemanalyst-custom-sops' } }));
    return true;
  } catch (e) {
    console.error('Failed to add SOP:', e);
    return false;
  }
}

/**
 * Add an AI-generated formula to the formulas list in localStorage.
 */
export function addGeneratedFormula(data: Record<string, unknown>): boolean {
  try {
    const formula = {
      id: `ai-formula-${Date.now()}`,
      name: data.name as string,
      description: data.description as string,
      expression: data.expression as string,
      variables: ((data.variables as { name: string; description: string; defaultValue: string }[]) || []).map(v => ({
        id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: v.name,
        description: v.description,
        defaultValue: v.defaultValue || '',
        testValue: v.defaultValue || '',
      })),
      createdAt: Date.now(),
    };

    const existing = JSON.parse(localStorage.getItem('chem-formulas-v2') || '[]');
    existing.push(formula);
    localStorage.setItem('chem-formulas-v2', JSON.stringify(existing));
    window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: 'chem-formulas-v2' } }));
    return true;
  } catch (e) {
    console.error('Failed to add formula:', e);
    return false;
  }
}

/**
 * Add an AI-generated chemical compound to the inventory in localStorage.
 */
export function addGeneratedInventoryItem(data: Record<string, unknown>): boolean {
  try {
    const inventory = loadInventory();
    const maxSrNo = inventory.reduce((max, c) => Math.max(max, c.srNo), 0);

    const purity = (data.purity as string) || '';
    let purityValue: number | null = null;
    if (purity) {
      const rangeMatch = purity.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
      if (rangeMatch) {
        purityValue = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
      } else {
        const single = purity.match(/([\d.]+)/);
        if (single) purityValue = parseFloat(single[1]);
      }
    }

    const compound: ChemicalCompound = {
      srNo: maxSrNo + 1,
      name: data.name as string,
      formula: data.formula as string,
      molarMass: (data.molarMass as number) || null,
      nFactor: (data.nFactor as number) ?? null,
      purity,
      purityValue,
      density: (data.density as number) ?? null,
    };

    inventory.push(compound);
    saveInventory(inventory);
    window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: 'chemanalyst-inventory' } }));
    return true;
  } catch (e) {
    console.error('Failed to add inventory item:', e);
    return false;
  }
}

/**
 * Dispatch the appropriate add function based on item type.
 */
export function addGeneratedItem(item: GeneratedItem): boolean {
  switch (item.type) {
    case 'generate_sop':
      return addGeneratedSOP(item.data);
    case 'generate_formula':
      return addGeneratedFormula(item.data);
    case 'generate_inventory_item':
      return addGeneratedInventoryItem(item.data);
    default:
      return false;
  }
}
