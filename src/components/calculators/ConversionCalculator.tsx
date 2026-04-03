import { useState, useMemo } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { InputField } from './InputField';
import { CompoundSelector } from './CompoundSelector';
import { MolarMassLookup } from './MolarMassLookup';
import { ChemicalCompound } from '@/lib/chemicalInventory';
import { conversionCategories, ConversionDef } from '@/lib/conversionDefinitions';

export function ConversionCalculator({ isAdmin: _isAdmin = false }: { isAdmin?: boolean } = {}) {
  const [activeCatId, setActiveCatId] = useState(conversionCategories[0].id);
  const [activeConvId, setActiveConvId] = useState(conversionCategories[0].conversions[0].id);
  const [locked, setLocked] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const activeCat = conversionCategories.find(c => c.id === activeCatId)!;
  const activeConv = useMemo(() => {
    for (const cat of conversionCategories) {
      const found = cat.conversions.find(c => c.id === activeConvId);
      if (found) return found;
    }
    return conversionCategories[0].conversions[0];
  }, [activeConvId]);

  const filteredConversions = useMemo(() => {
    if (!searchQuery.trim()) return activeCat.conversions;
    const q = searchQuery.toLowerCase();
    return conversionCategories
      .flatMap(c => c.conversions)
      .filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  }, [searchQuery, activeCat]);

  const updateInput = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleCompoundSelect = (compound: ChemicalCompound) => {
    const updates: Record<string, string> = {};
    if (compound.molarMass) updates.mw = compound.molarMass.toString();
    if (compound.nFactor) updates.nfactor = compound.nFactor.toString();
    if (compound.purityValue) updates.purity = compound.purityValue.toString();
    if (compound.density) updates.density = compound.density.toString();
    setInputs(prev => ({ ...prev, ...updates }));
  };

  const switchConversion = (conv: ConversionDef) => {
    setActiveConvId(conv.id);
    setInputs({});
    setSearchQuery('');
  };

  const switchCategory = (catId: string) => {
    setActiveCatId(catId);
    const cat = conversionCategories.find(c => c.id === catId)!;
    setActiveConvId(cat.conversions[0].id);
    setInputs({});
    setSearchQuery('');
  };

  const get = (k: string) => parseFloat(inputs[k] || '');
  const result = activeConv.calculate(get);

  // Count total conversions
  const totalCount = conversionCategories.reduce((sum, c) => sum + c.conversions.length, 0);

  return (
    <CalculatorCard
      title="Unit Conversions"
      subtitle={`${totalCount} conversions across ${conversionCategories.length} categories`}
      locked={locked}
      onToggleLock={() => setLocked(!locked)}
      onReset={() => { if (!locked) setInputs({}); }}
      result={result}
    >
      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversions..."
          className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Category tabs */}
      {!searchQuery && (
        <div className="flex flex-wrap gap-1 mb-3">
          {conversionCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => switchCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
                ${activeCatId === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Conversion buttons */}
      <div className="flex flex-wrap gap-1.5 mb-4 max-h-[120px] overflow-y-auto">
        {filteredConversions.map((c) => (
          <button
            key={c.id}
            onClick={() => switchConversion(c)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${activeConvId === c.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
          >
            {c.label}
          </button>
        ))}
        {filteredConversions.length === 0 && (
          <p className="text-xs text-muted-foreground">No conversions match your search.</p>
        )}
      </div>

      {_isAdmin && <p className="text-xs text-muted-foreground mb-3 font-mono">{activeConv.desc}</p>}

      {/* Compound selector for inventory-linked conversions */}
      {activeConv.inventoryAutoFill && (
        <div className="mb-4">
          <CompoundSelector onSelect={handleCompoundSelect} disabled={locked} />
        </div>
      )}

      {/* MW from Formula — show when any field has 'mw' key */}
      {activeConv.fields.some(f => f.key === 'mw' || f.key === 'mwA' || f.key === 'mwB' || f.key === 'mwSolute' || f.key === 'mwSolvent' || f.key === 'mwAcid' || f.key === 'mwSalt') && (
        <div className="mb-4">
          <MolarMassLookup
            onSelect={(mwVal) => {
              // Auto-fill the first mw-like field
              const mwField = activeConv.fields.find(f => f.key === 'mw' || f.key === 'mwSolute' || f.key === 'mwAcid' || f.key === 'mwA');
              if (mwField) {
                updateInput(mwField.key, mwVal.toString());
              }
            }}
            disabled={locked}
          />
        </div>
      )}

      {/* Dynamic input fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activeConv.fields.map((field) => (
          <InputField
            key={field.key}
            label={field.label}
            unit={field.unit}
            value={inputs[field.key] || ''}
            onChange={(v) => updateInput(field.key, v)}
            disabled={locked}
            placeholder={field.placeholder}
          />
        ))}
      </div>
    </CalculatorCard>
  );
}
