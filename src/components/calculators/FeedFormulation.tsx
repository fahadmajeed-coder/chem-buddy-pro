import { useState, useMemo } from 'react';
import { Plus, Trash2, Search, ChevronDown, ChevronUp, Save, FileDown, Beaker, Target, BarChart3, AlertTriangle, Calculator, Undo2, X, Copy, CheckSquare } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SectionCloudSync } from './SectionCloudSync';
import { toast } from 'sonner';
import type { SavedStandard } from './StandardsSection';

interface Ingredient {
  id: string;
  name: string;
  percentage: number;
  contributions: Record<string, number>;
  linkedStandardId?: string;
}

interface FormulationTemplate {
  id: string;
  name: string;
  standardId: string;
  standardName: string;
  targetParams: string[];
  ingredients: Ingredient[];
  createdAt: number;
}

interface TrashItem {
  formulation: FormulationTemplate;
  deletedAt: number;
}

export function FeedFormulation({ isAdmin = false }: { isAdmin?: boolean }) {
  const [savedStandards] = useLocalStorage<SavedStandard[]>('chemanalyst-standards', []);
  const [formulations, setFormulations] = useLocalStorage<FormulationTemplate[]>('chemanalyst-formulations', []);
  const [trash, setTrash] = useLocalStorage<TrashItem[]>('chemanalyst-formulations-trash', []);

  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [formulationName, setFormulationName] = useState('');
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showSubEntries, setShowSubEntries] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState<number>(0);
  const [showTrash, setShowTrash] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; name: string } | null>(null);
  const [batchCalcId, setBatchCalcId] = useState<string | null>(null);
  const [batchCalcSize, setBatchCalcSize] = useState<number>(0);
  const [trashSelected, setTrashSelected] = useState<Set<string>>(new Set());

  const rawMaterialStandards = savedStandards.filter(s => (s.type || 'raw-material') === 'raw-material');
  const formulationStandards = savedStandards.filter(s => (s.type || 'raw-material') === 'formulation');

  const selectedStandard = savedStandards.find(s => s.id === selectedStandardId);
  const paramNames = selectedStandard?.parameters.map(p => p.analysis).filter(Boolean) || [];

  const linkIngredientToStandard = (ingredientId: string, standardId: string) => {
    const std = rawMaterialStandards.find(s => s.id === standardId);
    if (!std) return;
    setIngredients(prev => prev.map(ing => {
      if (ing.id !== ingredientId) return ing;
      const contributions: Record<string, number> = { ...ing.contributions };
      std.parameters.forEach(p => {
        if (selectedParams.includes(p.analysis)) {
          const val = parseFloat(p.standard) || parseFloat(p.max) || parseFloat(p.normalMax) || 0;
          contributions[p.analysis] = val;
        }
      });
      return { ...ing, name: std.name, linkedStandardId: standardId, contributions };
    }));
    toast.success(`Linked "${std.name}" data`);
  };

  const addIngredient = () => {
    setIngredients(prev => [...prev, {
      id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
      name: '', percentage: 0, contributions: {},
    }]);
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const updateIngredientContribution = (id: string, param: string, value: number) => {
    setIngredients(prev => prev.map(i =>
      i.id === id ? { ...i, contributions: { ...i.contributions, [param]: value } } : i
    ));
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const toggleParam = (param: string) => {
    setSelectedParams(prev =>
      prev.includes(param) ? prev.filter(p => p !== param) : [...prev, param]
    );
  };

  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    selectedParams.forEach(param => {
      let total = 0;
      ingredients.forEach(ing => {
        const nutrientPct = ing.contributions[param] || 0;
        const inclusionPct = ing.percentage || 0;
        total += (nutrientPct * inclusionPct) / 100;
      });
      result[param] = total;
    });
    result['_totalInclusion'] = ingredients.reduce((s, i) => s + (i.percentage || 0), 0);
    return result;
  }, [ingredients, selectedParams]);

  const batchQuantities = useMemo(() => {
    if (!batchSize || batchSize <= 0) return {};
    const result: Record<string, number> = {};
    ingredients.forEach(ing => {
      if (ing.name.trim()) result[ing.id] = (ing.percentage / 100) * batchSize;
    });
    return result;
  }, [ingredients, batchSize]);

  const getParamStatus = (param: string): 'pass' | 'warn' | 'fail' | 'none' => {
    if (!selectedStandard) return 'none';
    const p = selectedStandard.parameters.find(pp => pp.analysis === param);
    if (!p) return 'none';
    const val = totals[param] || 0;
    const min = parseFloat(p.min) || 0;
    const max = parseFloat(p.max) || Infinity;
    if (val >= min && val <= max) return 'pass';
    const wdMin = parseFloat(p.withDeductionMin || '') || 0;
    const wdMax = parseFloat(p.withDeductionMax || '') || Infinity;
    if (val >= wdMin && val <= wdMax) return 'warn';
    return 'fail';
  };

  const saveFormulation = () => {
    if (!formulationName.trim() || !selectedStandardId) return;
    setConfirmAction({ type: 'save', id: editingFormId || 'new', name: formulationName });
  };

  const confirmSave = () => {
    const form: FormulationTemplate = {
      id: editingFormId || `form-${Date.now()}`,
      name: formulationName.trim(),
      standardId: selectedStandardId!,
      standardName: selectedStandard?.name || '',
      targetParams: [...selectedParams],
      ingredients: ingredients.filter(i => i.name.trim()),
      createdAt: editingFormId ? (formulations.find(f => f.id === editingFormId)?.createdAt || Date.now()) : Date.now(),
    };
    if (editingFormId) {
      setFormulations(prev => prev.map(f => f.id === editingFormId ? form : f));
    } else {
      setFormulations(prev => [form, ...prev]);
    }
    resetForm();
    setConfirmAction(null);
    toast.success('Formulation saved');
  };

  const saveAsCopy = () => {
    if (!formulationName.trim() || !selectedStandardId) return;
    const form: FormulationTemplate = {
      id: `form-${Date.now()}`,
      name: formulationName.trim() + ' (Copy)',
      standardId: selectedStandardId!,
      standardName: selectedStandard?.name || '',
      targetParams: [...selectedParams],
      ingredients: ingredients.filter(i => i.name.trim()),
      createdAt: Date.now(),
    };
    setFormulations(prev => [form, ...prev]);
    resetForm();
    toast.success('Saved as new copy');
  };

  const loadFormulation = (f: FormulationTemplate) => {
    setFormulationName(f.name);
    setSelectedStandardId(f.standardId);
    setSelectedParams(f.targetParams);
    setIngredients(f.ingredients.map(i => ({ ...i, id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 4)}` })));
    setEditingFormId(f.id);
  };

  const deleteFormulation = (id: string) => {
    const f = formulations.find(ff => ff.id === id);
    setConfirmAction({ type: 'delete', id, name: f?.name || '' });
  };

  const confirmDelete = () => {
    if (!confirmAction) return;
    const f = formulations.find(ff => ff.id === confirmAction.id);
    if (f) setTrash(prev => [{ formulation: f, deletedAt: Date.now() }, ...prev]);
    setFormulations(prev => prev.filter(ff => ff.id !== confirmAction.id));
    if (editingFormId === confirmAction.id) resetForm();
    toast.success(`"${confirmAction.name}" moved to trash`);
    setConfirmAction(null);
  };

  const restoreFromTrash = (item: TrashItem) => {
    setFormulations(prev => [item.formulation, ...prev]);
    setTrash(prev => prev.filter(t => t.formulation.id !== item.formulation.id));
    toast.success('Restored');
  };

  const resetForm = () => {
    setFormulationName('');
    setSelectedParams([]);
    setIngredients([]);
    setEditingFormId(null);
    setBatchSize(0);
  };

  const filteredFormulations = search
    ? formulations.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.standardName.toLowerCase().includes(search.toLowerCase()))
    : formulations;

  const getParamSubData = (param: string) => {
    if (!selectedStandard) return null;
    const p = selectedStandard.parameters.find(pp => pp.analysis === param);
    if (!p) return null;
    const groups = p.subGroups || [];
    const subs = p.subEntries || [];
    if (groups.length === 0 && subs.length === 0) return null;
    return { groups, subs };
  };

  const getIngredientSubData = (ing: Ingredient, param: string) => {
    if (!ing.linkedStandardId) return null;
    const std = rawMaterialStandards.find(s => s.id === ing.linkedStandardId);
    if (!std) return null;
    const p = std.parameters.find(pp => pp.analysis === param);
    if (!p) return null;
    const groups = p.subGroups || [];
    const subs = p.subEntries || [];
    if (groups.length === 0 && subs.length === 0) return null;
    return { groups, subs, inclusionPct: ing.percentage };
  };

  // Compute saved formulation totals
  const getSavedFormTotals = (f: FormulationTemplate) => {
    const result: Record<string, number> = {};
    f.targetParams.forEach(param => {
      let total = 0;
      f.ingredients.forEach(ing => {
        const nutrientPct = ing.contributions[param] || 0;
        const inclusionPct = ing.percentage || 0;
        total += (nutrientPct * inclusionPct) / 100;
      });
      result[param] = total;
    });
    result['_totalInclusion'] = f.ingredients.reduce((s, i) => s + (i.percentage || 0), 0);
    return result;
  };

  const batchCalcForm = batchCalcId ? formulations.find(f => f.id === batchCalcId) : null;
  const savedBatchQty = useMemo(() => {
    if (!batchCalcForm || !batchCalcSize) return {};
    const r: Record<string, number> = {};
    batchCalcForm.ingredients.forEach(i => {
      if (i.name.trim()) r[i.id] = (i.percentage / 100) * batchCalcSize;
    });
    return r;
  }, [batchCalcForm, batchCalcSize]);

  const toggleTrashSelect = (id: string) => {
    setTrashSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllTrash = () => {
    if (trashSelected.size === trash.length) setTrashSelected(new Set());
    else setTrashSelected(new Set(trash.map(t => t.formulation.id)));
  };

  const restoreSelectedTrash = () => {
    const selected = trash.filter(t => trashSelected.has(t.formulation.id));
    setFormulations(prev => [...selected.map(t => t.formulation), ...prev]);
    setTrash(prev => prev.filter(t => !trashSelected.has(t.formulation.id)));
    setTrashSelected(new Set());
    toast.success(`${selected.length} items restored`);
  };

  const deleteSelectedTrash = () => {
    setTrash(prev => prev.filter(t => !trashSelected.has(t.formulation.id)));
    setTrashSelected(new Set());
    toast.success('Permanently deleted');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionCloudSync sectionKey="chemanalyst-formulations" label="Formulations" isAdmin={isAdmin} />

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Confirm {confirmAction.type === 'save' ? 'Save' : 'Delete'}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {confirmAction.type === 'save' ? `Save "${confirmAction.name}"?` : `Delete "${confirmAction.name}"? It will be moved to trash.`}
            </p>
            <div className="flex gap-2">
              <button onClick={confirmAction.type === 'save' ? confirmSave : confirmDelete}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${confirmAction.type === 'delete' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
                {confirmAction.type === 'save' ? 'Save' : 'Delete'}
              </button>
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Select Formulation Standard */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-border">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Step 1 — Select Formulation Standard & Parameters</h3>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Formulation Name *</label>
              <input value={formulationName} onChange={e => setFormulationName(e.target.value)}
                placeholder="e.g. Poultry Feed Layer-1"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Formulation Standard *</label>
              <select value={selectedStandardId || ''} onChange={e => { setSelectedStandardId(e.target.value || null); setSelectedParams([]); }}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select a formulation standard...</option>
                {formulationStandards.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.parameters.length} params)</option>
                ))}
                {formulationStandards.length === 0 && savedStandards.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.parameters.length} params)</option>
                ))}
              </select>
            </div>
          </div>

          {selectedStandard && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 block">Select Parameters to Optimize</label>
              <div className="flex flex-wrap gap-2">
                {paramNames.map(param => (
                  <button key={param} onClick={() => toggleParam(param)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                      selectedParams.includes(param) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
                    }`}>
                    {param}
                    {getParamSubData(param) && <span className="ml-1 text-[9px] opacity-70">📋</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Add Ingredients */}
      {selectedStandard && selectedParams.length > 0 && (
        <div className="glass-panel rounded-lg">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Step 2 — Add Ingredients</h3>
            </div>
            <button onClick={addIngredient} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors">
              <Plus className="w-3 h-3" /> Add Ingredient
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: '600px' }}>
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Ingredient</th>
                  <th className="text-center py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">%</th>
                  {selectedParams.map(param => (
                    <th key={param} className="text-center py-2.5 px-2 text-xs font-medium text-primary uppercase tracking-wider whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{param}</span>
                        {getParamSubData(param) && (
                          <button onClick={() => setShowSubEntries(showSubEntries === param ? null : param)} className="text-[9px] text-primary/60 hover:text-primary underline">specs</button>
                        )}
                      </div>
                    </th>
                  ))}
                  {batchSize > 0 && <th className="text-center py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Kg</th>}
                  <th className="py-2.5 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map(ing => (
                  <tr key={ing.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-1.5 px-3">
                      <div className="flex flex-col gap-1">
                        <select value={ing.linkedStandardId || ''} onChange={e => {
                          if (e.target.value) linkIngredientToStandard(ing.id, e.target.value);
                          else updateIngredient(ing.id, 'linkedStandardId', undefined);
                        }}
                          className="w-36 sm:w-40 bg-input border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                          <option value="">Select raw material...</option>
                          {rawMaterialStandards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input type="text" value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)}
                          placeholder="Or type name" className="w-36 sm:w-40 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <input type="number" value={ing.percentage || ''} onChange={e => updateIngredient(ing.id, 'percentage', parseFloat(e.target.value) || 0)}
                        placeholder="0" className="w-16 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center" />
                    </td>
                    {selectedParams.map(param => (
                      <td key={param} className="py-1.5 px-2">
                        <input type="number" value={ing.contributions[param] || ''} onChange={e => updateIngredientContribution(ing.id, param, parseFloat(e.target.value) || 0)}
                          placeholder="0" className="w-16 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center" />
                      </td>
                    ))}
                    {batchSize > 0 && (
                      <td className="py-1.5 px-2 text-center">
                        <span className="text-xs font-mono text-foreground font-semibold">{(batchQuantities[ing.id] || 0).toFixed(2)}</span>
                      </td>
                    )}
                    <td className="py-1.5 px-2">
                      <button onClick={() => removeIngredient(ing.id)} className="p-1 text-destructive/60 hover:text-destructive rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {ingredients.length === 0 && (
                  <tr><td colSpan={selectedParams.length + 3 + (batchSize > 0 ? 1 : 0)} className="py-6 text-center text-xs text-muted-foreground">
                    Click "Add Ingredient" to start building your formulation
                  </td></tr>
                )}
                {ingredients.length > 0 && (
                  <tr className="border-t-2 border-primary/30 bg-primary/5 font-semibold">
                    <td className="py-2 px-3 text-xs text-foreground">Total</td>
                    <td className={`py-2 px-2 text-xs text-center font-mono ${Math.abs((totals['_totalInclusion'] || 0) - 100) < 0.01 ? 'text-success' : 'text-destructive'}`}>
                      {(totals['_totalInclusion'] || 0).toFixed(2)}%
                    </td>
                    {selectedParams.map(param => {
                      const status = getParamStatus(param);
                      const stdParam = selectedStandard.parameters.find(p => p.analysis === param);
                      return (
                        <td key={param} className="py-2 px-2 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-xs font-mono font-bold ${status === 'pass' ? 'text-success' : status === 'warn' ? 'text-warning' : status === 'fail' ? 'text-destructive' : 'text-foreground'}`}>
                              {(totals[param] || 0).toFixed(2)}%
                            </span>
                            {stdParam && <span className="text-[9px] text-muted-foreground">target: {stdParam.min || '—'}–{stdParam.max || '—'}</span>}
                          </div>
                        </td>
                      );
                    })}
                    {batchSize > 0 && (
                      <td className="py-2 px-2 text-center text-xs font-mono text-foreground font-bold">{batchSize.toFixed(2)} kg</td>
                    )}
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sub-entries comparison */}
          {showSubEntries && (() => {
            const subData = getParamSubData(showSubEntries);
            if (!subData) return null;
            return (
              <div className="mx-3 sm:mx-4 mb-4 rounded-lg border border-primary/20 bg-card shadow-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-primary/10">
                  <span className="text-xs font-semibold text-foreground">Specs for "{showSubEntries}"</span>
                  <button onClick={() => setShowSubEntries(null)} className="p-1 text-muted-foreground hover:text-foreground rounded"><ChevronUp className="w-3.5 h-3.5" /></button>
                </div>
                <div className="p-3 space-y-2">
                  {subData.groups.map(g => (
                    <div key={g.id} className="space-y-1">
                      <span className="text-[10px] font-semibold text-primary/70">{g.heading}</span>
                      {g.entries.map(e => (
                        <div key={e.id} className="flex items-center gap-2 text-xs pl-3">
                          <span className="text-muted-foreground/50">└</span>
                          <span className="text-muted-foreground font-medium w-24">{e.label}</span>
                          <span className="font-mono text-foreground">{e.value}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {subData.subs.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-xs pl-3">
                      <span className="text-muted-foreground/50">└</span>
                      <span className="text-muted-foreground font-medium w-24">{s.label}</span>
                      <span className="font-mono text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
                {ingredients.filter(i => i.linkedStandardId).length > 0 && (
                  <div className="border-t border-primary/10 p-3 space-y-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Ingredient Sub-entries for {showSubEntries}</span>
                    {ingredients.filter(i => i.linkedStandardId && i.name.trim()).map(ing => {
                      const ingSub = getIngredientSubData(ing, showSubEntries!);
                      if (!ingSub) return null;
                      return (
                        <div key={ing.id} className="rounded border border-border/50 p-2 bg-secondary/10">
                          <span className="text-[10px] font-semibold text-foreground">{ing.name} ({ing.percentage}% inclusion)</span>
                          {ingSub.groups.map(g => (
                            <div key={g.id} className="ml-2 mt-1">
                              <span className="text-[9px] font-semibold text-primary/60">{g.heading}</span>
                              {g.entries.map(e => {
                                const contribution = ((parseFloat(e.value) || 0) * ing.percentage / 100);
                                return (
                                  <div key={e.id} className="flex items-center gap-2 text-[10px] pl-2">
                                    <span className="text-muted-foreground">{e.label}:</span>
                                    <span className="font-mono text-foreground">{e.value}%</span>
                                    <span className="text-primary/60">→ {contribution.toFixed(3)}% in formulation</span>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                          {ingSub.subs.map(s => {
                            const contribution = ((parseFloat(s.value) || 0) * ing.percentage / 100);
                            return (
                              <div key={s.id} className="flex items-center gap-2 text-[10px] pl-4">
                                <span className="text-muted-foreground">{s.label}:</span>
                                <span className="font-mono text-foreground">{s.value}%</span>
                                <span className="text-primary/60">→ {contribution.toFixed(3)}%</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Step 3: Summary & Batch Calculator */}
      {ingredients.length > 0 && selectedParams.length > 0 && (
        <div className="glass-panel rounded-lg">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Step 3 — Summary & Batch</h3>
            </div>
            <div className="flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-muted-foreground" />
              <input type="number" value={batchSize || ''} onChange={e => setBatchSize(parseFloat(e.target.value) || 0)}
                placeholder="Batch kg" className="w-24 bg-input border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <span className="text-[10px] text-muted-foreground">kg</span>
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {selectedParams.map(param => {
                const status = getParamStatus(param);
                const stdParam = selectedStandard?.parameters.find(p => p.analysis === param);
                return (
                  <div key={param} className={`rounded-md border p-3 ${status === 'pass' ? 'border-success/30 bg-success/5' : status === 'warn' ? 'border-warning/30 bg-warning/5' : status === 'fail' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-secondary/20'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{param}</span>
                      {status === 'pass' && <span className="text-[9px] text-success font-bold">✓</span>}
                      {status === 'warn' && <AlertTriangle className="w-3 h-3 text-warning" />}
                      {status === 'fail' && <span className="text-[9px] text-destructive font-bold">✗</span>}
                    </div>
                    <p className={`text-lg font-bold font-mono ${status === 'pass' ? 'text-success' : status === 'warn' ? 'text-warning' : status === 'fail' ? 'text-destructive' : 'text-foreground'}`}>
                      {(totals[param] || 0).toFixed(2)}%
                    </p>
                    {stdParam && <p className="text-[9px] text-muted-foreground mt-0.5">Range: {stdParam.min || '—'} – {stdParam.max || '—'}</p>}
                  </div>
                );
              })}
              <div className={`rounded-md border p-3 ${Math.abs((totals['_totalInclusion'] || 0) - 100) < 0.5 ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total %</span>
                <p className={`text-lg font-bold font-mono ${Math.abs((totals['_totalInclusion'] || 0) - 100) < 0.5 ? 'text-success' : 'text-warning'}`}>
                  {(totals['_totalInclusion'] || 0).toFixed(2)}%
                </p>
              </div>
            </div>

            {batchSize > 0 && (
              <div className="rounded-md border border-border p-3 bg-secondary/10">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 block">Batch: {batchSize} kg</span>
                <div className="space-y-1">
                  {ingredients.filter(i => i.name.trim()).map(ing => (
                    <div key={ing.id} className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-medium">{ing.name}</span>
                      <span className="font-mono text-primary font-bold">{(batchQuantities[ing.id] || 0).toFixed(2)} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <button onClick={saveFormulation} disabled={!formulationName.trim() || !selectedStandardId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <Save className="w-4 h-4" /> {editingFormId ? 'Update' : 'Save'}
              </button>
              {editingFormId && (
                <>
                  <button onClick={saveAsCopy} disabled={!formulationName.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                    <Copy className="w-4 h-4" /> Save as Copy
                  </button>
                  <button onClick={resetForm} className="px-4 py-2.5 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80">Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Formulations */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Saved Formulations</h3>
            <span className="text-[10px] text-muted-foreground">{formulations.length} saved</span>
          </div>
          <div className="flex items-center gap-2">
            {trash.length > 0 && (
              <button onClick={() => setShowTrash(!showTrash)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground hover:text-foreground border border-border">
                <Trash2 className="w-3 h-3" /> Trash ({trash.length})
              </button>
            )}
            {formulations.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  className="pl-7 pr-3 py-1 bg-input border border-border rounded-md text-xs text-foreground w-32 sm:w-40 focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            )}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          {formulations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No formulations saved yet.</p>
          ) : (
            <div className="space-y-2">
              {filteredFormulations.map(f => {
                const fTotals = getSavedFormTotals(f);
                return (
                  <div key={f.id} className="rounded-md border border-border hover:border-primary/30 transition-colors overflow-hidden">
                    <div className="flex items-center justify-between px-3 sm:px-4 py-3 cursor-pointer" onClick={() => setExpandedFormId(expandedFormId === f.id ? null : f.id)}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.standardName} • {f.ingredients.length} ingredients</p>
                        {/* Inline totals summary */}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {f.targetParams.slice(0, 4).map(p => (
                            <span key={p} className="text-[9px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                              {p}: {(fTotals[p] || 0).toFixed(1)}%
                            </span>
                          ))}
                          {f.targetParams.length > 4 && <span className="text-[9px] text-muted-foreground">+{f.targetParams.length - 4} more</span>}
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${Math.abs((fTotals['_totalInclusion'] || 0) - 100) < 0.5 ? 'text-success bg-success/5' : 'text-warning bg-warning/5'}`}>
                            Total: {(fTotals['_totalInclusion'] || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <button onClick={ev => { ev.stopPropagation(); loadFormulation(f); }} className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20">Edit</button>
                        <button onClick={ev => { ev.stopPropagation(); setBatchCalcId(batchCalcId === f.id ? null : f.id); }}
                          className={`text-[10px] px-2 py-1 rounded border transition-colors ${batchCalcId === f.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/40'}`}>
                          <Calculator className="w-3 h-3 inline mr-0.5" />Batch
                        </button>
                        <button onClick={ev => { ev.stopPropagation(); deleteFormulation(f.id); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                        {expandedFormId === f.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Batch calc inline */}
                    {batchCalcId === f.id && (
                      <div className="px-3 sm:px-4 py-3 border-t border-border/50 bg-primary/5">
                        <div className="flex items-center gap-3 mb-2">
                          <Calculator className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-foreground">Batch Calculator</span>
                          <input type="number" value={batchCalcSize || ''} onChange={e => setBatchCalcSize(parseFloat(e.target.value) || 0)}
                            placeholder="Enter kg" className="w-28 bg-input border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          <span className="text-[10px] text-muted-foreground">kg</span>
                        </div>
                        {batchCalcSize > 0 && (
                          <div className="space-y-1">
                            {f.ingredients.filter(i => i.name.trim()).map(ing => (
                              <div key={ing.id} className="flex items-center justify-between text-xs">
                                <span className="text-foreground">{ing.name} ({ing.percentage}%)</span>
                                <span className="font-mono text-primary font-bold">{(savedBatchQty[ing.id] || 0).toFixed(2)} kg</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between text-xs font-bold border-t border-border pt-1 mt-1">
                              <span className="text-foreground">Total</span>
                              <span className="font-mono text-foreground">{batchCalcSize.toFixed(2)} kg</span>
                            </div>
                            {/* Show totals per param in batch view */}
                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
                              {f.targetParams.map(p => (
                                <span key={p} className="text-[9px] font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                                  {p}: {(fTotals[p] || 0).toFixed(2)}%
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {expandedFormId === f.id && (
                      <div className="px-3 sm:px-4 pb-3 border-t border-border/50 pt-2">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs" style={{ minWidth: '400px' }}>
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-1 px-2 text-muted-foreground font-medium">Ingredient</th>
                                <th className="text-center py-1 px-2 text-muted-foreground font-medium">%</th>
                                {f.targetParams.map(p => <th key={p} className="text-center py-1 px-2 text-primary font-medium">{p}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {f.ingredients.map(ing => (
                                <tr key={ing.id} className="border-b border-border/30">
                                  <td className="py-1 px-2 font-medium text-foreground">{ing.name}</td>
                                  <td className="py-1 px-2 font-mono text-center text-muted-foreground">{ing.percentage}</td>
                                  {f.targetParams.map(p => <td key={p} className="py-1 px-2 font-mono text-center text-foreground">{ing.contributions[p] || '—'}</td>)}
                                </tr>
                              ))}
                              {/* Totals row */}
                              <tr className="border-t-2 border-primary/30 bg-primary/5 font-bold">
                                <td className="py-1.5 px-2 text-foreground">Total</td>
                                <td className={`py-1.5 px-2 font-mono text-center ${Math.abs((fTotals['_totalInclusion'] || 0) - 100) < 0.5 ? 'text-success' : 'text-warning'}`}>
                                  {(fTotals['_totalInclusion'] || 0).toFixed(2)}%
                                </td>
                                {f.targetParams.map(p => (
                                  <td key={p} className="py-1.5 px-2 font-mono text-center text-primary">
                                    {(fTotals[p] || 0).toFixed(2)}%
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">Saved {new Date(f.createdAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Trash with selective restore */}
      {showTrash && trash.length > 0 && (
        <div className="glass-panel rounded-lg border-destructive/20">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">Trash</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={selectAllTrash} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground border border-border">
                <CheckSquare className="w-3 h-3" /> {trashSelected.size === trash.length ? 'Deselect All' : 'Select All'}
              </button>
              {trashSelected.size > 0 && (
                <>
                  <button onClick={restoreSelectedTrash} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20">
                    <Undo2 className="w-3 h-3" /> Restore ({trashSelected.size})
                  </button>
                  <button onClick={deleteSelectedTrash} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20">
                    <Trash2 className="w-3 h-3" /> Delete ({trashSelected.size})
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-2">
            {trash.map(item => (
              <div key={item.formulation.id} className={`flex items-center justify-between px-3 sm:px-4 py-3 rounded-md border transition-colors ${trashSelected.has(item.formulation.id) ? 'border-primary/40 bg-primary/5' : 'border-border bg-secondary/20'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <input type="checkbox" checked={trashSelected.has(item.formulation.id)} onChange={() => toggleTrashSelect(item.formulation.id)}
                    className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.formulation.name}</p>
                    <p className="text-[10px] text-muted-foreground">Deleted {new Date(item.deletedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => restoreFromTrash(item)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20">
                    <Undo2 className="w-3 h-3" /> Restore
                  </button>
                  <button onClick={() => setTrash(prev => prev.filter(t => t.formulation.id !== item.formulation.id))}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
