import { useState, useMemo } from 'react';
import { Plus, Trash2, FlaskConical, Search, X, Lock, Unlock, ChevronDown, ChevronRight } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface FormulaVariable {
  id: string;
  name: string;
  description: string;
  defaultValue: string;
  testValue: string;
}

interface SavedFormula {
  id: string;
  name: string;
  description: string;
  expression: string;
  variables: FormulaVariable[];
  createdAt: number;
}

interface SampleRow {
  id: string;
  sampleId: string;
  values: Record<string, string>;
}

interface FormulaBlock {
  formulaId: string;
  rows: SampleRow[];
}

// Same toJavaScript mapper from FormulaBuilder (minimal version for evaluation)
function toJavaScript(expr: string): string {
  let js = expr;
  // constants
  js = js.replace(/\bPI\b/g, 'Math.PI').replace(/\bEULER\b/g, 'Math.E');
  js = js.replace(/\bAVOGADRO\b/g, '6.02214076e23').replace(/\bPLANCK\b/g, '6.62607015e-34');
  js = js.replace(/\bBOLTZMANN\b/g, '1.380649e-23').replace(/\bGAS_R\b/g, '8.314462618');
  js = js.replace(/\bFARADAY\b/g, '96485.33212').replace(/\bSPEED_LIGHT\b/g, '299792458');
  js = js.replace(/\bATM_PA\b/g, '101325').replace(/\bWATER_Kw\b/g, '1e-14');
  // basic math
  js = js.replace(/√\(/g, 'Math.sqrt(');
  js = js.replace(/∛\(/g, 'Math.cbrt(');
  js = js.replace(/xⁿ/g, '**');
  js = js.replace(/\|([^|]+)\|/g, 'Math.abs($1)');
  js = js.replace(/\bln\(/g, 'Math.log(');
  js = js.replace(/\blog10\(/g, 'Math.log10(');
  js = js.replace(/\blog2\(/g, 'Math.log2(');
  js = js.replace(/\bexp\(/g, 'Math.exp(');
  js = js.replace(/\bfloor\(/g, 'Math.floor(');
  js = js.replace(/\bceil\(/g, 'Math.ceil(');
  js = js.replace(/\bround\(/g, 'Math.round(');
  js = js.replace(/\bmin\(/g, 'Math.min(');
  js = js.replace(/\bmax\(/g, 'Math.max(');
  // trig
  js = js.replace(/\bsin\(/g, 'Math.sin(');
  js = js.replace(/\bcos\(/g, 'Math.cos(');
  js = js.replace(/\btan\(/g, 'Math.tan(');
  js = js.replace(/\basin\(/g, 'Math.asin(');
  js = js.replace(/\bacos\(/g, 'Math.acos(');
  js = js.replace(/\batan\(/g, 'Math.atan(');
  // statistical helpers (multi-arg)
  const arrayFns: Record<string, string> = {
    'sum': '((...a)=>a.reduce((s,v)=>s+v,0))',
    'average': '((...a)=>a.reduce((s,v)=>s+v,0)/a.length)',
    'count': '((...a)=>a.length)',
    'median': '((...a)=>{a.sort((x,y)=>x-y);const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2})',
    'geoMean': '((...a)=>Math.pow(a.reduce((p,v)=>p*v,1),1/a.length))',
    'harmMean': '((...a)=>a.length/a.reduce((s,v)=>s+1/v,0))',
    'range': '((...a)=>Math.max(...a)-Math.min(...a))',
    'variance': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1)})',
    'stdDev': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))})',
    'popStdDev': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length)})',
    'cv': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return(Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))/m)*100})',
    'stdError': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))/Math.sqrt(a.length)})',
    'sumSq': '((...a)=>a.reduce((s,v)=>s+v*v,0))',
    'rss': '((...a)=>a.reduce((s,v)=>s+v*v,0))',
  };
  for (const [fn, impl] of Object.entries(arrayFns)) {
    const re = new RegExp(`\\b${fn}\\(`, 'g');
    js = js.replace(re, `${impl}(`);
  }
  // two-arg helpers
  js = js.replace(/\broundTo\(/g, '((v,p)=>+(Math.round(+(v+"e+"+p))+"e-"+p))(');
  js = js.replace(/\bclamp\(/g, '((v,lo,hi)=>Math.min(Math.max(v,lo),hi))(');
  js = js.replace(/\bpercentYield\(/g, '((a,t)=>(a/t)*100)(');
  js = js.replace(/\bpercentPurity\(/g, '((p,t)=>(p/t)*100)(');
  js = js.replace(/\bpercentError\(/g, '((exp,theo)=>Math.abs((exp-theo)/theo)*100)(');
  js = js.replace(/\bpercentDiff\(/g, '((a,b)=>Math.abs(a-b)/((a+b)/2)*100)(');
  js = js.replace(/\bpercentRecovery\(/g, '((f,i)=>(f/i)*100)(');
  js = js.replace(/\bmolarity\(/g, '((mol,L)=>mol/L)(');
  js = js.replace(/\bnormality\(/g, '((mol,L,n)=>(mol*n)/L)(');
  js = js.replace(/\bdilution\(/g, '((c1,v1,v2)=>(c1*v1)/v2)(');
  js = js.replace(/\bpH\(/g, '((h)=>-Math.log10(h))(');
  js = js.replace(/\bpOH\(/g, '((oh)=>-Math.log10(oh))(');
  return js;
}

function evaluateFormula(expression: string, variables: FormulaVariable[], values: Record<string, string>): number | null {
  try {
    let jsExpr = toJavaScript(expression);
    for (const v of variables) {
      const val = parseFloat(values[v.name] || v.defaultValue || '0');
      if (isNaN(val)) return null;
      jsExpr = jsExpr.replace(new RegExp(`\\b${v.name}\\b`, 'g'), val.toString());
    }
    const result = new Function(`"use strict"; return (${jsExpr});`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function makeDefaultValues(formula: SavedFormula): Record<string, string> {
  const vals: Record<string, string> = {};
  formula.variables.forEach(v => { if (v.defaultValue) vals[v.name] = v.defaultValue; });
  return vals;
}

function FormulaBlockCard({
  formula,
  block,
  onUpdateRow,
  onUpdateSampleId,
  onAddRow,
  onRemoveRow,
  onRemoveBlock,
}: {
  formula: SavedFormula;
  block: FormulaBlock;
  onUpdateRow: (rowId: string, field: string, value: string) => void;
  onUpdateSampleId: (rowId: string, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onRemoveBlock: () => void;
}) {
  const [cardLocked, setCardLocked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`glass-panel rounded-lg animate-fade-in ${cardLocked ? 'glow-border' : ''}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <button onClick={() => setCollapsed(c => !c)} className="flex items-center gap-2 min-w-0">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <FlaskConical className="w-3.5 h-3.5 text-primary shrink-0" />
          <h3 className="text-sm font-semibold text-foreground truncate">{formula.name}</h3>
        </button>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {!cardLocked && (
            <button
              onClick={onRemoveBlock}
              className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
              title="Remove this formula"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setCardLocked(l => !l)}
            className={`p-1.5 rounded-md transition-colors ${cardLocked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            title={cardLocked ? 'Unlock' : 'Lock'}
          >
            {cardLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-5 space-y-4">
          {formula.description && (
            <p className="text-xs text-muted-foreground">{formula.description}</p>
          )}
          <div className="p-2.5 rounded-md bg-muted/50 border border-border">
            <code className="text-xs font-mono text-primary">{formula.expression}</code>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sample</th>
                  {formula.variables.map(v => (
                    <th key={v.id} className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider" title={v.description}>
                      {v.name}
                    </th>
                  ))}
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => {
                  const result = evaluateFormula(formula.expression, formula.variables, row.values);
                  return (
                    <tr key={row.id} className="border-b border-border/50">
                      <td className="py-2 px-1">
                        <input
                          type="text"
                          value={row.sampleId}
                          onChange={(e) => onUpdateSampleId(row.id, e.target.value)}
                          disabled={cardLocked}
                          placeholder="ID"
                          className="w-20 bg-input border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      {formula.variables.map(v => (
                        <td key={v.id} className="py-2 px-1">
                          <input
                            type="number"
                            value={row.values[v.name] || ''}
                            onChange={(e) => onUpdateRow(row.id, v.name, e.target.value)}
                            disabled={cardLocked}
                            placeholder={v.defaultValue || '0'}
                            className="w-20 bg-input border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-2">
                        <span className="font-mono text-sm font-bold text-primary">
                          {result !== null ? result.toFixed(4) : '—'}
                        </span>
                      </td>
                      <td className="py-2 px-1">
                        {block.rows.length > 1 && !cardLocked && (
                          <button onClick={() => onRemoveRow(row.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!cardLocked && (
            <button
              onClick={onAddRow}
              className="w-full py-2 rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AnalyticalTestSection() {
  const [savedFormulas] = useLocalStorage<SavedFormula[]>('chem-formulas-v2', []);
  const [blocks, setBlocks] = useState<FormulaBlock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [globalLocked, setGlobalLocked] = useState(false);

  const filteredFormulas = useMemo(() => {
    if (!searchQuery.trim()) return savedFormulas;
    const q = searchQuery.toLowerCase();
    return savedFormulas.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.expression.toLowerCase().includes(q)
    );
  }, [savedFormulas, searchQuery]);

  const usedFormulaIds = useMemo(() => new Set(blocks.map(b => b.formulaId)), [blocks]);

  const addFormulaBlock = (formulaId: string) => {
    const formula = savedFormulas.find(f => f.id === formulaId);
    if (!formula) return;
    setBlocks(prev => [...prev, {
      formulaId,
      rows: [{ id: Date.now().toString(), sampleId: '', values: makeDefaultValues(formula) }],
    }]);
    setShowPicker(false);
    setSearchQuery('');
  };

  const removeBlock = (formulaId: string) => {
    setBlocks(prev => prev.filter(b => b.formulaId !== formulaId));
  };

  const addRowToBlock = (formulaId: string) => {
    const formula = savedFormulas.find(f => f.id === formulaId);
    if (!formula) return;
    setBlocks(prev => prev.map(b =>
      b.formulaId === formulaId
        ? { ...b, rows: [...b.rows, { id: Date.now().toString(), sampleId: '', values: makeDefaultValues(formula) }] }
        : b
    ));
  };

  const removeRowFromBlock = (formulaId: string, rowId: string) => {
    setBlocks(prev => prev.map(b =>
      b.formulaId === formulaId && b.rows.length > 1
        ? { ...b, rows: b.rows.filter(r => r.id !== rowId) }
        : b
    ));
  };

  const updateRowInBlock = (formulaId: string, rowId: string, field: string, value: string) => {
    setBlocks(prev => prev.map(b =>
      b.formulaId === formulaId
        ? { ...b, rows: b.rows.map(r => r.id === rowId ? { ...r, values: { ...r.values, [field]: value } } : r) }
        : b
    ));
  };

  const updateSampleIdInBlock = (formulaId: string, rowId: string, value: string) => {
    setBlocks(prev => prev.map(b =>
      b.formulaId === formulaId
        ? { ...b, rows: b.rows.map(r => r.id === rowId ? { ...r, sampleId: value } : r) }
        : b
    ));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Analytical Testing</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Add formulas and enter sample data</p>
          </div>
          <div className="flex items-center gap-1">
            {blocks.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                title="Remove All"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {savedFormulas.length > 0 && savedFormulas.length > blocks.length && (
              <button
                onClick={() => setShowPicker(p => !p)}
                className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors"
                title="Add Formula"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-5">
          {savedFormulas.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              No formulas saved yet. Go to <span className="font-semibold text-primary">Formulas</span> to create one.
            </p>
          ) : blocks.length === 0 && !showPicker ? (
            <p className="text-muted-foreground text-sm text-center py-4">Click <Plus className="w-3.5 h-3.5 inline" /> above to add a formula.</p>
          ) : null}

          {/* Formula picker */}
          {showPicker && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search formulas..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  autoFocus
                />
                <button onClick={() => { setShowPicker(false); setSearchQuery(''); }} className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredFormulas.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No formulas match your search.</p>
                ) : (
                  filteredFormulas.map(f => {
                    const alreadyUsed = usedFormulaIds.has(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() => !alreadyUsed && addFormulaBlock(f.id)}
                        disabled={alreadyUsed}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b border-border/50 last:border-b-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-2">
                          <FlaskConical className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-sm font-medium text-foreground">{f.name}</span>
                          {alreadyUsed && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Added</span>}
                        </div>
                        {f.description && <p className="text-xs text-muted-foreground mt-0.5 ml-5.5">{f.description}</p>}
                        <code className="text-[10px] font-mono text-muted-foreground mt-1 ml-5.5 block truncate">{f.expression}</code>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear All confirmation - at the top */}
      {showClearConfirm && (
        <div className="glass-panel rounded-lg p-5 border border-destructive/30 animate-fade-in">
          <p className="text-sm text-foreground font-medium mb-1">Remove all formulas?</p>
          <p className="text-xs text-muted-foreground mb-4">This will remove all formula blocks and their sample data from this page.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBlocks([]); setShowClearConfirm(false); }}
              className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              Yes, Clear All
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Render each formula block */}
      {blocks.map(block => {
        const formula = savedFormulas.find(f => f.id === block.formulaId);
        if (!formula) return null;
        return (
          <FormulaBlockCard
            key={block.formulaId}
            formula={formula}
            block={block}
            onUpdateRow={(rowId, field, value) => updateRowInBlock(block.formulaId, rowId, field, value)}
            onUpdateSampleId={(rowId, value) => updateSampleIdInBlock(block.formulaId, rowId, value)}
            onAddRow={() => addRowToBlock(block.formulaId)}
            onRemoveRow={(rowId) => removeRowFromBlock(block.formulaId, rowId)}
            onRemoveBlock={() => removeBlock(block.formulaId)}
          />
        );
      })}
    </div>
  );
}
