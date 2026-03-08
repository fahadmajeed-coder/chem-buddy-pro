import { useState, useRef, DragEvent } from 'react';
import { Plus, Trash2, Save, Check, X, Variable, Calculator, Search, GripVertical, FlaskConical, Play, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface FormulaVariable {
  id: string;
  name: string;
  description: string;
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

interface Operation {
  token: string;       // what gets inserted into the expression (human-readable)
  name: string;        // searchable display name
  description: string; // tooltip / search hint
  category: string;
  icon?: string;       // visual symbol shown on button
}

// All operations use HUMAN-READABLE tokens. We convert to JS only at evaluation time.
const OPERATIONS: Operation[] = [
  // Basic Math
  { token: '+', icon: '+', name: 'Add', description: 'Add two values together', category: 'Basic Math' },
  { token: '-', icon: '−', name: 'Subtract', description: 'Subtract one value from another', category: 'Basic Math' },
  { token: '*', icon: '×', name: 'Multiply', description: 'Multiply two values', category: 'Basic Math' },
  { token: '/', icon: '÷', name: 'Divide', description: 'Divide one value by another', category: 'Basic Math' },
  { token: '^', icon: 'xⁿ', name: 'Power', description: 'Raise to a power (e.g. x ^ 2 means x squared)', category: 'Basic Math' },
  { token: 'mod', icon: '%', name: 'Remainder', description: 'Remainder after division', category: 'Basic Math' },
  // Grouping
  { token: '(', icon: '(', name: 'Open Bracket', description: 'Start grouping — calculate this part first', category: 'Grouping' },
  { token: ')', icon: ')', name: 'Close Bracket', description: 'End grouping', category: 'Grouping' },
  // Common Functions (shown as friendly names)
  { token: 'sqrt(', icon: '√', name: 'Square Root', description: 'Square root of a number', category: 'Functions' },
  { token: 'abs(', icon: '|x|', name: 'Absolute Value', description: 'Make negative numbers positive', category: 'Functions' },
  { token: 'round(', icon: '≈', name: 'Round', description: 'Round to the nearest whole number', category: 'Functions' },
  { token: 'roundUp(', icon: '⌈x⌉', name: 'Round Up', description: 'Always round up to the next whole number', category: 'Functions' },
  { token: 'roundDown(', icon: '⌊x⌋', name: 'Round Down', description: 'Always round down to the previous whole number', category: 'Functions' },
  { token: 'log(', icon: 'log', name: 'Logarithm (base 10)', description: 'Log base 10 — common in pH calculations', category: 'Functions' },
  { token: 'ln(', icon: 'ln', name: 'Natural Logarithm', description: 'Log base e (≈ 2.718)', category: 'Functions' },
  { token: 'exp(', icon: 'eˣ', name: 'Exponential', description: 'e raised to a power — used in decay/growth', category: 'Functions' },
  { token: 'sin(', icon: 'sin', name: 'Sine', description: 'Sine function (input in radians)', category: 'Trigonometry' },
  { token: 'cos(', icon: 'cos', name: 'Cosine', description: 'Cosine function (input in radians)', category: 'Trigonometry' },
  { token: 'tan(', icon: 'tan', name: 'Tangent', description: 'Tangent function (input in radians)', category: 'Trigonometry' },
  // Constants
  { token: 'π', icon: 'π', name: 'Pi', description: '3.14159... — ratio of circumference to diameter', category: 'Constants' },
  { token: 'e', icon: 'e', name: "Euler's Number", description: '2.71828... — base of natural logarithm', category: 'Constants' },
];

/**
 * Convert human-readable expression → JavaScript for evaluation
 * Users never see Math.*, they write sqrt(, log(, ^, etc.
 */
function toJavaScript(expr: string): string {
  return expr
    .replace(/\bsqrt\(/g, 'Math.sqrt(')
    .replace(/\babs\(/g, 'Math.abs(')
    .replace(/\broundUp\(/g, 'Math.ceil(')
    .replace(/\broundDown\(/g, 'Math.floor(')
    .replace(/\bround\(/g, 'Math.round(')
    .replace(/\blog\(/g, 'Math.log10(')
    .replace(/\bln\(/g, 'Math.log(')
    .replace(/\bexp\(/g, 'Math.exp(')
    .replace(/\bsin\(/g, 'Math.sin(')
    .replace(/\bcos\(/g, 'Math.cos(')
    .replace(/\btan\(/g, 'Math.tan(')
    .replace(/π/g, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/\^/g, '**')
    .replace(/\bmod\b/g, '%');
}

export function FormulaBuilder() {
  const [variables, setVariables] = useState<FormulaVariable[]>([
    { id: 'v1', name: 'x', description: '', testValue: '' },
    { id: 'v2', name: 'y', description: '', testValue: '' },
  ]);
  const [expression, setExpression] = useState('');
  const [formulaName, setFormulaName] = useState('');
  const [formulaDesc, setFormulaDesc] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);
  const [opSearch, setOpSearch] = useState('');
  const [showOpPanel, setShowOpPanel] = useState(true);
  const [savedFormulas, setSavedFormulas] = useLocalStorage<SavedFormula[]>('chem-formulas-v2', []);
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null);
  const [newVarName, setNewVarName] = useState('');
  const [newVarDesc, setNewVarDesc] = useState('');
  const expressionRef = useRef<HTMLTextAreaElement>(null);
  const [draggedVar, setDraggedVar] = useState<string | null>(null);

  // --- Variable Management ---
  const addVariable = () => {
    const name = newVarName.trim();
    if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return;
    if (variables.some(v => v.name === name)) return;
    // Prevent reserved words
    const reserved = ['sqrt', 'abs', 'round', 'roundUp', 'roundDown', 'log', 'ln', 'exp', 'sin', 'cos', 'tan', 'mod', 'pi', 'e'];
    if (reserved.includes(name.toLowerCase())) return;
    setVariables(prev => [...prev, { id: `v-${Date.now()}`, name, description: newVarDesc.trim(), testValue: '' }]);
    setNewVarName('');
    setNewVarDesc('');
  };

  const removeVariable = (id: string) => {
    if (variables.length <= 1) return;
    setVariables(prev => prev.filter(v => v.id !== id));
  };

  const updateVariable = (id: string, field: keyof FormulaVariable, val: string) => {
    setVariables(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v));
  };

  // --- Drag & Drop ---
  const handleDragStart = (ev: DragEvent, varName: string) => {
    ev.dataTransfer.setData('text/plain', varName);
    setDraggedVar(varName);
  };
  const handleDragEnd = () => setDraggedVar(null);
  const handleDrop = (ev: DragEvent) => {
    ev.preventDefault();
    const varName = ev.dataTransfer.getData('text/plain');
    if (varName) insertToken(varName);
    setDraggedVar(null);
  };
  const handleDragOver = (ev: DragEvent) => ev.preventDefault();

  // --- Expression ---
  const insertToken = (token: string) => {
    const ta = expressionRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = expression.slice(0, start);
      const after = expression.slice(end);
      const pad = before && !before.endsWith(' ') && !before.endsWith('(') ? ' ' : '';
      const newExpr = before + pad + token + ' ' + after;
      setExpression(newExpr);
      setTestPassed(null); setTestResult(null); setTestError(null);
      setTimeout(() => {
        const pos = (before + pad + token + ' ').length;
        ta.focus();
        ta.setSelectionRange(pos, pos);
      }, 0);
    } else {
      setExpression(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('(') ? ' ' : '') + token + ' ');
      setTestPassed(null); setTestResult(null); setTestError(null);
    }
  };

  // --- Test Formula ---
  const testFormula = () => {
    setTestError(null);
    setTestResult(null);
    setTestPassed(null);

    const rawExpr = expression.trim();
    if (!rawExpr) { setTestError('Write a formula expression first'); return; }

    // Check all variables have test values
    for (const v of variables) {
      if (rawExpr.includes(v.name) && v.testValue.trim() === '') {
        setTestError(`Give "${v.name}" a test value to run the formula`);
        return;
      }
    }

    // Replace variables with test values (longest first)
    let expr = rawExpr;
    const sorted = [...variables].sort((a, b) => b.name.length - a.name.length);
    for (const v of sorted) {
      const val = parseFloat(v.testValue);
      if (expr.includes(v.name) && isNaN(val)) {
        setTestError(`"${v.name}" must be a number`);
        return;
      }
      expr = expr.replace(new RegExp(`\\b${v.name}\\b`, 'g'), `(${val})`);
    }

    // Convert human-readable → JS
    const jsExpr = toJavaScript(expr);

    // Validate sanitized expression
    const sanitized = jsExpr.replace(/Math\.(sqrt|abs|log10|log|exp|round|floor|ceil|sin|cos|tan|PI|E)/g, '0');
    if (!/^[\d\s+\-*/%().**,]+$/.test(sanitized)) {
      setTestError('Something looks wrong in the expression. Check for unsupported characters.');
      return;
    }

    try {
      const fn = new Function(`"use strict"; return (${jsExpr});`);
      const res = fn();

      if (typeof res !== 'number' || !isFinite(res)) {
        setTestError('Result is not a valid number (got Infinity or undefined)');
        setTestPassed(false);
        return;
      }

      const formatted = res % 1 === 0 ? res.toString() : res.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
      setTestResult(formatted);
      setTestPassed(true);
    } catch (err: any) {
      setTestError(`Could not calculate: ${err.message}`);
      setTestPassed(false);
    }
  };

  // --- Save ---
  const saveFormula = () => {
    if (!formulaName.trim() || !expression.trim()) return;
    if (testPassed !== true) {
      setTestError('Test the formula first — it must pass before saving');
      return;
    }
    const formula: SavedFormula = {
      id: `f-${Date.now()}`,
      name: formulaName.trim(),
      description: formulaDesc.trim(),
      expression,
      variables: variables.map(v => ({ ...v, testValue: '' })),
      createdAt: Date.now(),
    };
    setSavedFormulas(prev => [formula, ...prev]);
    setFormulaName('');
    setFormulaDesc('');
    setExpression('');
    setVariables([{ id: 'v1', name: 'x', description: '', testValue: '' }, { id: 'v2', name: 'y', description: '', testValue: '' }]);
    setTestResult(null);
    setTestError(null);
    setTestPassed(null);
  };

  const deleteFormula = (id: string) => {
    setSavedFormulas(prev => prev.filter(f => f.id !== id));
  };

  const loadFormula = (f: SavedFormula) => {
    setExpression(f.expression);
    setVariables(f.variables.map(v => ({ ...v, testValue: '' })));
    setFormulaName(f.name);
    setFormulaDesc(f.description);
    setTestResult(null);
    setTestError(null);
    setTestPassed(null);
  };

  // --- Filtered operations ---
  const filteredOps = opSearch
    ? OPERATIONS.filter(op =>
        op.name.toLowerCase().includes(opSearch.toLowerCase()) ||
        op.token.toLowerCase().includes(opSearch.toLowerCase()) ||
        op.description.toLowerCase().includes(opSearch.toLowerCase())
      )
    : OPERATIONS;

  const groupedOps = filteredOps.reduce<Record<string, Operation[]>>((acc, op) => {
    (acc[op.category] = acc[op.category] || []).push(op);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step 1: Define Variables */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Variable className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 1 — Define Your Variables</h3>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Drag into formula below</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Existing variables as draggable chips */}
          <div className="flex flex-wrap gap-2">
            {variables.map(v => (
              <div
                key={v.id}
                draggable
                onDragStart={ev => handleDragStart(ev, v.name)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-2 px-3 py-2 rounded-md border cursor-grab active:cursor-grabbing transition-all ${
                  draggedVar === v.name
                    ? 'border-primary bg-primary/20 scale-95'
                    : 'border-border bg-secondary/50 hover:border-primary/40'
                }`}
              >
                <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                <span className="font-mono text-sm font-medium text-primary">{v.name}</span>
                {v.description && (
                  <span className="text-[10px] text-muted-foreground max-w-[120px] truncate">({v.description})</span>
                )}
                {variables.length > 1 && (
                  <button onClick={() => removeVariable(v.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add new variable */}
          <div className="flex items-end gap-2 pt-2 border-t border-border/50">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Name</label>
              <input
                value={newVarName}
                onChange={ev => setNewVarName(ev.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="e.g. mass, volume, density"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={ev => ev.key === 'Enter' && addVariable()}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">What is it? (optional)</label>
              <input
                value={newVarDesc}
                onChange={ev => setNewVarDesc(ev.target.value)}
                placeholder="e.g. mass in grams"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={ev => ev.key === 'Enter' && addVariable()}
              />
            </div>
            <button
              onClick={addVariable}
              disabled={!newVarName.trim() || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newVarName.trim()) || variables.some(v => v.name === newVarName.trim())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Give each input a name (letters, numbers, underscores). Example: <span className="font-mono text-primary">mass</span>, <span className="font-mono text-primary">volume_ml</span>, <span className="font-mono text-primary">purity</span>
          </p>
        </div>
      </div>

      {/* Step 2: Build Expression */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 2 — Build Your Formula</h3>
          </div>
          <button
            onClick={() => setShowOpPanel(!showOpPanel)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-3 h-3" />
            {showOpPanel ? 'Hide' : 'Show'} Math Operations
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Operations panel */}
          {showOpPanel && (
            <div className="border border-border rounded-md bg-secondary/30 overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={opSearch}
                    onChange={ev => setOpSearch(ev.target.value)}
                    placeholder="Search... (e.g. square root, divide, round up)"
                    className="w-full bg-input border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto p-2 space-y-3">
                {Object.entries(groupedOps).map(([category, ops]) => (
                  <div key={category}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-1.5">{category}</p>
                    <div className="flex flex-wrap gap-1">
                      {ops.map(op => (
                        <button
                          key={op.token}
                          onClick={() => insertToken(op.token)}
                          title={op.description}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/30 transition-colors group"
                        >
                          <span className="font-mono text-primary text-sm">{op.icon || op.token}</span>
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors">{op.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredOps.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">No matching operations found</p>
                )}
              </div>
            </div>
          )}

          {/* Quick variable buttons */}
          <div className="flex flex-wrap gap-1.5">
            {variables.map(v => (
              <button
                key={v.id}
                onClick={() => insertToken(v.name)}
                className="px-3 py-1.5 rounded-md text-sm font-mono bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                title={v.description || v.name}
              >
                {v.name}
              </button>
            ))}
            <span className="text-[10px] text-muted-foreground self-center ml-2">← click or drag into formula</span>
          </div>

          {/* Expression textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Formula</label>
            <textarea
              ref={expressionRef}
              value={expression}
              onChange={ev => { setExpression(ev.target.value); setTestPassed(null); setTestResult(null); setTestError(null); }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder={'Click the operations above or type directly.\nExample: mass / (molWeight × volume)'}
              rows={3}
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
            />
            {expression && (
              <div className="px-3 py-2 rounded-md bg-secondary/50 border border-border flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground shrink-0">Your formula:</span>
                <span className="text-sm font-mono text-foreground">{expression.replace(/\*/g, '×').replace(/\//g, '÷')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 3: Test */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 3 — Test It</h3>
          </div>
          {testPassed === true && (
            <span className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--success))]">
              <Check className="w-3.5 h-3.5" /> Looks good!
            </span>
          )}
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">Put in some sample numbers to make sure your formula gives the right answer.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {variables.map(v => (
              <div key={v.id} className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {v.name} {v.description && <span className="normal-case">({v.description})</span>}
                </label>
                <input
                  type="number"
                  value={v.testValue}
                  onChange={ev => updateVariable(v.id, 'testValue', ev.target.value)}
                  placeholder="Enter a number"
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>

          <button
            onClick={testFormula}
            disabled={!expression.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" /> Test Formula
          </button>

          {testError && (
            <div className="px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {testError}
            </div>
          )}

          {testResult !== null && (
            <div className="px-5 py-4 rounded-md bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 flex items-center gap-3">
              <Check className="w-5 h-5 text-[hsl(var(--success))]" />
              <div>
                <p className="text-xs text-muted-foreground">Answer:</p>
                <p className="font-mono text-xl font-bold text-foreground">{testResult}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 4: Name & Save */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <Save className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Step 4 — Save Your Formula</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Formula Name *</label>
            <input
              value={formulaName}
              onChange={ev => setFormulaName(ev.target.value)}
              placeholder="e.g. Calculate Molarity from Mass"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Description — what does it do?</label>
            <textarea
              value={formulaDesc}
              onChange={ev => setFormulaDesc(ev.target.value)}
              placeholder="Describe when you'd use this formula and what it calculates..."
              rows={2}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <button
            onClick={saveFormula}
            disabled={!formulaName.trim() || !expression.trim() || testPassed !== true}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" /> Save Formula
          </button>
          {testPassed !== true && expression.trim() && (
            <p className="text-[10px] text-[hsl(var(--warning))]">⚠ Test the formula first before saving</p>
          )}
        </div>
      </div>

      {/* Saved Formulas */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">My Formulas</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">{savedFormulas.length} saved</span>
        </div>
        <div className="p-5">
          {savedFormulas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No formulas saved yet. Create your first one above!</p>
          ) : (
            <div className="space-y-2">
              {savedFormulas.map(f => (
                <div key={f.id} className="rounded-md border border-border hover:border-primary/30 transition-colors overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedFormula(expandedFormula === f.id ? null : f.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{f.name}</p>
                      <p className="text-xs font-mono text-primary mt-0.5 truncate">{f.expression.replace(/\*/g, '×').replace(/\//g, '÷')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={ev => { ev.stopPropagation(); loadFormula(f); }}
                        className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={ev => { ev.stopPropagation(); deleteFormula(f.id); }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {expandedFormula === f.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedFormula === f.id && (
                    <div className="px-4 pb-3 space-y-2 border-t border-border/50 pt-2">
                      {f.description && (
                        <p className="text-xs text-muted-foreground">{f.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {f.variables.map(v => (
                          <span key={v.id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                            {v.name}{v.description ? ` — ${v.description}` : ''}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Saved {new Date(f.createdAt).toLocaleDateString()}
                      </p>
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
