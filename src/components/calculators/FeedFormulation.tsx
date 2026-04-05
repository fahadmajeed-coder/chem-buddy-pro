import { useState, useMemo } from 'react';
import { Plus, Trash2, Search, ChevronDown, ChevronUp, Save, FileDown, Beaker, Target, BarChart3, AlertTriangle } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SectionCloudSync } from './SectionCloudSync';

interface SubEntry {
  id: string;
  label: string;
  value: string;
}

interface SubEntryGroup {
  id: string;
  heading: string;
  entries: SubEntry[];
}

interface AnalysisParam {
  id: string;
  analysis: string;
  normalMin: string;
  normalMax: string;
  min: string;
  max: string;
  standard: string;
  withDeductionMin: string;
  withDeductionMax: string;
  outlierMin: string;
  outlierMax: string;
  reason: string;
  customValues: Record<string, string>;
  subEntries: SubEntry[];
  subGroups?: SubEntryGroup[];
  normal?: string;
  withDeduction?: string;
  outlier?: string;
}

interface SavedStandard {
  id: string;
  name: string;
  description: string;
  parameters: AnalysisParam[];
  customColumns: { id: string; header: string }[];
  createdAt: number;
}

interface Ingredient {
  id: string;
  name: string;
  percentage: number; // inclusion %
  contributions: Record<string, number>; // paramName -> nutrient % in this ingredient
}

interface FormulationTemplate {
  id: string;
  name: string;
  standardId: string;
  standardName: string;
  targetParams: string[]; // which parameters to optimize
  ingredients: Ingredient[];
  createdAt: number;
}

export function FeedFormulation({ isAdmin = false }: { isAdmin?: boolean }) {
  const [savedStandards] = useLocalStorage<SavedStandard[]>('chemanalyst-standards', []);
  const [formulations, setFormulations] = useLocalStorage<FormulationTemplate[]>('chemanalyst-formulations', []);

  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [formulationName, setFormulationName] = useState('');
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showSubEntries, setShowSubEntries] = useState<string | null>(null);

  const selectedStandard = savedStandards.find(s => s.id === selectedStandardId);
  const paramNames = selectedStandard?.parameters.map(p => p.analysis).filter(Boolean) || [];

  const addIngredient = () => {
    setIngredients(prev => [...prev, {
      id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`,
      name: '',
      percentage: 0,
      contributions: {},
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

  // Calculate totals
  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    const totalInclusion = ingredients.reduce((s, i) => s + (i.percentage || 0), 0);

    selectedParams.forEach(param => {
      let total = 0;
      ingredients.forEach(ing => {
        const nutrientPct = ing.contributions[param] || 0;
        const inclusionPct = ing.percentage || 0;
        total += (nutrientPct * inclusionPct) / 100;
      });
      result[param] = total;
    });
    result['_totalInclusion'] = totalInclusion;
    return result;
  }, [ingredients, selectedParams]);

  // Compare with standard
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
    const form: FormulationTemplate = {
      id: editingFormId || `form-${Date.now()}`,
      name: formulationName.trim(),
      standardId: selectedStandardId,
      standardName: selectedStandard?.name || '',
      targetParams: [...selectedParams],
      ingredients: ingredients.filter(i => i.name.trim()),
      createdAt: editingFormId
        ? (formulations.find(f => f.id === editingFormId)?.createdAt || Date.now())
        : Date.now(),
    };
    if (editingFormId) {
      setFormulations(prev => prev.map(f => f.id === editingFormId ? form : f));
    } else {
      setFormulations(prev => [form, ...prev]);
    }
    resetForm();
  };

  const loadFormulation = (f: FormulationTemplate) => {
    setFormulationName(f.name);
    setSelectedStandardId(f.standardId);
    setSelectedParams(f.targetParams);
    setIngredients(f.ingredients.map(i => ({ ...i, id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 4)}` })));
    setEditingFormId(f.id);
  };

  const deleteFormulation = (id: string) => {
    setFormulations(prev => prev.filter(f => f.id !== id));
    if (editingFormId === id) resetForm();
  };

  const resetForm = () => {
    setFormulationName('');
    setSelectedParams([]);
    setIngredients([]);
    setEditingFormId(null);
  };

  const filteredFormulations = search
    ? formulations.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.standardName.toLowerCase().includes(search.toLowerCase()))
    : formulations;

  // Get sub-entries for a parameter
  const getParamSubData = (param: string) => {
    if (!selectedStandard) return null;
    const p = selectedStandard.parameters.find(pp => pp.analysis === param);
    if (!p) return null;
    const groups = p.subGroups || [];
    const subs = p.subEntries || [];
    if (groups.length === 0 && subs.length === 0) return null;
    return { groups, subs };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionCloudSync sectionKey="chemanalyst-formulations" label="Formulations" isAdmin={isAdmin} />

      {/* Step 1: Select Standard */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Step 1 — Select Standard & Parameters</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Formulation Name *</label>
              <input
                value={formulationName}
                onChange={e => setFormulationName(e.target.value)}
                placeholder="e.g. Poultry Feed Layer-1"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Standard Template *</label>
              <select
                value={selectedStandardId || ''}
                onChange={e => {
                  setSelectedStandardId(e.target.value || null);
                  setSelectedParams([]);
                }}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a standard...</option>
                {savedStandards.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.parameters.length} params)</option>
                ))}
              </select>
            </div>
          </div>

          {savedStandards.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No standards found. Create standards first in the Standards section.</p>
          )}

          {selectedStandard && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 block">
                Select Parameters to Optimize
              </label>
              <div className="flex flex-wrap gap-2">
                {paramNames.map(param => (
                  <button
                    key={param}
                    onClick={() => toggleParam(param)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                      selectedParams.includes(param)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
                    }`}
                  >
                    {param}
                    {getParamSubData(param) && (
                      <span className="ml-1 text-[9px] opacity-70">📋</span>
                    )}
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
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Step 2 — Add Ingredients</h3>
            </div>
            <button
              onClick={addIngredient}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Ingredient
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Ingredient</th>
                  <th className="text-center py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Inclusion %</th>
                  {selectedParams.map(param => (
                    <th key={param} className="text-center py-2.5 px-2 text-xs font-medium text-primary uppercase tracking-wider whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{param} %</span>
                        {getParamSubData(param) && (
                          <button
                            onClick={() => setShowSubEntries(showSubEntries === param ? null : param)}
                            className="text-[9px] text-primary/60 hover:text-primary underline"
                          >
                            specs
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="py-2.5 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map(ing => (
                  <tr key={ing.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={ing.name}
                        onChange={e => updateIngredient(ing.id, 'name', e.target.value)}
                        placeholder="e.g. PBM, Soybean Meal"
                        className="w-36 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={ing.percentage || ''}
                        onChange={e => updateIngredient(ing.id, 'percentage', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-16 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center"
                      />
                    </td>
                    {selectedParams.map(param => (
                      <td key={param} className="py-1.5 px-2">
                        <input
                          type="number"
                          value={ing.contributions[param] || ''}
                          onChange={e => updateIngredientContribution(ing.id, param, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-16 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center"
                        />
                      </td>
                    ))}
                    <td className="py-1.5 px-2">
                      <button onClick={() => removeIngredient(ing.id)} className="p-1 text-destructive/60 hover:text-destructive rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {ingredients.length === 0 && (
                  <tr>
                    <td colSpan={selectedParams.length + 3} className="py-6 text-center text-xs text-muted-foreground">
                      Click "Add Ingredient" to start building your formulation
                    </td>
                  </tr>
                )}
                {/* Totals row */}
                {ingredients.length > 0 && (
                  <tr className="border-t-2 border-primary/30 bg-primary/5 font-semibold">
                    <td className="py-2 px-3 text-xs text-foreground">Total</td>
                    <td className={`py-2 px-2 text-xs text-center font-mono ${
                      Math.abs((totals['_totalInclusion'] || 0) - 100) < 0.01 ? 'text-success' : 'text-destructive'
                    }`}>
                      {(totals['_totalInclusion'] || 0).toFixed(2)}%
                    </td>
                    {selectedParams.map(param => {
                      const status = getParamStatus(param);
                      const stdParam = selectedStandard.parameters.find(p => p.analysis === param);
                      return (
                        <td key={param} className="py-2 px-2 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-xs font-mono font-bold ${
                              status === 'pass' ? 'text-success' :
                              status === 'warn' ? 'text-warning' :
                              status === 'fail' ? 'text-destructive' : 'text-foreground'
                            }`}>
                              {(totals[param] || 0).toFixed(2)}%
                            </span>
                            {stdParam && (
                              <span className="text-[9px] text-muted-foreground">
                                target: {stdParam.min || '—'}–{stdParam.max || '—'}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sub-entries comparison panel */}
          {showSubEntries && (() => {
            const subData = getParamSubData(showSubEntries);
            if (!subData) return null;
            return (
              <div className="mx-4 mb-4 rounded-lg border border-primary/20 bg-card shadow-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-primary/10">
                  <span className="text-xs font-semibold text-foreground">
                    Specs for "{showSubEntries}"
                  </span>
                  <button onClick={() => setShowSubEntries(null)} className="p-1 text-muted-foreground hover:text-foreground rounded">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
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
              </div>
            );
          })()}
        </div>
      )}

      {/* Step 3: Results Summary */}
      {ingredients.length > 0 && selectedParams.length > 0 && (
        <div className="glass-panel rounded-lg">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 3 — Formulation Summary</h3>
          </div>
          <div className="p-5 space-y-3">
            {/* Status cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {selectedParams.map(param => {
                const status = getParamStatus(param);
                const stdParam = selectedStandard?.parameters.find(p => p.analysis === param);
                return (
                  <div key={param} className={`rounded-md border p-3 ${
                    status === 'pass' ? 'border-success/30 bg-success/5' :
                    status === 'warn' ? 'border-warning/30 bg-warning/5' :
                    status === 'fail' ? 'border-destructive/30 bg-destructive/5' :
                    'border-border bg-secondary/20'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{param}</span>
                      {status === 'pass' && <span className="text-[9px] text-success font-bold">✓ PASS</span>}
                      {status === 'warn' && <AlertTriangle className="w-3 h-3 text-warning" />}
                      {status === 'fail' && <span className="text-[9px] text-destructive font-bold">✗ FAIL</span>}
                    </div>
                    <p className={`text-lg font-bold font-mono ${
                      status === 'pass' ? 'text-success' :
                      status === 'warn' ? 'text-warning' :
                      status === 'fail' ? 'text-destructive' : 'text-foreground'
                    }`}>
                      {(totals[param] || 0).toFixed(2)}%
                    </p>
                    {stdParam && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        Range: {stdParam.min || '—'} – {stdParam.max || '—'}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Total inclusion card */}
              <div className={`rounded-md border p-3 ${
                Math.abs((totals['_totalInclusion'] || 0) - 100) < 0.5 ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total %</span>
                </div>
                <p className={`text-lg font-bold font-mono ${
                  Math.abs((totals['_totalInclusion'] || 0) - 100) < 0.5 ? 'text-success' : 'text-warning'
                }`}>
                  {(totals['_totalInclusion'] || 0).toFixed(2)}%
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Target: 100%</p>
              </div>
            </div>

            {/* Ingredient breakdown */}
            <div className="space-y-1.5 mt-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Ingredient Breakdown</span>
              {ingredients.filter(i => i.name.trim()).map(ing => (
                <div key={ing.id} className="flex items-center gap-3 text-xs">
                  <span className="w-32 text-foreground font-medium truncate">{ing.name}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full transition-all"
                      style={{ width: `${Math.min(ing.percentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground font-mono w-12 text-right">{ing.percentage}%</span>
                </div>
              ))}
            </div>

            {/* Save */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <button
                onClick={saveFormulation}
                disabled={!formulationName.trim() || !selectedStandardId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" /> {editingFormId ? 'Update' : 'Save'} Formulation
              </button>
              {editingFormId && (
                <button onClick={resetForm} className="px-4 py-2.5 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Formulations */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileDown className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Saved Formulations</h3>
            <span className="text-[10px] text-muted-foreground">{formulations.length} saved</span>
          </div>
          {formulations.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-7 pr-3 py-1 bg-input border border-border rounded-md text-xs text-foreground w-40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>
        <div className="p-5">
          {formulations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No formulations saved yet.</p>
          ) : (
            <div className="space-y-2">
              {filteredFormulations.map(f => (
                <div key={f.id} className="rounded-md border border-border hover:border-primary/30 transition-colors overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedFormId(expandedFormId === f.id ? null : f.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.standardName} • {f.ingredients.length} ingredients • {f.targetParams.length} params</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button onClick={ev => { ev.stopPropagation(); loadFormulation(f); }} className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20">
                        Load
                      </button>
                      <button onClick={ev => { ev.stopPropagation(); deleteFormulation(f.id); }} className="p-1.5 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {expandedFormId === f.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedFormId === f.id && (
                    <div className="px-4 pb-3 border-t border-border/50 pt-2">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-1 px-2 text-muted-foreground font-medium">Ingredient</th>
                            <th className="text-center py-1 px-2 text-muted-foreground font-medium">%</th>
                            {f.targetParams.map(p => (
                              <th key={p} className="text-center py-1 px-2 text-primary font-medium">{p}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {f.ingredients.map(ing => (
                            <tr key={ing.id} className="border-b border-border/30">
                              <td className="py-1 px-2 font-medium text-foreground">{ing.name}</td>
                              <td className="py-1 px-2 font-mono text-center text-muted-foreground">{ing.percentage}</td>
                              {f.targetParams.map(p => (
                                <td key={p} className="py-1 px-2 font-mono text-center text-foreground">{ing.contributions[p] || '—'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-[10px] text-muted-foreground mt-2">Saved {new Date(f.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
