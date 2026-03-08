import { useState, useMemo } from 'react';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { calcMolarMass } from '@/lib/periodicTableData';

interface MolarMassLookupProps {
  onSelect: (mw: number) => void;
  disabled?: boolean;
}

export function MolarMassLookup({ onSelect, disabled }: MolarMassLookupProps) {
  const [open, setOpen] = useState(false);
  const [formula, setFormula] = useState('');

  const result = useMemo(() => {
    if (!formula.trim()) return null;
    return calcMolarMass(formula.trim());
  }, [formula]);

  const handleUse = () => {
    if (result) {
      onSelect(result.total);
      setFormula('');
      setOpen(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
      >
        <Calculator className="w-3.5 h-3.5" />
        <span>MW from Formula</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 p-3 bg-muted/30 border border-border rounded-lg space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g. H2SO4, Ca(OH)2"
              disabled={disabled}
              className="flex-1 bg-input border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && result) handleUse();
              }}
            />
            <button
              type="button"
              onClick={handleUse}
              disabled={!result || disabled}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              Use
            </button>
          </div>

          {result && (
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-primary font-mono">{result.total.toFixed(4)}</span>
                <span className="text-[11px] text-muted-foreground">g/mol</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.breakdown.map((b, i) => (
                  <span key={i} className="bg-muted/50 rounded px-1.5 py-0.5 text-[10px] font-mono text-foreground">
                    <span className="font-bold">{b.symbol}</span>
                    {b.count > 1 && <sub>{b.count}</sub>}
                    <span className="text-muted-foreground ml-1">= {(b.mass * b.count).toFixed(3)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {formula.trim() && !result && (
            <p className="text-[10px] text-destructive">Invalid formula</p>
          )}
        </div>
      )}
    </div>
  );
}
