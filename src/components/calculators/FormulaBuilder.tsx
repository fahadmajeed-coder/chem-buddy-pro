import { useState } from 'react';
import { Plus, Trash2, Play, Save, Copy, Check, X, Variable, Calculator } from 'lucide-react';

interface FormulaVariable {
  name: string;
  value: string;
}

interface SavedFormula {
  id: string;
  name: string;
  expression: string;
  variables: string[];
}

const OPERATORS = ['+', '-', '*', '/', '%', '**', '(', ')'];

export function FormulaBuilder() {
  const [variables, setVariables] = useState<FormulaVariable[]>([
    { name: 'x', value: '' },
    { name: 'y', value: '' },
  ]);
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formulaName, setFormulaName] = useState('');
  const [savedFormulas, setSavedFormulas] = useState<SavedFormula[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('chem-formulas') || '[]');
    } catch { return []; }
  });
  const [copied, setCopied] = useState(false);

  const nextVarName = () => {
    const used = new Set(variables.map(v => v.name));
    for (const c of 'xyzabcdefghijklmnopqrstuvw') {
      if (!used.has(c)) return c;
    }
    return `v${variables.length + 1}`;
  };

  const addVariable = () => {
    setVariables(prev => [...prev, { name: nextVarName(), value: '' }]);
  };

  const removeVariable = (idx: number) => {
    if (variables.length <= 1) return;
    setVariables(prev => prev.filter((_, i) => i !== idx));
  };

  const updateVariable = (idx: number, field: 'name' | 'value', val: string) => {
    setVariables(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
  };

  const insertIntoExpression = (token: string) => {
    setExpression(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('(') ? ' ' : '') + token + ' ');
  };

  const evaluate = () => {
    setError(null);
    setResult(null);
    try {
      let expr = expression.trim();
      if (!expr) { setError('Enter an expression'); return; }

      // Replace variable names with values
      for (const v of variables) {
        const val = parseFloat(v.value);
        if (expr.includes(v.name) && isNaN(val)) {
          setError(`Variable "${v.name}" has no value`);
          return;
        }
        // Replace whole-word variable references
        expr = expr.replace(new RegExp(`\\b${v.name}\\b`, 'g'), `(${val})`);
      }

      // Validate: only allow numbers, operators, parens, dots, spaces
      if (!/^[\d\s+\-*/%().**]+$/.test(expr)) {
        setError('Invalid characters in expression');
        return;
      }

      // Use Function constructor for safe-ish evaluation
      const fn = new Function(`"use strict"; return (${expr});`);
      const res = fn();

      if (typeof res !== 'number' || !isFinite(res)) {
        setError('Result is not a valid number');
        return;
      }

      setResult(res % 1 === 0 ? res.toString() : res.toFixed(6).replace(/0+$/, '').replace(/\.$/, ''));
    } catch (e: any) {
      setError(`Evaluation error: ${e.message}`);
    }
  };

  const saveFormula = () => {
    if (!formulaName.trim() || !expression.trim()) return;
    const formula: SavedFormula = {
      id: `f-${Date.now()}`,
      name: formulaName,
      expression,
      variables: variables.map(v => v.name),
    };
    const updated = [...savedFormulas, formula];
    setSavedFormulas(updated);
    localStorage.setItem('chem-formulas', JSON.stringify(updated));
    setFormulaName('');
  };

  const loadFormula = (f: SavedFormula) => {
    setExpression(f.expression);
    setVariables(f.variables.map(name => ({ name, value: '' })));
    setResult(null);
    setError(null);
  };

  const deleteFormula = (id: string) => {
    const updated = savedFormulas.filter(f => f.id !== id);
    setSavedFormulas(updated);
    localStorage.setItem('chem-formulas', JSON.stringify(updated));
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const clearAll = () => {
    setExpression('');
    setResult(null);
    setError(null);
    setVariables([{ name: 'x', value: '' }, { name: 'y', value: '' }]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Variables Section */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Variable className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Variables</h3>
          </div>
          <button
            onClick={addVariable}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Variable
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {variables.map((v, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-secondary/50 rounded-md p-2">
              <input
                value={v.name}
                onChange={e => updateVariable(idx, 'name', e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3))}
                className="w-10 bg-input border border-border rounded px-2 py-1.5 text-sm font-mono text-primary text-center focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-muted-foreground text-xs">=</span>
              <input
                type="number"
                value={v.value}
                onChange={e => updateVariable(idx, 'value', e.target.value)}
                placeholder="0"
                className="flex-1 min-w-0 bg-input border border-border rounded px-2 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {variables.length > 1 && (
                <button onClick={() => removeVariable(idx)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Expression Builder */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Expression</h3>
          </div>
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear All
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Quick insert buttons */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Variables</p>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => insertIntoExpression(v.name)}
                  className="px-3 py-1.5 rounded-md text-sm font-mono bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Operators</p>
            <div className="flex flex-wrap gap-1.5">
              {OPERATORS.map(op => (
                <button
                  key={op}
                  onClick={() => insertIntoExpression(op)}
                  className="px-3 py-1.5 rounded-md text-sm font-mono bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors"
                >
                  {op === '**' ? '^' : op === '%' ? 'mod' : op}
                </button>
              ))}
            </div>
          </div>

          {/* Expression input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Formula Expression</label>
            <div className="flex gap-2">
              <input
                value={expression}
                onChange={e => setExpression(e.target.value)}
                placeholder="e.g. x * y / z  or  (x + y) ** 2"
                className="flex-1 bg-input border border-border rounded-md px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
              <button
                onClick={evaluate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Play className="w-4 h-4" /> Run
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Use +, -, *, /, % (mod), ** (power), and parentheses. Type directly or click buttons above.
            </p>
          </div>

          {/* Result */}
          {error && (
            <div className="px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          {result !== null && (
            <div className="px-5 py-4 rounded-md bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground mr-2">Result:</span>
                <span className="font-mono text-2xl font-bold text-primary">{result}</span>
              </div>
              <button onClick={copyResult} className="p-2 rounded-md text-muted-foreground hover:text-primary transition-colors">
                {copied ? <Check className="w-4 h-4 text-[hsl(var(--success))]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save & Load */}
      <div className="glass-panel rounded-lg">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Saved Formulas</h3>
        </div>
        <div className="p-5 space-y-4">
          {/* Save current */}
          <div className="flex gap-2">
            <input
              value={formulaName}
              onChange={e => setFormulaName(e.target.value)}
              placeholder="Formula name..."
              className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={saveFormula}
              disabled={!formulaName.trim() || !expression.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>

          {/* Saved list */}
          {savedFormulas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No saved formulas yet</p>
          ) : (
            <div className="space-y-2">
              {savedFormulas.map(f => (
                <div
                  key={f.id}
                  className="flex items-center justify-between px-4 py-3 rounded-md bg-secondary/50 border border-border hover:border-primary/30 transition-colors group"
                >
                  <button onClick={() => loadFormula(f)} className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{f.name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      {f.expression} <span className="text-muted-foreground/50">({f.variables.join(', ')})</span>
                    </p>
                  </button>
                  <button
                    onClick={() => deleteFormula(f.id)}
                    className="p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
