import { useState } from 'react';
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Copy, Pencil, Shield, FileText, X, Columns } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SectionCloudSync } from './SectionCloudSync';

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
  // Legacy compat
  normal?: string;
  withDeduction?: string;
  outlier?: string;
}

interface SubEntry {
  id: string;
  label: string;
  value: string;
}

interface CustomStdColumn {
  id: string;
  header: string;
}

interface SavedStandard {
  id: string;
  name: string;
  description: string;
  parameters: AnalysisParam[];
  customColumns: CustomStdColumn[];
  createdAt: number;
}

const DEFAULT_ANALYSES = [
  'Moisture', 'Ash', 'AIA', 'Oil', 'FFA', 'CP', 'TP', 'NPN', 'CF', 'NFE',
  'Ca', 'Phosphorous', 'Calorific Value', 'Chromium test',
];

const emptyParam = (): AnalysisParam => ({
  id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  analysis: '', normalMin: '', normalMax: '', min: '', max: '', standard: '',
  withDeductionMin: '', withDeductionMax: '', outlierMin: '', outlierMax: '', reason: '',
  customValues: {}, subEntries: [],
});

export function StandardsSection() {
  const [savedStandards, setSavedStandards] = useLocalStorage<SavedStandard[]>('chemanalyst-standards', []);
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [parameters, setParameters] = useState<AnalysisParam[]>([emptyParam()]);
  const [customColumns, setCustomColumns] = useState<CustomStdColumn[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());

  const addParam = () => setParameters(prev => [...prev, emptyParam()]);

  const removeParam = (id: string) => {
    if (parameters.length > 1) setParameters(prev => prev.filter(p => p.id !== id));
  };

  const updateParam = (id: string, field: keyof AnalysisParam, value: string) => {
    setParameters(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updateParamCustomValue = (paramId: string, colId: string, value: string) => {
    setParameters(prev => prev.map(p =>
      p.id === paramId ? { ...p, customValues: { ...p.customValues, [colId]: value } } : p
    ));
  };

  const addSubEntry = (paramId: string) => {
    setParameters(prev => prev.map(p =>
      p.id === paramId ? {
        ...p,
        subEntries: [...p.subEntries, { id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 4)}`, label: '', value: '' }]
      } : p
    ));
  };

  const updateSubEntry = (paramId: string, subId: string, field: 'label' | 'value', val: string) => {
    setParameters(prev => prev.map(p =>
      p.id === paramId ? {
        ...p,
        subEntries: p.subEntries.map(s => s.id === subId ? { ...s, [field]: val } : s)
      } : p
    ));
  };

  const removeSubEntry = (paramId: string, subId: string) => {
    setParameters(prev => prev.map(p =>
      p.id === paramId ? { ...p, subEntries: p.subEntries.filter(s => s.id !== subId) } : p
    ));
  };

  const toggleParamExpand = (paramId: string) => {
    setExpandedParams(prev => {
      const next = new Set(prev);
      if (next.has(paramId)) next.delete(paramId);
      else next.add(paramId);
      return next;
    });
  };

  const addCustomColumn = () => {
    setCustomColumns(prev => [...prev, { id: `stdcol-${Date.now()}`, header: `Col ${prev.length + 1}` }]);
  };

  const updateCustomColumnHeader = (colId: string, header: string) => {
    setCustomColumns(prev => prev.map(c => c.id === colId ? { ...c, header } : c));
  };

  const removeCustomColumn = (colId: string) => {
    setCustomColumns(prev => prev.filter(c => c.id !== colId));
  };

  const loadDefaultParams = () => {
    setParameters(DEFAULT_ANALYSES.map(name => ({ ...emptyParam(), analysis: name })));
  };

  const resetBuilder = () => {
    setTemplateName('');
    setTemplateDesc('');
    setParameters([emptyParam()]);
    setCustomColumns([]);
    setEditingId(null);
  };

  const saveStandard = () => {
    if (!templateName.trim() || parameters.length === 0) return;
    const standard: SavedStandard = {
      id: editingId || `std-${Date.now()}`,
      name: templateName.trim(),
      description: templateDesc.trim(),
      parameters: parameters.filter(p => p.analysis.trim()),
      customColumns: [...customColumns],
      createdAt: editingId
        ? (savedStandards.find(s => s.id === editingId)?.createdAt || Date.now())
        : Date.now(),
    };
    if (editingId) {
      setSavedStandards(prev => prev.map(s => s.id === editingId ? standard : s));
    } else {
      setSavedStandards(prev => [standard, ...prev]);
    }
    resetBuilder();
  };

  const loadStandard = (s: SavedStandard) => {
    setTemplateName(s.name);
    setTemplateDesc(s.description);
    setParameters(s.parameters.map(p => ({
      ...emptyParam(),
      ...p,
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      normalMin: p.normalMin || '',
      normalMax: p.normalMax || '',
      withDeductionMin: p.withDeductionMin || '',
      withDeductionMax: p.withDeductionMax || '',
      outlierMin: p.outlierMin || '',
      outlierMax: p.outlierMax || '',
      customValues: p.customValues || {},
      subEntries: p.subEntries || [],
    })));
    setCustomColumns(s.customColumns || []);
    setEditingId(s.id);
  };

  const duplicateStandard = (s: SavedStandard) => {
    const dup: SavedStandard = {
      ...s,
      id: `std-${Date.now()}`,
      name: `${s.name} (Copy)`,
      createdAt: Date.now(),
      parameters: s.parameters.map(p => ({ ...p, id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    setSavedStandards(prev => [dup, ...prev]);
  };

  const deleteStandard = (id: string) => {
    setSavedStandards(prev => prev.filter(s => s.id !== id));
    if (editingId === id) resetBuilder();
  };

  const formatRange = (min?: string, max?: string) => {
    const a = min || '';
    const b = max || '';
    if (a && b) return `${a}–${b}`;
    if (a) return `≥${a}`;
    if (b) return `≤${b}`;
    return '—';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionCloudSync sectionKey="chemanalyst-standards" label="Standards" isAdmin={true} />
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 1 — Define Standard Template</h3>
          </div>
          <button
            onClick={loadDefaultParams}
            className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            Load Default Parameters
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Template Name *</label>
              <input
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="e.g. PBM, Guar Meal, Soybean DOC"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Description (optional)</label>
              <input
                value={templateDesc}
                onChange={e => setTemplateDesc(e.target.value)}
                placeholder="Brief description of this standard"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Analysis Parameters Table */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 2 — Analysis Parameters</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addCustomColumn}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors"
            >
              <Columns className="w-3 h-3" /> Add Column
            </button>
            <span className="text-[10px] text-muted-foreground">{parameters.filter(p => p.analysis.trim()).length} parameters</span>
          </div>
        </div>

        {/* Custom column headers management */}
        {customColumns.length > 0 && (
          <div className="px-5 py-2 border-b border-border/50 flex flex-wrap gap-2">
            {customColumns.map(cc => (
              <div key={cc.id} className="flex items-center gap-1 bg-secondary/50 border border-border rounded-md px-2 py-1">
                <input
                  type="text"
                  value={cc.header}
                  onChange={e => updateCustomColumnHeader(cc.id, e.target.value)}
                  className="bg-transparent text-xs font-medium text-foreground w-20 focus:outline-none border-none"
                  placeholder="Header"
                />
                <button onClick={() => removeCustomColumn(cc.id)} className="text-destructive hover:text-destructive/80 p-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Analysis</th>
                <th colSpan={2} className="text-center py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Normal Range</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Min</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Max</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Standard</th>
                <th colSpan={2} className="text-center py-2.5 px-2 text-xs font-medium text-warning uppercase tracking-wider whitespace-nowrap">With Ded. Range</th>
                <th colSpan={2} className="text-center py-2.5 px-2 text-xs font-medium text-destructive uppercase tracking-wider whitespace-nowrap">Outlier Range</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Reason</th>
                {customColumns.map(cc => (
                  <th key={cc.id} className="text-left py-2.5 px-2 text-xs font-medium text-primary uppercase tracking-wider whitespace-nowrap">{cc.header}</th>
                ))}
                <th className="py-2.5 px-2"></th>
              </tr>
              <tr className="border-b border-border/50 bg-secondary/10">
                <th></th>
                <th className="text-center py-1 px-1 text-[9px] text-muted-foreground/60">Min</th>
                <th className="text-center py-1 px-1 text-[9px] text-muted-foreground/60">Max</th>
                <th></th><th></th><th></th>
                <th className="text-center py-1 px-1 text-[9px] text-warning/60">Min</th>
                <th className="text-center py-1 px-1 text-[9px] text-warning/60">Max</th>
                <th className="text-center py-1 px-1 text-[9px] text-destructive/60">Min</th>
                <th className="text-center py-1 px-1 text-[9px] text-destructive/60">Max</th>
                <th></th>
                {customColumns.map(cc => <th key={cc.id}></th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((param) => (
                <>
                  <tr key={param.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-1.5 px-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleParamExpand(param.id)}
                          className="p-0.5 text-muted-foreground/40 hover:text-primary transition-colors"
                          title="Sub-entries"
                        >
                          {expandedParams.has(param.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 -rotate-90" />}
                        </button>
                        <input type="text" value={param.analysis} onChange={e => updateParam(param.id, 'analysis', e.target.value)}
                          placeholder="e.g. Moisture" className="w-24 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                      </div>
                    </td>
                    <td className="py-1.5 px-1">
                      <input type="text" value={param.normalMin} onChange={e => updateParam(param.id, 'normalMin', e.target.value)}
                        placeholder="0" className="w-14 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center" />
                    </td>
                    <td className="py-1.5 px-1">
                      <input type="text" value={param.normalMax} onChange={e => updateParam(param.id, 'normalMax', e.target.value)}
                        placeholder="0" className="w-14 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center" />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input type="text" value={param.min} onChange={e => updateParam(param.id, 'min', e.target.value)}
                        placeholder="0" className="w-14 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input type="text" value={param.max} onChange={e => updateParam(param.id, 'max', e.target.value)}
                        placeholder="0" className="w-14 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input type="text" value={param.standard} onChange={e => updateParam(param.id, 'standard', e.target.value)}
                        placeholder="0" className="w-14 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                    <td className="py-1.5 px-1">
                      <input type="text" value={param.withDeductionMin} onChange={e => updateParam(param.id, 'withDeductionMin', e.target.value)}
                        placeholder="0" className="w-14 bg-transparent border border-transparent hover:border-border focus:border-warning rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center" />
                    </td>
                    <td className="py-1.5 px-1">
                      <input type="text" value={param.withDeductionMax} onChange={e => updateParam(param.id, 'withDeductionMax', e.target.value)}
                        placeholder="0" className="w-14 bg-transparent border border-transparent hover:border-border focus:border-warning rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center" />
                    </td>
                    <td className="py-1.5 px-1">
                      <input type="text" value={param.outlierMin} onChange={e => updateParam(param.id, 'outlierMin', e.target.value)}
                        placeholder="0" className="w-14 bg-transparent border border-transparent hover:border-border focus:border-destructive rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center" />
                    </td>
                    <td className="py-1.5 px-1">
                      <input type="text" value={param.outlierMax} onChange={e => updateParam(param.id, 'outlierMax', e.target.value)}
                        placeholder="0" className="w-14 bg-transparent border border-transparent hover:border-border focus:border-destructive rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center" />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input type="text" value={param.reason} onChange={e => updateParam(param.id, 'reason', e.target.value)}
                        placeholder="e.g. Mixing" className="w-24 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                    {customColumns.map(cc => (
                      <td key={cc.id} className="py-1.5 px-1">
                        <input type="text" value={param.customValues?.[cc.id] || ''} onChange={e => updateParamCustomValue(param.id, cc.id, e.target.value)}
                          placeholder="—" className="w-16 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors text-center" />
                      </td>
                    ))}
                    <td className="py-1.5 px-1.5">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => addSubEntry(param.id)} className="p-1 text-primary/60 hover:text-primary rounded transition-colors" title="Add sub-entry">
                          <Plus className="w-3 h-3" />
                        </button>
                        {parameters.length > 1 && (
                          <button onClick={() => removeParam(param.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Sub-entries */}
                  {expandedParams.has(param.id) && param.subEntries.map(sub => (
                    <tr key={sub.id} className="border-b border-border/30 bg-secondary/10">
                      <td className="py-1 px-1.5" colSpan={2}>
                        <div className="flex items-center gap-1 pl-6">
                          <span className="text-[9px] text-muted-foreground/50">└</span>
                          <input type="text" value={sub.label} onChange={e => updateSubEntry(param.id, sub.id, 'label', e.target.value)}
                            placeholder="Sub-label" className="w-20 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-0.5 text-[11px] font-mono text-muted-foreground focus:ring-0 focus:outline-none transition-colors" />
                        </div>
                      </td>
                      <td className="py-1 px-1" colSpan={8 + customColumns.length}>
                        <input type="text" value={sub.value} onChange={e => updateSubEntry(param.id, sub.id, 'value', e.target.value)}
                          placeholder="Value" className="w-32 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-0.5 text-[11px] font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                      </td>
                      <td className="py-1 px-1">
                        <button onClick={() => removeSubEntry(param.id, sub.id)} className="p-0.5 text-destructive/60 hover:text-destructive rounded transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3">
          <button onClick={addParam}
            className="w-full py-2.5 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Parameter
          </button>
        </div>
      </div>

      {/* Step 3: Save */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <Save className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Step 3 — Save Standard</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={saveStandard}
              disabled={!templateName.trim() || parameters.filter(p => p.analysis.trim()).length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" /> {editingId ? 'Update Standard' : 'Save Standard'}
            </button>
            {editingId && (
              <button
                onClick={resetBuilder}
                className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel Edit
              </button>
            )}
          </div>
          {editingId && (
            <p className="text-[10px] text-primary">Editing "{templateName}" — changes will update the existing standard</p>
          )}
        </div>
      </div>

      {/* Saved Standards */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">My Standards</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">{savedStandards.length} saved</span>
        </div>
        <div className="p-5">
          {savedStandards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No standards saved yet. Create your first one above!</p>
          ) : (
            <div className="space-y-2">
              {savedStandards.map(s => (
                <div key={s.id} className="rounded-md border border-border hover:border-primary/30 transition-colors overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedStandard(expandedStandard === s.id ? null : s.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.parameters.length} parameters{s.customColumns?.length ? ` • ${s.customColumns.length} custom col` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={ev => { ev.stopPropagation(); loadStandard(s); }}
                        className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={ev => { ev.stopPropagation(); duplicateStandard(s); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors"
                        title="Duplicate standard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={ev => { ev.stopPropagation(); deleteStandard(s.id); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {expandedStandard === s.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedStandard === s.id && (
                    <div className="px-4 pb-3 border-t border-border/50 pt-2">
                      {s.description && <p className="text-xs text-muted-foreground mb-2">{s.description}</p>}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Analysis</th>
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Normal</th>
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Min</th>
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Max</th>
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Standard</th>
                              <th className="text-left py-1.5 px-2 text-warning font-medium">With Ded.</th>
                              <th className="text-left py-1.5 px-2 text-destructive font-medium">Outlier</th>
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Reason</th>
                              {(s.customColumns || []).map(cc => (
                                <th key={cc.id} className="text-left py-1.5 px-2 text-primary font-medium">{cc.header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {s.parameters.map(p => (
                              <>
                                <tr key={p.id} className="border-b border-border/30">
                                  <td className="py-1 px-2 font-medium text-foreground">{p.analysis}</td>
                                  <td className="py-1 px-2 font-mono text-muted-foreground">{formatRange(p.normalMin, p.normalMax)}</td>
                                  <td className="py-1 px-2 font-mono text-muted-foreground">{p.min || '—'}</td>
                                  <td className="py-1 px-2 font-mono text-muted-foreground">{p.max || '—'}</td>
                                  <td className="py-1 px-2 font-mono text-primary">{p.standard || '—'}</td>
                                  <td className="py-1 px-2 font-mono text-warning">{formatRange(p.withDeductionMin, p.withDeductionMax)}</td>
                                  <td className="py-1 px-2 font-mono text-destructive">{formatRange(p.outlierMin, p.outlierMax)}</td>
                                  <td className="py-1 px-2 text-muted-foreground">{p.reason || '—'}</td>
                                  {(s.customColumns || []).map(cc => (
                                    <td key={cc.id} className="py-1 px-2 font-mono text-foreground">{p.customValues?.[cc.id] || '—'}</td>
                                  ))}
                                </tr>
                                {(p.subEntries || []).map(sub => (
                                  <tr key={sub.id} className="border-b border-border/20 bg-secondary/10">
                                    <td className="py-0.5 px-2 pl-6 text-muted-foreground" colSpan={2}>
                                      <span className="text-[9px] mr-1">└</span>{sub.label || '—'}
                                    </td>
                                    <td className="py-0.5 px-2 font-mono text-foreground" colSpan={6 + (s.customColumns?.length || 0)}>
                                      {sub.value || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">Saved {new Date(s.createdAt).toLocaleDateString()}</p>
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
