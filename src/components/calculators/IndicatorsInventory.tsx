import { useState, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronRight, FlaskConical, Droplets, Zap, Link2, Sparkles, Eye, Layers, Info } from 'lucide-react';
import { INDICATORS, INDICATOR_TYPES, type Indicator } from '@/lib/indicatorsData';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'pH': <Droplets className="w-3.5 h-3.5" />,
  'redox': <Zap className="w-3.5 h-3.5" />,
  'complexometric': <Link2 className="w-3.5 h-3.5" />,
  'adsorption': <Layers className="w-3.5 h-3.5" />,
  'fluorescent': <Eye className="w-3.5 h-3.5" />,
  'universal': <Sparkles className="w-3.5 h-3.5" />,
};

function IndicatorCard({ indicator }: { indicator: Indicator }) {
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
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0 ml-2">
          {indicator.type}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {/* Color Change Visual */}
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

          {/* Parameters Grid */}
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

          {/* Applications */}
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

          {/* Notes */}
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

export function IndicatorsInventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filtered = useMemo(() => {
    let list = INDICATORS;
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
  }, [searchQuery, selectedType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: INDICATORS.length };
    INDICATOR_TYPES.forEach(t => { counts[t.value] = 0; });
    INDICATORS.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return counts;
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel rounded-lg">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Indicators Inventory</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Complete reference for analytical chemistry indicators</p>
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

      {/* Indicator Cards */}
      {filtered.length === 0 ? (
        <div className="glass-panel rounded-lg p-8 text-center">
          <FlaskConical className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No indicators match your search.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(indicator => (
            <IndicatorCard key={indicator.id} indicator={indicator} />
          ))}
        </div>
      )}
    </div>
  );
}
