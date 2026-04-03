import { useState, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronRight, FlaskConical, Droplets, Zap, Link2, Sparkles, Eye, Layers, Info, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { INDICATORS as DEFAULT_INDICATORS, INDICATOR_TYPES, type Indicator } from '@/lib/indicatorsData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SectionCloudSync } from './SectionCloudSync';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'pH': <Droplets className="w-3.5 h-3.5" />,
  'redox': <Zap className="w-3.5 h-3.5" />,
  'complexometric': <Link2 className="w-3.5 h-3.5" />,
  'adsorption': <Layers className="w-3.5 h-3.5" />,
  'fluorescent': <Eye className="w-3.5 h-3.5" />,
  'universal': <Sparkles className="w-3.5 h-3.5" />,
};

const emptyIndicator = (): Indicator => ({
  id: `ind-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  type: 'pH',
  colorAcidic: '',
  colorBasic: '',
  concentration: '',
  solvent: 'Water',
  applications: [],
});

function IndicatorCard({ indicator, isAdmin, onEdit, onDelete }: { indicator: Indicator; isAdmin: boolean; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-panel rounded-lg animate-fade-in">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground truncate">{indicator.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              {indicator.pHRange && (
                <span className="text-[10px] font-mono text-primary">pH {indicator.pHRange[0]}–{indicator.pHRange[1]}</span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {indicator.colorAcidic} → {indicator.colorBasic}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isAdmin && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1 text-muted-foreground hover:text-primary transition-colors rounded"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {indicator.type}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 text-center py-2 rounded-md bg-muted/50 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                {indicator.type === 'complexometric' ? 'With Metal' : 'Acidic / Reduced'}
              </p>
              <p className="text-sm font-semibold text-foreground">{indicator.colorAcidic}</p>
            </div>
            <span className="text-muted-foreground text-lg">→</span>
            {indicator.colorTransition && (
              <>
                <div className="flex-1 text-center py-2 rounded-md bg-muted/50 border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Transition</p>
                  <p className="text-sm font-semibold text-foreground">{indicator.colorTransition}</p>
                </div>
                <span className="text-muted-foreground text-lg">→</span>
              </>
            )}
            <div className="flex-1 text-center py-2 rounded-md bg-muted/50 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                {indicator.type === 'complexometric' ? 'Free' : 'Basic / Oxidized'}
              </p>
              <p className="text-sm font-semibold text-foreground">{indicator.colorBasic}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {indicator.pHRange && (
              <div className="p-2 rounded-md bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">pH Range</p>
                <p className="text-sm font-mono font-semibold text-foreground">{indicator.pHRange[0]} – {indicator.pHRange[1]}</p>
              </div>
            )}
            {indicator.pKa !== undefined && (
              <div className="p-2 rounded-md bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">pKₐ</p>
                <p className="text-sm font-mono font-semibold text-foreground">{indicator.pKa}</p>
              </div>
            )}
            {indicator.molecularWeight && (
              <div className="p-2 rounded-md bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mol. Weight</p>
                <p className="text-sm font-mono font-semibold text-foreground">{indicator.molecularWeight} g/mol</p>
              </div>
            )}
            {indicator.formula && (
              <div className="p-2 rounded-md bg-muted/30 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Formula</p>
                <p className="text-sm font-mono font-semibold text-foreground">{indicator.formula}</p>
              </div>
            )}
            <div className="p-2 rounded-md bg-muted/30 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Concentration</p>
              <p className="text-sm font-semibold text-foreground">{indicator.concentration}</p>
            </div>
            <div className="p-2 rounded-md bg-muted/30 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Solvent</p>
              <p className="text-sm font-semibold text-foreground">{indicator.solvent}</p>
            </div>
            {indicator.casNumber && (
              <div className="p-2 rounded-md bg-muted/30 border border-border col-span-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CAS Number</p>
                <p className="text-sm font-mono font-semibold text-foreground">{indicator.casNumber}</p>
              </div>
            )}
          </div>

          {indicator.applications.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Applications</p>
              <div className="flex flex-wrap gap-1.5">
                {indicator.applications.map((app, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground border border-border">
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}

          {indicator.notes && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/20">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{indicator.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function IndicatorsInventory({ isAdmin = false }: { isAdmin?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [customIndicators, setCustomIndicators] = useLocalStorage<Indicator[]>('chemanalyst-custom-indicators', []);
  const [removedDefaultIds, setRemovedDefaultIds] = useLocalStorage<string[]>('chemanalyst-removed-indicators', []);
  const [showForm, setShowForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [formData, setFormData] = useState<Indicator>(emptyIndicator());
  const [appInput, setAppInput] = useState('');

  // Merge default (minus removed) + custom
  const allIndicators = useMemo(() => {
    const defaults = DEFAULT_INDICATORS.filter(i => !removedDefaultIds.includes(i.id));
    // Custom indicators override defaults with same id
    const customIds = new Set(customIndicators.map(i => i.id));
    const filteredDefaults = defaults.filter(i => !customIds.has(i.id));
    return [...filteredDefaults, ...customIndicators];
  }, [customIndicators, removedDefaultIds]);

  const filtered = useMemo(() => {
    let list = allIndicators;
    if (selectedType !== 'all') {
      list = list.filter(i => i.type === selectedType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.formula?.toLowerCase().includes(q) ||
        i.applications.some(a => a.toLowerCase().includes(q)) ||
        i.colorAcidic.toLowerCase().includes(q) ||
        i.colorBasic.toLowerCase().includes(q) ||
        i.casNumber?.includes(q)
      );
    }
    return list;
  }, [searchQuery, selectedType, allIndicators]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allIndicators.length };
    INDICATOR_TYPES.forEach(t => { counts[t.value] = 0; });
    allIndicators.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return counts;
  }, [allIndicators]);

  const startAdd = () => {
    setEditingIndicator(null);
    setFormData(emptyIndicator());
    setAppInput('');
    setShowForm(true);
  };

  const startEdit = (ind: Indicator) => {
    setEditingIndicator(ind);
    setFormData({ ...ind });
    setAppInput(ind.applications.join(', '));
    setShowForm(true);
  };

  const saveIndicator = () => {
    if (!formData.name.trim()) return;
    const toSave: Indicator = {
      ...formData,
      applications: appInput.split(',').map(s => s.trim()).filter(Boolean),
    };
    if (editingIndicator) {
      // Update
      const isDefault = DEFAULT_INDICATORS.some(i => i.id === editingIndicator.id);
      if (isDefault) {
        // Save as custom override
        setCustomIndicators(prev => {
          const exists = prev.findIndex(i => i.id === editingIndicator.id);
          if (exists >= 0) { const n = [...prev]; n[exists] = toSave; return n; }
          return [...prev, toSave];
        });
      } else {
        setCustomIndicators(prev => prev.map(i => i.id === editingIndicator.id ? toSave : i));
      }
    } else {
      setCustomIndicators(prev => [...prev, toSave]);
    }
    setShowForm(false);
    setEditingIndicator(null);
  };

  const deleteIndicator = (ind: Indicator) => {
    const isDefault = DEFAULT_INDICATORS.some(i => i.id === ind.id);
    if (isDefault) {
      setRemovedDefaultIds(prev => [...prev, ind.id]);
      // Also remove from custom if overridden
      setCustomIndicators(prev => prev.filter(i => i.id !== ind.id));
    } else {
      setCustomIndicators(prev => prev.filter(i => i.id !== ind.id));
    }
  };

  const updateForm = (field: keyof Indicator, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel rounded-lg">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Indicators Inventory</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Complete reference for analytical chemistry indicators</p>
          </div>
          {isAdmin && (
            <button
              onClick={startAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Indicator
            </button>
          )}
        </div>

        <div className="p-5 space-y-3">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border rounded-lg">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, formula, CAS, application..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="w-px h-5 bg-border" />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{filtered.length} indicator{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Type Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedType('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedType === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <FlaskConical className="w-3 h-3" />
              All ({typeCounts.all})
            </button>
            {INDICATOR_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedType === type.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground'
                }`}
                title={type.description}
              >
                {TYPE_ICONS[type.value]}
                {type.label} ({typeCounts[type.value] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && isAdmin && (
        <div className="glass-panel rounded-lg border-2 border-primary/30 p-5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">{editingIndicator ? 'Edit Indicator' : 'Add New Indicator'}</h4>
            <button onClick={() => setShowForm(false)} className="p-1 text-muted-foreground hover:text-foreground rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Name *</label>
              <input type="text" value={formData.name} onChange={e => updateForm('name', e.target.value)}
                placeholder="e.g. Phenolphthalein" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Type</label>
              <select value={formData.type} onChange={e => updateForm('type', e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none">
                {INDICATOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Color Acidic</label>
              <input type="text" value={formData.colorAcidic} onChange={e => updateForm('colorAcidic', e.target.value)}
                placeholder="e.g. Colorless" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Color Basic</label>
              <input type="text" value={formData.colorBasic} onChange={e => updateForm('colorBasic', e.target.value)}
                placeholder="e.g. Pink" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Color Transition</label>
              <input type="text" value={formData.colorTransition || ''} onChange={e => updateForm('colorTransition', e.target.value)}
                placeholder="Optional" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Concentration</label>
              <input type="text" value={formData.concentration} onChange={e => updateForm('concentration', e.target.value)}
                placeholder="e.g. 0.1% in ethanol" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">pH Range Min</label>
              <input type="number" step="0.1" value={formData.pHRange?.[0] ?? ''} onChange={e => updateForm('pHRange', [parseFloat(e.target.value) || 0, formData.pHRange?.[1] ?? 14])}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">pH Range Max</label>
              <input type="number" step="0.1" value={formData.pHRange?.[1] ?? ''} onChange={e => updateForm('pHRange', [formData.pHRange?.[0] ?? 0, parseFloat(e.target.value) || 14])}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">pKa</label>
              <input type="number" step="0.01" value={formData.pKa ?? ''} onChange={e => updateForm('pKa', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Mol. Weight</label>
              <input type="number" step="0.01" value={formData.molecularWeight ?? ''} onChange={e => updateForm('molecularWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Formula</label>
              <input type="text" value={formData.formula || ''} onChange={e => updateForm('formula', e.target.value)}
                placeholder="e.g. C₂₀H₁₄O₄" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">CAS Number</label>
              <input type="text" value={formData.casNumber || ''} onChange={e => updateForm('casNumber', e.target.value)}
                placeholder="e.g. 77-09-8" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Solvent</label>
              <input type="text" value={formData.solvent} onChange={e => updateForm('solvent', e.target.value)}
                placeholder="e.g. Ethanol" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1 col-span-full">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Applications (comma-separated)</label>
              <input type="text" value={appInput} onChange={e => setAppInput(e.target.value)}
                placeholder="e.g. Acid-base titrations, pH measurement" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-1 col-span-full">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Notes</label>
              <input type="text" value={formData.notes || ''} onChange={e => updateForm('notes', e.target.value)}
                placeholder="Optional notes" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveIndicator} disabled={!formData.name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
              <Save className="w-3.5 h-3.5" /> {editingIndicator ? 'Update' : 'Add'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Indicator Cards */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-lg p-8 text-center">
          <FlaskConical className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No indicators match your search.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(indicator => (
            <IndicatorCard
              key={indicator.id}
              indicator={indicator}
              isAdmin={isAdmin}
              onEdit={() => startEdit(indicator)}
              onDelete={() => deleteIndicator(indicator)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
