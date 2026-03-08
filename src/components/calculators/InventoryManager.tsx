import { useState, useEffect } from 'react';
import { ChemicalCompound } from '@/lib/chemicalInventory';
import { loadInventory, saveInventory, resetInventory } from '@/lib/inventoryStore';
import { Plus, Trash2, RotateCcw, Search, Edit2, Check, X } from 'lucide-react';

export function InventoryManager() {
  const [inventory, setInventory] = useState<ChemicalCompound[]>([]);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<ChemicalCompound>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newCompound, setNewCompound] = useState<Partial<ChemicalCompound>>({
    name: '', formula: '', molarMass: null, nFactor: null, purity: '', purityValue: null, density: null,
  });

  useEffect(() => { setInventory(loadInventory()); }, []);

  const persist = (updated: ChemicalCompound[]) => {
    setInventory(updated);
    saveInventory(updated);
  };

  const handleDelete = (srNo: number) => {
    persist(inventory.filter(c => c.srNo !== srNo));
  };

  const handleReset = () => {
    resetInventory();
    setInventory(loadInventory());
  };

  const handleAdd = () => {
    const maxSr = inventory.reduce((m, c) => Math.max(m, c.srNo), 0);
    const compound: ChemicalCompound = {
      srNo: maxSr + 1,
      name: newCompound.name || 'New Compound',
      formula: newCompound.formula || '',
      molarMass: newCompound.molarMass || null,
      nFactor: newCompound.nFactor || null,
      purity: newCompound.purity || '',
      purityValue: newCompound.purityValue || null,
      density: newCompound.density || null,
    };
    persist([...inventory, compound]);
    setNewCompound({ name: '', formula: '', molarMass: null, nFactor: null, purity: '', purityValue: null, density: null });
    setShowAdd(false);
  };

  const startEdit = (c: ChemicalCompound) => {
    setEditId(c.srNo);
    setEditData({ ...c });
  };

  const saveEdit = () => {
    if (editId === null) return;
    persist(inventory.map(c => c.srNo === editId ? { ...c, ...editData } as ChemicalCompound : c));
    setEditId(null);
    setEditData({});
  };

  const filtered = search
    ? inventory.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.formula.toLowerCase().includes(search.toLowerCase()))
    : inventory;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Chemical Inventory</h3>
            <p className="text-xs text-muted-foreground">{inventory.length} compounds • Editable</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-3 py-1.5 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset to Default
            </button>
            <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Compound
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or formula..."
            className="w-full bg-input border border-border rounded-md pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="p-4 mb-4 border border-primary/30 rounded-lg bg-primary/5 space-y-3">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wider">Add New Compound</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <EditInput label="Name" value={newCompound.name || ''} onChange={(v) => setNewCompound(p => ({ ...p, name: v }))} />
              <EditInput label="Formula" value={newCompound.formula || ''} onChange={(v) => setNewCompound(p => ({ ...p, formula: v }))} />
              <EditInput label="Molar Mass" value={newCompound.molarMass?.toString() || ''} onChange={(v) => setNewCompound(p => ({ ...p, molarMass: parseFloat(v) || null }))} type="number" />
              <EditInput label="n-Factor" value={newCompound.nFactor?.toString() || ''} onChange={(v) => setNewCompound(p => ({ ...p, nFactor: parseFloat(v) || null }))} type="number" />
              <EditInput label="Purity" value={newCompound.purity || ''} onChange={(v) => setNewCompound(p => ({ ...p, purity: v, purityValue: parseFloat(v) || null }))} />
              <EditInput label="Density" value={newCompound.density?.toString() || ''} onChange={(v) => setNewCompound(p => ({ ...p, density: parseFloat(v) || null }))} type="number" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Save</button>
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground uppercase tracking-wider">
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Formula</th>
                <th className="px-3 py-2 text-right font-medium">MW</th>
                <th className="px-3 py-2 text-right font-medium">n</th>
                <th className="px-3 py-2 text-left font-medium">Purity</th>
                <th className="px-3 py-2 text-right font-medium">Density</th>
                <th className="px-3 py-2 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.srNo} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                  {editId === c.srNo ? (
                    <>
                      <td className="px-3 py-2 text-muted-foreground">{c.srNo}</td>
                      <td className="px-3 py-1"><EditCell value={editData.name || ''} onChange={(v) => setEditData(p => ({ ...p, name: v }))} /></td>
                      <td className="px-3 py-1"><EditCell value={editData.formula || ''} onChange={(v) => setEditData(p => ({ ...p, formula: v }))} /></td>
                      <td className="px-3 py-1"><EditCell value={editData.molarMass?.toString() || ''} onChange={(v) => setEditData(p => ({ ...p, molarMass: parseFloat(v) || null }))} type="number" /></td>
                      <td className="px-3 py-1"><EditCell value={editData.nFactor?.toString() || ''} onChange={(v) => setEditData(p => ({ ...p, nFactor: parseFloat(v) || null }))} type="number" /></td>
                      <td className="px-3 py-1"><EditCell value={editData.purity || ''} onChange={(v) => setEditData(p => ({ ...p, purity: v, purityValue: parseFloat(v) || null }))} /></td>
                      <td className="px-3 py-1"><EditCell value={editData.density?.toString() || ''} onChange={(v) => setEditData(p => ({ ...p, density: parseFloat(v) || null }))} type="number" /></td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={saveEdit} className="p-1 text-primary hover:bg-primary/10 rounded"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditId(null)} className="p-1 text-muted-foreground hover:bg-secondary rounded"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-muted-foreground">{c.srNo}</td>
                      <td className="px-3 py-2 font-medium text-foreground">{c.name}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{c.formula}</td>
                      <td className="px-3 py-2 text-right font-mono">{c.molarMass ?? '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{c.nFactor ?? '—'}</td>
                      <td className="px-3 py-2">{c.purity || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{c.density ?? '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEdit(c)} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(c.srNo)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EditInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-input border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary" />
    </div>
  );
}

function EditCell({ value, onChange, type = 'text' }: { value: string; onChange: (v: string) => void; type?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-input border border-border rounded px-1.5 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary" />;
}
