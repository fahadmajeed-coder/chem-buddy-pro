import { useState, useRef } from 'react';
import { Search, BookOpen, FlaskConical, Beaker, ChevronDown, ChevronRight, Lock, Unlock, Plus, FileUp, Printer, Download, X, Trash2, Save, TestTubes, GripVertical, ArrowUp, ArrowDown, FolderPlus } from 'lucide-react';
import { SOP_DATA, type SOPEntry } from '@/lib/sopData';
import { SOP_FORMULAS, sopFormulaToSavedFormula } from '@/lib/sopFormulas';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { SectionCloudSync } from './SectionCloudSync';

export function SOPSection() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customSOPs, setCustomSOPs] = useLocalStorage<SOPEntry[]>('chemanalyst-custom-sops', []);
  const [editedSOPs, setEditedSOPs] = useLocalStorage<Record<string, Partial<SOPEntry>>>('chemanalyst-edited-sops', {});
  const [customSections, setCustomSections] = useLocalStorage<string[]>('chemanalyst-sop-sections', []);
  const [sectionOrder, setSectionOrder] = useLocalStorage<string[]>('chemanalyst-sop-section-order', []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [sopOrder, setSopOrder] = useLocalStorage<string[]>('chemanalyst-sop-order', []);
  // Section drag state
  const [dragSection, setDragSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const allSOPs: SOPEntry[] = [
    ...SOP_DATA.map(sop => ({ ...sop, ...(editedSOPs[sop.id] || {}) })),
    ...customSOPs,
  ];

  // Apply custom ordering
  const orderedSOPs = sopOrder.length > 0
    ? [...sopOrder.map(id => allSOPs.find(s => s.id === id)).filter(Boolean) as SOPEntry[], ...allSOPs.filter(s => !sopOrder.includes(s.id))]
    : allSOPs;

  const rawCategories = [...new Set([...orderedSOPs.map(s => s.category), ...customSections])];
  // Apply section ordering
  const allCategories = sectionOrder.length > 0
    ? [...sectionOrder.filter(c => rawCategories.includes(c)), ...rawCategories.filter(c => !sectionOrder.includes(c))]
    : rawCategories;

  const filtered = orderedSOPs.filter(sop =>
    sop.name.toLowerCase().includes(search.toLowerCase()) ||
    sop.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  const handleEditSOP = (id: string, updates: Partial<SOPEntry>) => {
    const isCustom = customSOPs.some(s => s.id === id);
    if (isCustom) {
      setCustomSOPs(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } else {
      setEditedSOPs(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...updates } }));
    }
  };

  const handleDeleteSOP = (id: string) => {
    setCustomSOPs(prev => prev.filter(s => s.id !== id));
    toast({ title: 'SOP Deleted', description: 'Custom SOP has been removed.' });
  };

  const handleUseInAnalytical = (sopId: string) => {
    const formulaDef = SOP_FORMULAS.find(f => f.sopId === sopId);
    if (!formulaDef) {
      toast({ title: 'No Formula', description: 'This SOP does not have a calculable formula defined yet.', variant: 'destructive' });
      return;
    }
    const savedFormula = sopFormulaToSavedFormula(formulaDef);
    try {
      const existing = JSON.parse(localStorage.getItem('chem-formulas-v2') || '[]');
      if (existing.some((f: { id: string }) => f.id === savedFormula.id)) {
        toast({ title: 'Already Added', description: `"${formulaDef.name}" formula is already in your formulas list.` });
        return;
      }
      existing.push(savedFormula);
      localStorage.setItem('chem-formulas-v2', JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: 'chem-formulas-v2' } }));
      toast({ title: 'Formula Added!', description: `"${formulaDef.name}" is now available in Analytical Test section.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to add formula.', variant: 'destructive' });
    }
  };

  const handleAddSOP = (sop: SOPEntry) => {
    setCustomSOPs(prev => [...prev, sop]);
    setShowAddForm(false);
    toast({ title: 'SOP Added', description: `"${sop.name}" has been added.` });
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    if (allCategories.includes(newSectionName.trim())) {
      toast({ title: 'Already exists', description: 'This section already exists.', variant: 'destructive' });
      return;
    }
    setCustomSections(prev => [...prev, newSectionName.trim()]);
    setNewSectionName('');
    setShowAddSection(false);
    toast({ title: 'Section Added', description: `"${newSectionName}" section created.` });
  };

  const handleDeleteSection = (cat: string) => {
    if (!customSections.includes(cat)) return;
    setCustomSections(prev => prev.filter(c => c !== cat));
    setSectionOrder(prev => prev.filter(c => c !== cat));
    toast({ title: 'Section Removed' });
  };

  const handleImportPDF = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast({ title: 'Invalid File', description: 'Please select a PDF file.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const newSOP: SOPEntry = {
        id: `imported-${Date.now()}`, name: file.name.replace('.pdf', '').replace(/_/g, ' '),
        category: 'Imported', procedure: ['Imported from PDF. Please edit the procedure steps manually.'],
        principle: 'Imported from: ' + file.name,
      };
      setCustomSOPs(prev => [...prev, newSOP]);
      toast({ title: 'PDF Imported', description: `Created SOP placeholder from "${file.name}".` });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportAll = () => {
    const data = JSON.stringify(allSOPs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'SOPs_Export.json'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'All SOPs exported as JSON.' });
  };

  const handlePrint = (sop?: SOPEntry) => {
    const target = sop ? [sop] : filtered;
    const html = target.map(s => `
      <div style="page-break-after:always;font-family:Arial,sans-serif;padding:20px;">
        <h1 style="color:#1a1a2e;border-bottom:2px solid #0f3460;padding-bottom:8px;">${s.name}</h1>
        <p style="color:#888;font-size:12px;">Category: ${s.category}</p>
        ${s.principle ? `<h3>Principle</h3><p>${s.principle}</p>` : ''}
        ${s.apparatus?.length ? `<h3>Apparatus</h3><ul>${s.apparatus.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
        ${s.reagents?.length ? `<h3>Reagents</h3><ul>${s.reagents.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
        ${s.reagentPreparation?.length ? `<h3>Reagent Preparation</h3>${s.reagentPreparation.map(rp => `<p><strong>${rp.name}</strong></p><ol>${rp.steps.map(st => `<li>${st}</li>`).join('')}</ol>`).join('')}` : ''}
        <h3>Procedure</h3><ol>${s.procedure.map(p => `<li style="margin-bottom:4px;">${p}</li>`).join('')}</ol>
        ${s.calculations ? `<h3>Calculations</h3><pre style="background:#f5f5f5;padding:12px;border-radius:4px;">${s.calculations}</pre>` : ''}
        ${s.resultInterpretation ? `<h3>Result Interpretation</h3><pre style="white-space:pre-wrap;">${s.resultInterpretation}</pre>` : ''}
      </div>
    `).join('');
    const win = window.open('', '_blank');
    if (win) { win.document.write(`<html><head><title>SOP</title></head><body>${html}</body></html>`); win.document.close(); win.print(); }
  };

  // Drag and drop for SOP ordering
  const handleDragStart = (id: string) => setDragItem(id);
  const handleDragEnter = (id: string) => setDragOverItem(id);
  const handleDragEnd = () => {
    if (dragItem && dragOverItem && dragItem !== dragOverItem) {
      const currentOrder = sopOrder.length > 0 ? sopOrder : allSOPs.map(s => s.id);
      const fromIdx = currentOrder.indexOf(dragItem);
      const toIdx = currentOrder.indexOf(dragOverItem);
      if (fromIdx >= 0 && toIdx >= 0) {
        const newOrder = [...currentOrder];
        const [removed] = newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, removed);
        setSopOrder(newOrder);
      }
    }
    setDragItem(null);
    setDragOverItem(null);
  };

  const moveSOP = (id: string, direction: 'up' | 'down') => {
    const currentOrder = sopOrder.length > 0 ? [...sopOrder] : allSOPs.map(s => s.id);
    const idx = currentOrder.indexOf(id);
    if (idx < 0) return;
    if (direction === 'up' && idx > 0) {
      [currentOrder[idx - 1], currentOrder[idx]] = [currentOrder[idx], currentOrder[idx - 1]];
    } else if (direction === 'down' && idx < currentOrder.length - 1) {
      [currentOrder[idx], currentOrder[idx + 1]] = [currentOrder[idx + 1], currentOrder[idx]];
    }
    setSopOrder(currentOrder);
  };

  // Section drag
  const handleSectionDragStart = (cat: string) => setDragSection(cat);
  const handleSectionDragEnter = (cat: string) => setDragOverSection(cat);
  const handleSectionDragEnd = () => {
    if (dragSection && dragOverSection && dragSection !== dragOverSection) {
      const currentOrder = sectionOrder.length > 0 ? [...sectionOrder] : [...allCategories];
      const fromIdx = currentOrder.indexOf(dragSection);
      const toIdx = currentOrder.indexOf(dragOverSection);
      if (fromIdx >= 0 && toIdx >= 0) {
        const [removed] = currentOrder.splice(fromIdx, 1);
        currentOrder.splice(toIdx, 0, removed);
        setSectionOrder(currentOrder);
      } else {
        // section not in order yet, insert it
        const newOrder = [...allCategories];
        const fi = newOrder.indexOf(dragSection);
        const ti = newOrder.indexOf(dragOverSection);
        if (fi >= 0 && ti >= 0) {
          const [rem] = newOrder.splice(fi, 1);
          newOrder.splice(ti, 0, rem);
          setSectionOrder(newOrder);
        }
      }
    }
    setDragSection(null);
    setDragOverSection(null);
  };

  const moveSectionDir = (cat: string, dir: 'up' | 'down') => {
    const currentOrder = sectionOrder.length > 0 ? [...sectionOrder] : [...allCategories];
    const idx = currentOrder.indexOf(cat);
    if (idx < 0) {
      // not yet in order
      const fullOrder = [...allCategories];
      const fi = fullOrder.indexOf(cat);
      if (dir === 'up' && fi > 0) { [fullOrder[fi - 1], fullOrder[fi]] = [fullOrder[fi], fullOrder[fi - 1]]; }
      else if (dir === 'down' && fi < fullOrder.length - 1) { [fullOrder[fi], fullOrder[fi + 1]] = [fullOrder[fi + 1], fullOrder[fi]]; }
      setSectionOrder(fullOrder);
      return;
    }
    if (dir === 'up' && idx > 0) { [currentOrder[idx - 1], currentOrder[idx]] = [currentOrder[idx], currentOrder[idx - 1]]; }
    else if (dir === 'down' && idx < currentOrder.length - 1) { [currentOrder[idx], currentOrder[idx + 1]] = [currentOrder[idx + 1], currentOrder[idx]]; }
    setSectionOrder(currentOrder);
  };

  return (
    <div className="space-y-6">
      <SectionCloudSync sectionKey="chemanalyst-custom-sops" label="Custom SOPs" isAdmin={true} />
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search SOPs..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
        </div>
        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add SOP
        </button>
        <button onClick={() => setShowAddSection(true)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors">
          <FolderPlus className="w-3.5 h-3.5" /> Add Section
        </button>
        <button onClick={handleImportPDF} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-accent transition-colors">
          <FileUp className="w-3.5 h-3.5" /> Import PDF
        </button>
        <button onClick={handleExportAll} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-accent transition-colors">
          <Download className="w-3.5 h-3.5" /> Export JSON
        </button>
        <button onClick={() => handlePrint()} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-accent transition-colors">
          <Printer className="w-3.5 h-3.5" /> Print All
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Add Section Dialog */}
      {showAddSection && (
        <div className="border border-primary/30 rounded-lg bg-card p-4 flex items-center gap-3">
          <FolderPlus className="w-4 h-4 text-primary shrink-0" />
          <input value={newSectionName} onChange={e => setNewSectionName(e.target.value)}
            placeholder="New section name" className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={e => e.key === 'Enter' && handleAddSection()} autoFocus />
          <button onClick={handleAddSection} disabled={!newSectionName.trim()} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40">Add</button>
          <button onClick={() => { setShowAddSection(false); setNewSectionName(''); }} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {filtered.length} SOPs</span>
        <span className="flex items-center gap-1"><FlaskConical className="w-3.5 h-3.5" /> {allCategories.length} categories</span>
        {customSOPs.length > 0 && <span className="text-primary font-medium">{customSOPs.length} custom</span>}
      </div>

      {/* Add SOP Form */}
      {showAddForm && <AddSOPForm onAdd={handleAddSOP} onCancel={() => setShowAddForm(false)} categories={allCategories} />}

      {/* Results grouped by category with drag-drop sections */}
      {allCategories.map((cat, catIdx) => {
        const catSOPs = filtered.filter(s => s.category === cat);
        if (catSOPs.length === 0 && !customSections.includes(cat)) return null;
        return (
          <div key={cat}
            draggable
            onDragStart={() => handleSectionDragStart(cat)}
            onDragEnter={() => handleSectionDragEnter(cat)}
            onDragEnd={handleSectionDragEnd}
            onDragOver={e => e.preventDefault()}
            className={`space-y-2 ${dragOverSection === cat ? 'border-t-2 border-primary rounded-t' : 'border-t-2 border-transparent'}`}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 cursor-grab shrink-0" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-primary flex items-center gap-2 flex-1">
                <Beaker className="w-3.5 h-3.5" /> {cat}
                {customSections.includes(cat) && catSOPs.length === 0 && (
                  <span className="text-[9px] text-muted-foreground normal-case font-normal">(empty section)</span>
                )}
              </h3>
              <div className="flex items-center gap-0.5">
                <button onClick={() => moveSectionDir(cat, 'up')} disabled={catIdx === 0}
                  className="p-0.5 text-muted-foreground/40 hover:text-primary disabled:opacity-20 transition-colors">
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button onClick={() => moveSectionDir(cat, 'down')} disabled={catIdx === allCategories.length - 1}
                  className="p-0.5 text-muted-foreground/40 hover:text-primary disabled:opacity-20 transition-colors">
                  <ArrowDown className="w-3 h-3" />
                </button>
                {customSections.includes(cat) && (
                  <button onClick={() => handleDeleteSection(cat)}
                    className="p-0.5 text-muted-foreground/30 hover:text-destructive transition-colors ml-1" title="Remove section">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              {catSOPs.map((sop) => {
                const hasFormula = SOP_FORMULAS.some(f => f.sopId === sop.id);
                return (
                  <div key={sop.id}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); handleDragStart(sop.id); }}
                    onDragEnter={(e) => { e.stopPropagation(); handleDragEnter(sop.id); }}
                    onDragEnd={(e) => { e.stopPropagation(); handleDragEnd(); }}
                    onDragOver={e => e.preventDefault()}
                    className={`${dragOverItem === sop.id ? 'border-t-2 border-primary' : ''}`}
                  >
                    <SOPCard
                      sop={sop}
                      expanded={expandedId === sop.id}
                      onToggle={() => toggle(sop.id)}
                      onEdit={(updates) => handleEditSOP(sop.id, updates)}
                      onPrint={() => handlePrint(sop)}
                      isCustom={customSOPs.some(s => s.id === sop.id)}
                      onDelete={() => handleDeleteSOP(sop.id)}
                      hasFormula={hasFormula}
                      onUseInAnalytical={() => handleUseInAnalytical(sop.id)}
                      onMoveUp={() => moveSOP(sop.id, 'up')}
                      onMoveDown={() => moveSOP(sop.id, 'down')}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No SOPs found for "{search}"</p>
        </div>
      )}
    </div>
  );
}

/* ---- Add SOP Form ---- */
function AddSOPForm({ onAdd, onCancel, categories }: { onAdd: (sop: SOPEntry) => void; onCancel: () => void; categories: string[] }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCat, setCustomCat] = useState('');
  const [principle, setPrinciple] = useState('');
  const [procedure, setProcedure] = useState('');
  const [calculations, setCalculations] = useState('');
  const [apparatus, setApparatus] = useState('');
  const [reagents, setReagents] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !procedure.trim()) return;
    const finalCat = customCat.trim() || category || 'Uncategorized';
    onAdd({
      id: `custom-${Date.now()}`, name: name.trim(), category: finalCat,
      principle: principle.trim() || undefined,
      apparatus: apparatus.trim() ? apparatus.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
      reagents: reagents.trim() ? reagents.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
      procedure: procedure.split('\n').map(s => s.trim()).filter(Boolean),
      calculations: calculations.trim() || undefined,
    });
  };

  return (
    <div className="border border-primary/30 rounded-lg bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add New SOP</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FieldInput label="Test Name *" value={name} onChange={setName} placeholder="e.g. Salt Purity Test" />
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Select or type new below</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={customCat} onChange={e => setCustomCat(e.target.value)} placeholder="Or type new category" className="w-full bg-input border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>
      <FieldTextarea label="Principle" value={principle} onChange={setPrinciple} placeholder="Describe the scientific principle..." rows={2} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FieldTextarea label="Apparatus (one per line)" value={apparatus} onChange={setApparatus} placeholder="Beaker&#10;Weighing balance&#10;..." rows={3} />
        <FieldTextarea label="Reagents (one per line)" value={reagents} onChange={setReagents} placeholder="10% H₂SO₄&#10;0.1N NaOH&#10;..." rows={3} />
      </div>
      <FieldTextarea label="Procedure Steps * (one per line)" value={procedure} onChange={setProcedure} placeholder="Step 1...&#10;Step 2...&#10;Step 3..." rows={5} />
      <FieldTextarea label="Calculations" value={calculations} onChange={setCalculations} placeholder="Formula or calculation..." rows={2} />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-xs rounded-md border border-border text-muted-foreground hover:bg-accent transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={!name.trim() || !procedure.trim()} className="px-4 py-2 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" /> Save SOP
        </button>
      </div>
    </div>
  );
}

/* ---- SOP Card ---- */
function SOPCard({ sop, expanded, onToggle, onEdit, onPrint, isCustom, onDelete, hasFormula, onUseInAnalytical, onMoveUp, onMoveDown }: {
  sop: SOPEntry; expanded: boolean; onToggle: () => void;
  onEdit: (updates: Partial<SOPEntry>) => void; onPrint: () => void;
  isCustom: boolean; onDelete: () => void;
  hasFormula: boolean; onUseInAnalytical: () => void;
  onMoveUp: () => void; onMoveDown: () => void;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState('');
  const [editingPrinciple, setEditingPrinciple] = useState('');
  const [editingCalcs, setEditingCalcs] = useState('');
  const [editingResult, setEditingResult] = useState('');

  const startEdit = () => {
    setEditingProcedure(sop.procedure.join('\n'));
    setEditingPrinciple(sop.principle || '');
    setEditingCalcs(sop.calculations || '');
    setEditingResult(sop.resultInterpretation || '');
    setUnlocked(true);
  };

  const saveEdit = () => {
    onEdit({
      procedure: editingProcedure.split('\n').map(s => s.trim()).filter(Boolean),
      principle: editingPrinciple.trim() || undefined,
      calculations: editingCalcs.trim() || undefined,
      resultInterpretation: editingResult.trim() || undefined,
    });
    setUnlocked(false);
  };

  return (
    <div className={`border rounded-lg bg-card overflow-hidden transition-colors ${unlocked ? 'border-primary/50' : 'border-border'}`}>
      <div className="flex items-center">
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors">
          <GripVertical className="w-3 h-3 text-muted-foreground/40 cursor-grab shrink-0" />
          {expanded ? <ChevronDown className="w-4 h-4 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
          <span className="text-sm font-medium text-foreground flex-1">{sop.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{sop.category}</span>
        </button>
        {expanded && (
          <div className="flex items-center gap-1 pr-3">
            <button onClick={onMoveUp} title="Move up" className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <ArrowUp className="w-3 h-3" />
            </button>
            <button onClick={onMoveDown} title="Move down" className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <ArrowDown className="w-3 h-3" />
            </button>
            {hasFormula && (
              <button onClick={onUseInAnalytical} title="Use formula" className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors">
                <TestTubes className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onPrint} title="Print" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <Printer className="w-3.5 h-3.5" />
            </button>
            {!unlocked ? (
              <button onClick={startEdit} title="Unlock to edit" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <Lock className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={() => setUnlocked(false)} title="Lock" className="p-1.5 rounded hover:bg-accent text-primary transition-colors">
                <Unlock className="w-3.5 h-3.5" />
              </button>
            )}
            {isCustom && (
              <button onClick={onDelete} title="Delete SOP" className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          {unlocked ? (
            <SectionEditable title="Principle">
              <textarea value={editingPrinciple} onChange={e => setEditingPrinciple(e.target.value)} rows={3}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y" />
            </SectionEditable>
          ) : sop.principle ? (
            <SectionDisplay title="Principle">
              <p className="text-sm text-muted-foreground leading-relaxed">{sop.principle}</p>
            </SectionDisplay>
          ) : null}

          {sop.apparatus && sop.apparatus.length > 0 && (
            <SectionDisplay title="Apparatus">
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">{sop.apparatus.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </SectionDisplay>
          )}

          {sop.reagents && sop.reagents.length > 0 && (
            <SectionDisplay title="Reagents">
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">{sop.reagents.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </SectionDisplay>
          )}

          {sop.reagentPreparation && sop.reagentPreparation.length > 0 && (
            <SectionDisplay title="Reagent Preparation">
              {sop.reagentPreparation.map((rp, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs font-semibold text-foreground mb-1">{rp.name}</p>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-0.5 pl-2">{rp.steps.map((s, j) => <li key={j}>{s}</li>)}</ol>
                </div>
              ))}
            </SectionDisplay>
          )}

          {unlocked ? (
            <SectionEditable title="Procedure (one step per line)">
              <textarea value={editingProcedure} onChange={e => setEditingProcedure(e.target.value)} rows={Math.max(5, sop.procedure.length)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y" />
            </SectionEditable>
          ) : (
            <SectionDisplay title="Procedure">
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">{sop.procedure.map((step, i) => <li key={i} className="leading-relaxed">{step}</li>)}</ol>
            </SectionDisplay>
          )}

          {unlocked ? (
            <SectionEditable title="Calculations">
              <textarea value={editingCalcs} onChange={e => setEditingCalcs(e.target.value)} rows={3}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y" />
            </SectionEditable>
          ) : sop.calculations ? (
            <SectionDisplay title="Calculations">
              <pre className="text-sm text-foreground font-mono bg-muted/50 rounded-md p-3 whitespace-pre-wrap">{sop.calculations}</pre>
            </SectionDisplay>
          ) : null}

          {unlocked ? (
            <SectionEditable title="Result Interpretation">
              <textarea value={editingResult} onChange={e => setEditingResult(e.target.value)} rows={2}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y" />
            </SectionEditable>
          ) : sop.resultInterpretation ? (
            <SectionDisplay title="Result Interpretation">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{sop.resultInterpretation}</pre>
            </SectionDisplay>
          ) : null}

          {unlocked && (
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => setUnlocked(false)} className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:bg-accent transition-colors">Cancel</button>
              <button onClick={saveEdit} className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1">
                <Save className="w-3 h-3" /> Save Changes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Helpers ---- */
function SectionDisplay({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div><h4 className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-1.5">{title}</h4>{children}</div>);
}

function SectionEditable({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div><h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1"><Unlock className="w-3 h-3" /> {title}</h4>{children}</div>);
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary resize-y transition-all" />
    </div>
  );
}
