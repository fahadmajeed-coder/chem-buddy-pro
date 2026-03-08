import { useState, useMemo } from 'react';
import { Search, Calculator, X, Thermometer, Zap, Atom, Beaker, FlaskConical } from 'lucide-react';
import {
  elements,
  Element,
  ElementCategory,
  categoryColors,
  categoryLabels,
  calcMolarMass,
} from '@/lib/periodicTableData';

function formatTemp(kelvin: number, unit: 'K' | 'C' | 'F'): string {
  if (unit === 'K') return `${kelvin} K`;
  if (unit === 'C') return `${(kelvin - 273.15).toFixed(2)} °C`;
  return `${((kelvin - 273.15) * 9 / 5 + 32).toFixed(2)} °F`;
}

interface PeriodicTableProps {
  onUseInCalculator?: (target: 'molarity' | 'normality' | 'formality' | 'solution', mw: number, name: string) => void;
}

export function PeriodicTable({ onUseInCalculator }: PeriodicTableProps) {
  const [selected, setSelected] = useState<Element | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ElementCategory | 'all'>('all');
  const [filterState, setFilterState] = useState<'all' | 'solid' | 'liquid' | 'gas'>('all');
  const [formula, setFormula] = useState('');
  const [tempUnit, setTempUnit] = useState<'K' | 'C' | 'F'>('K');

  const filtered = useMemo(() => {
    let list = elements;
    if (filterCategory !== 'all') list = list.filter(e => e.category === filterCategory);
    if (filterState !== 'all') list = list.filter(e => e.state === filterState);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.symbol.toLowerCase().includes(q) ||
        e.atomicNumber.toString() === q
      );
    }
    return new Set(list.map(e => e.atomicNumber));
  }, [search, filterCategory, filterState]);

  const molarResult = useMemo(() => {
    if (!formula.trim()) return null;
    return calcMolarMass(formula.trim());
  }, [formula]);

  // Build grid — 18 columns × 10 rows
  const grid: (Element | null)[][] = Array.from({ length: 10 }, () => Array(18).fill(null));
  elements.forEach(el => {
    grid[el.row - 1][el.col - 1] = el;
  });

  const getCategoryBg = (cat: ElementCategory) => categoryColors[cat];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, symbol, or number..."
              className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as any)}
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary"
          >
            <option value="all">All States</option>
            <option value="solid">Solid</option>
            <option value="liquid">Liquid</option>
            <option value="gas">Gas</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryLabels).map(([cat, label]) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat as ElementCategory)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-all ${filterCategory === cat ? 'ring-2 ring-primary' : 'opacity-80 hover:opacity-100'}`}
              style={{ backgroundColor: getCategoryBg(cat as ElementCategory), color: 'white' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Periodic Table Grid */}
      <div className="bg-card border border-border rounded-xl p-3 overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Main grid rows 1-7 */}
          {grid.slice(0, 7).map((row, ri) => (
            <div key={ri} className="flex gap-[2px] mb-[2px]">
              {row.map((el, ci) => (
                <div key={ci} className="w-[calc(100%/18)] aspect-square min-w-[38px]">
                  {el ? (
                    <button
                      onClick={() => setSelected(el)}
                      className={`w-full h-full rounded flex flex-col items-center justify-center text-white transition-all hover:scale-110 hover:z-10 hover:shadow-lg relative ${
                        !filtered.has(el.atomicNumber) ? 'opacity-20' : ''
                      } ${selected?.atomicNumber === el.atomicNumber ? 'ring-2 ring-primary scale-110 z-10' : ''}`}
                      style={{ backgroundColor: getCategoryBg(el.category) }}
                      title={`${el.name} (${el.atomicMass})`}
                    >
                      <span className="text-[7px] leading-none opacity-70">{el.atomicNumber}</span>
                      <span className="text-xs font-bold leading-tight">{el.symbol}</span>
                      <span className="text-[6px] leading-none opacity-60 hidden sm:block">{el.atomicMass.toFixed(el.atomicMass >= 100 ? 1 : 2)}</span>
                    </button>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              ))}
            </div>
          ))}
          {/* Gap label */}
          <div className="h-3" />
          {/* Lanthanides row 9 */}
          <div className="flex gap-[2px] mb-[2px]">
            <div className="w-[calc(100%/18)] min-w-[38px]" /><div className="w-[calc(100%/18)] min-w-[38px]" />
            {grid[8].slice(2).map((el, ci) => (
              <div key={ci} className="w-[calc(100%/18)] aspect-square min-w-[38px]">
                {el ? (
                  <button
                    onClick={() => setSelected(el)}
                    className={`w-full h-full rounded flex flex-col items-center justify-center text-white transition-all hover:scale-110 hover:z-10 hover:shadow-lg ${
                      !filtered.has(el.atomicNumber) ? 'opacity-20' : ''
                    } ${selected?.atomicNumber === el.atomicNumber ? 'ring-2 ring-primary scale-110 z-10' : ''}`}
                    style={{ backgroundColor: getCategoryBg(el.category) }}
                    title={`${el.name} (${el.atomicMass})`}
                  >
                    <span className="text-[7px] leading-none opacity-70">{el.atomicNumber}</span>
                    <span className="text-xs font-bold leading-tight">{el.symbol}</span>
                    <span className="text-[6px] leading-none opacity-60 hidden sm:block">{el.atomicMass.toFixed(1)}</span>
                  </button>
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))}
          </div>
          {/* Actinides row 10 */}
          <div className="flex gap-[2px]">
            <div className="w-[calc(100%/18)] min-w-[38px]" /><div className="w-[calc(100%/18)] min-w-[38px]" />
            {grid[9].slice(2).map((el, ci) => (
              <div key={ci} className="w-[calc(100%/18)] aspect-square min-w-[38px]">
                {el ? (
                  <button
                    onClick={() => setSelected(el)}
                    className={`w-full h-full rounded flex flex-col items-center justify-center text-white transition-all hover:scale-110 hover:z-10 hover:shadow-lg ${
                      !filtered.has(el.atomicNumber) ? 'opacity-20' : ''
                    } ${selected?.atomicNumber === el.atomicNumber ? 'ring-2 ring-primary scale-110 z-10' : ''}`}
                    style={{ backgroundColor: getCategoryBg(el.category) }}
                    title={`${el.name} (${el.atomicMass})`}
                  >
                    <span className="text-[7px] leading-none opacity-70">{el.atomicNumber}</span>
                    <span className="text-xs font-bold leading-tight">{el.symbol}</span>
                    <span className="text-[6px] leading-none opacity-60 hidden sm:block">{el.atomicMass.toFixed(0)}</span>
                  </button>
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Element Detail Panel */}
      {selected && (
        <div className="bg-card border border-border rounded-xl p-5 relative">
          <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-5">
            <div
              className="w-20 h-20 rounded-lg flex flex-col items-center justify-center text-white shrink-0"
              style={{ backgroundColor: getCategoryBg(selected.category) }}
            >
              <span className="text-xs opacity-70">{selected.atomicNumber}</span>
              <span className="text-2xl font-bold">{selected.symbol}</span>
              <span className="text-[9px] opacity-60">{selected.atomicMass}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                {categoryLabels[selected.category]} · Period {selected.period} · Block {selected.block.toUpperCase()} · {selected.state.charAt(0).toUpperCase() + selected.state.slice(1)}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <InfoItem icon={<Atom className="w-3.5 h-3.5" />} label="Atomic Mass" value={`${selected.atomicMass} u`} />
                <InfoItem icon={<Atom className="w-3.5 h-3.5" />} label="Atomic Weight" value={`${selected.atomicMass} Da`} />
                <InfoItem icon={<Zap className="w-3.5 h-3.5" />} label="Electronegativity" value={selected.electronegativity?.toString() || '—'} />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5" />Melting Point
                  </p>
                  <p className="text-sm font-medium text-foreground">{selected.meltingPoint ? formatTemp(selected.meltingPoint, tempUnit) : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5" />Boiling Point
                  </p>
                  <p className="text-sm font-medium text-foreground">{selected.boilingPoint ? formatTemp(selected.boilingPoint, tempUnit) : '—'}</p>
                </div>
                <InfoItem label="Density" value={selected.density ? `${selected.density} g/cm³` : '—'} />
                <InfoItem label="Oxidation States" value={selected.oxidationStates} />
                <InfoItem label="Discovered" value={selected.yearDiscovered} />
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Temp Unit:</span>
                {(['K', 'C', 'F'] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setTempUnit(u)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${tempUnit === u ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:text-foreground'}`}
                  >
                    {u === 'K' ? 'K' : u === 'C' ? '°C' : '°F'}
                  </button>
                ))}
              </div>

              <div className="mt-3 p-2 bg-muted/30 rounded-md">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Electron Configuration</p>
                <p className="text-sm font-mono text-foreground">{selected.electronConfiguration}</p>
              </div>
              {onUseInCalculator && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => onUseInCalculator('molarity', selected.atomicMass, selected.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Beaker className="w-3.5 h-3.5" /> Use in Molarity
                  </button>
                  <button
                    onClick={() => onUseInCalculator('normality', selected.atomicMass, selected.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <FlaskConical className="w-3.5 h-3.5" /> Use in Normality
                  </button>
                  <button
                    onClick={() => onUseInCalculator('formality', selected.atomicMass, selected.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <FlaskConical className="w-3.5 h-3.5" /> Use in Formality
                  </button>
                  <button
                    onClick={() => onUseInCalculator('solution', selected.atomicMass, selected.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <FlaskConical className="w-3.5 h-3.5" /> Use in Solution Prep
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Molar Mass Calculator */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-primary" />
          Molar Mass Calculator
        </h3>
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Enter formula (e.g. H2SO4, NaCl, Ca(OH)2)"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        {molarResult && (
          <div className="mt-3 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary font-mono">{molarResult.total.toFixed(4)}</span>
              <span className="text-sm text-muted-foreground">g/mol</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {molarResult.breakdown.map((b, i) => (
                <div key={i} className="bg-muted/30 rounded px-2 py-1 text-xs font-mono text-foreground">
                  <span className="font-bold">{b.symbol}</span>
                  {b.count > 1 && <sub>{b.count}</sub>}
                  <span className="text-muted-foreground ml-1">= {b.mass} × {b.count} = {(b.mass * b.count).toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {formula.trim() && !molarResult && (
          <p className="mt-2 text-xs text-destructive">Invalid formula — use standard notation (e.g. H2SO4)</p>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        {icon}{label}
      </p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
