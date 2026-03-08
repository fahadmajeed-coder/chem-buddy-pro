import { useState, useRef, useEffect } from 'react';
import { Search, Package, FlaskConical } from 'lucide-react';
import { searchStoredInventory } from '@/lib/inventoryStore';
import { ChemicalCompound } from '@/lib/chemicalInventory';

interface CompoundSelectorProps {
  onSelect: (compound: ChemicalCompound) => void;
  disabled?: boolean;
}

export function CompoundSelector({ onSelect, disabled }: CompoundSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChemicalCompound[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResults(searchInventory(query));
    setOpen(query.length >= 2);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (compound: ChemicalCompound) => {
    setSelectedName(compound.name);
    setQuery('');
    setOpen(false);
    onSelect(compound);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Package className="w-3 h-3" />
        Select from Inventory
      </label>
      <div className="mt-1.5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={selectedName || "Search compound name or formula..."}
          disabled={disabled}
          className="w-full bg-input border border-border rounded-md pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 transition-all"
        />
      </div>

      {selectedName && (
        <p className="text-xs text-primary mt-1 flex items-center gap-1">
          <FlaskConical className="w-3 h-3" />
          <span className="font-medium">{selectedName}</span> — values auto-filled from inventory
        </p>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((c) => (
            <button
              key={c.srNo}
              onClick={() => handleSelect(c)}
              className="w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  {c.formula && (
                    <span className="text-xs text-muted-foreground ml-2 font-mono">{c.formula}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                {c.molarMass && <span>MW: {c.molarMass}</span>}
                {c.nFactor && <span>n: {c.nFactor}</span>}
                {c.purity && <span>Purity: {c.purity}</span>}
                {c.density && <span>ρ: {c.density}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg p-3 text-center text-sm text-muted-foreground">
          No compounds found
        </div>
      )}
    </div>
  );
}
