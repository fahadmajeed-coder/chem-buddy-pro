import { useState, useMemo } from 'react';
import { CalculatorCard } from './CalculatorCard';
import { Plus, Trash2, FlaskConical, ChevronDown } from 'lucide-react';
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
  values: Record<string, string>; // variable name -> value
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

export function AnalyticalTestSection() {
  const [locked, setLocked] = useState(false);
  const [savedFormulas] = useLocalStorage<SavedFormula[]>('chem-formulas-v2', []);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('');
  const [rows, setRows] = useState<SampleRow[]>([
    { id: '1', sampleId: '', values: {} }
  ]);

  const selectedFormula = useMemo(
    () => savedFormulas.find(f => f.id === selectedFormulaId) || null,
    [savedFormulas, selectedFormulaId]
  );

  const addRow = () => {
    const defaultValues: Record<string, string> = {};
    if (selectedFormula) {
      selectedFormula.variables.forEach(v => {
        if (v.defaultValue) defaultValues[v.name] = v.defaultValue;
      });
    }
    setRows(prev => [...prev, { id: Date.now().toString(), sampleId: '', values: defaultValues }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: string, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, values: { ...r.values, [field]: value } } : r));
  };

  const updateSampleId = (id: string, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, sampleId: value } : r));
  };

  const handleFormulaChange = (formulaId: string) => {
    setSelectedFormulaId(formulaId);
    const formula = savedFormulas.find(f => f.id === formulaId);
    if (formula) {
      const defaultValues: Record<string, string> = {};
      formula.variables.forEach(v => {
        if (v.defaultValue) defaultValues[v.name] = v.defaultValue;
      });
      setRows([{ id: '1', sampleId: '', values: defaultValues }]);
    } else {
      setRows([{ id: '1', sampleId: '', values: {} }]);
    }
  };

  const handleReset = () => {
    if (locked) return;
    const defaultValues: Record<string, string> = {};
    if (selectedFormula) {
      selectedFormula.variables.forEach(v => {
        if (v.defaultValue) defaultValues[v.name] = v.defaultValue;
      });
    }
    setRows([{ id: '1', sampleId: '', values: defaultValues }]);
  };

  return (
    <div className="space-y-4">
      <CalculatorCard
        title="Analytical Testing"
        subtitle="Select a formula and enter sample data"
        locked={locked}
        onToggleLock={() => setLocked(!locked)}
        onReset={handleReset}
      >
        {/* Formula selector */}
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Select Formula
          </label>
          <div className="relative">
            <select
              value={selectedFormulaId}
              onChange={(e) => handleFormulaChange(e.target.value)}
              disabled={locked}
              className="w-full appearance-none bg-input border border-border rounded-md px-3 py-2.5 pr-8 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="">— Choose a saved formula —</option>
              {savedFormulas.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {savedFormulas.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              No formulas saved yet. Go to <span className="font-semibold text-primary">Formulas</span> to create one.
            </p>
          )}
        </div>

        {selectedFormula && (
          <>
            {/* Formula info */}
            <div className="mb-4 p-3 rounded-md bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">{selectedFormula.name}</span>
              </div>
              {selectedFormula.description && (
                <p className="text-xs text-muted-foreground mb-2">{selectedFormula.description}</p>
              )}
              <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-1 rounded block">
                {selectedFormula.expression}
              </code>
            </div>

            {/* Data table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sample</th>
                    {selectedFormula.variables.map(v => (
                      <th key={v.id} className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider" title={v.description}>
                        {v.name}
                      </th>
                    ))}
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</th>
                    <th className="py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const result = evaluateFormula(selectedFormula.expression, selectedFormula.variables, row.values);
                    return (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="py-2 px-1">
                          <input
                            type="text"
                            value={row.sampleId}
                            onChange={(e) => updateSampleId(row.id, e.target.value)}
                            disabled={locked}
                            placeholder="ID"
                            className="w-20 bg-input border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        {selectedFormula.variables.map(v => (
                          <td key={v.id} className="py-2 px-1">
                            <input
                              type="number"
                              value={row.values[v.name] || ''}
                              onChange={(e) => updateRow(row.id, v.name, e.target.value)}
                              disabled={locked}
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
                          {rows.length > 1 && !locked && (
                            <button onClick={() => removeRow(row.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors">
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
          </>
        )}

        {!selectedFormula && selectedFormulaId === '' && savedFormulas.length > 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Select a formula above to start entering sample data.
          </div>
        )}
      </CalculatorCard>

      {selectedFormula && (
        <button
          onClick={addRow}
          disabled={locked}
          className="w-full py-3 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add Sample Row
        </button>
      )}
    </div>
  );
}
