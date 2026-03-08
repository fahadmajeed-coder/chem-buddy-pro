import { useState } from 'react';
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Copy, Pencil, Shield, FileText, X } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AnalysisParam {
  id: string;
  analysis: string;
  normal: string;
  min: string;
  max: string;
  standard: string;
  withDeduction: string;
  outlier: string;
  reason: string;
}

interface SavedStandard {
  id: string;
  name: string;
  description: string;
  parameters: AnalysisParam[];
  createdAt: number;
}

const DEFAULT_ANALYSES = [
  'Moisture', 'Ash', 'AIA', 'Oil', 'FFA', 'CP', 'TP', 'NPN', 'CF', 'NFE',
  'Ca', 'Phosphorous', 'Calorific Value', 'Chromium test',
];

const emptyParam = (): AnalysisParam => ({
  id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  analysis: '', normal: '', min: '', max: '', standard: '', withDeduction: '', outlier: '', reason: '',
});

export function StandardsSection() {
  const [savedStandards, setSavedStandards] = useLocalStorage<SavedStandard[]>('chemanalyst-standards', []);
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);

  // Builder state
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [parameters, setParameters] = useState<AnalysisParam[]>([emptyParam()]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addParam = () => setParameters(prev => [...prev, emptyParam()]);

  const removeParam = (id: string) => {
    if (parameters.length > 1) setParameters(prev => prev.filter(p => p.id !== id));
  };

  const updateParam = (id: string, field: keyof AnalysisParam, value: string) => {
    setParameters(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const loadDefaultParams = () => {
    setParameters(DEFAULT_ANALYSES.map(name => ({ ...emptyParam(), analysis: name })));
  };

  const resetBuilder = () => {
    setTemplateName('');
    setTemplateDesc('');
    setParameters([emptyParam()]);
    setEditingId(null);
  };

  const saveStandard = () => {
    if (!templateName.trim() || parameters.length === 0) return;
    const standard: SavedStandard = {
      id: editingId || `std-${Date.now()}`,
      name: templateName.trim(),
      description: templateDesc.trim(),
      parameters: parameters.filter(p => p.analysis.trim()),
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
    setParameters(s.parameters.map(p => ({ ...p, id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })));
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

  const fields: { key: keyof AnalysisParam; label: string; placeholder: string; width: string }[] = [
    { key: 'analysis', label: 'Analysis', placeholder: 'e.g. Moisture', width: 'w-28' },
    { key: 'normal', label: 'Normal', placeholder: 'e.g. 7-15', width: 'w-20' },
    { key: 'min', label: 'Min', placeholder: '0', width: 'w-16' },
    { key: 'max', label: 'Max', placeholder: '0', width: 'w-16' },
    { key: 'standard', label: 'Standard', placeholder: '0', width: 'w-18' },
    { key: 'withDeduction', label: 'With Ded.', placeholder: '0', width: 'w-18' },
    { key: 'outlier', label: 'Outlier', placeholder: '0', width: 'w-16' },
    { key: 'reason', label: 'Reason', placeholder: 'e.g. Mixing', width: 'w-24' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step 1: Template Builder */}
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
          <span className="text-[10px] text-muted-foreground">{parameters.filter(p => p.analysis.trim()).length} parameters</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {fields.map(f => (
                  <th key={f.key} className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
                <th className="py-2.5 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((param) => (
                <tr key={param.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  {fields.map(f => (
                    <td key={f.key} className="py-1.5 px-1.5">
                      <input
                        type="text"
                        value={param[f.key]}
                        onChange={e => updateParam(param.id, f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className={`${f.width} bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors`}
                      />
                    </td>
                  ))}
                  <td className="py-1.5 px-1.5">
                    {parameters.length > 1 && (
                      <button onClick={() => removeParam(param.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
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
            <p className="text-[10px] text-primary">✏ Editing "{templateName}" — changes will update the existing standard</p>
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
                      <p className="text-xs text-muted-foreground mt-0.5">{s.parameters.length} parameters</p>
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
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">With Ded.</th>
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Outlier</th>
                              <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.parameters.map(p => (
                              <tr key={p.id} className="border-b border-border/30">
                                <td className="py-1 px-2 font-medium text-foreground">{p.analysis}</td>
                                <td className="py-1 px-2 font-mono text-muted-foreground">{p.normal || '—'}</td>
                                <td className="py-1 px-2 font-mono text-muted-foreground">{p.min || '—'}</td>
                                <td className="py-1 px-2 font-mono text-muted-foreground">{p.max || '—'}</td>
                                <td className="py-1 px-2 font-mono text-primary">{p.standard || '—'}</td>
                                <td className="py-1 px-2 font-mono text-warning">{p.withDeduction || '—'}</td>
                                <td className="py-1 px-2 font-mono text-destructive">{p.outlier || '—'}</td>
                                <td className="py-1 px-2 text-muted-foreground">{p.reason || '—'}</td>
                              </tr>
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
