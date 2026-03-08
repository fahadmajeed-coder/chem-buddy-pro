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
  symbol: string;
  name: string;
  description: string;
  category: string;
}

const OPERATIONS: Operation[] = [
  // Arithmetic
  { symbol: '+', name: 'Addition', description: 'Add two values', category: 'Arithmetic' },
  { symbol: '-', name: 'Subtraction', description: 'Subtract two values', category: 'Arithmetic' },
  { symbol: '*', name: 'Multiplication', description: 'Multiply two values', category: 'Arithmetic' },
  { symbol: '/', name: 'Division', description: 'Divide two values', category: 'Arithmetic' },
  { symbol: '%', name: 'Modulo', description: 'Remainder after division', category: 'Arithmetic' },
  { symbol: '**', name: 'Power / Exponent', description: 'Raise to a power (e.g. x ** 2)', category: 'Arithmetic' },
  // Grouping
  { symbol: '(', name: 'Open Parenthesis', description: 'Start a group', category: 'Grouping' },
  { symbol: ')', name: 'Close Parenthesis', description: 'End a group', category: 'Grouping' },
  // Math functions
  { symbol: 'Math.sqrt(', name: 'Square Root', description: 'Square root of a value', category: 'Functions' },
  { symbol: 'Math.abs(', name: 'Absolute Value', description: 'Absolute (positive) value', category: 'Functions' },
  { symbol: 'Math.log10(', name: 'Log Base 10', description: 'Logarithm base 10', category: 'Functions' },
  { symbol: 'Math.log(', name: 'Natural Log (ln)', description: 'Natural logarithm', category: 'Functions' },
  { symbol: 'Math.exp(', name: 'Exponential (e^x)', description: 'e raised to the power', category: 'Functions' },
  { symbol: 'Math.round(', name: 'Round', description: 'Round to nearest integer', category: 'Functions' },
  { symbol: 'Math.floor(', name: 'Floor', description: 'Round down to integer', category: 'Functions' },
  { symbol: 'Math.ceil(', name: 'Ceiling', description: 'Round up to integer', category: 'Functions' },
  { symbol: 'Math.sin(', name: 'Sine', description: 'Sine (radians)', category: 'Functions' },
  { symbol: 'Math.cos(', name: 'Cosine', description: 'Cosine (radians)', category: 'Functions' },
  { symbol: 'Math.tan(', name: 'Tangent', description: 'Tangent (radians)', category: 'Functions' },
  // Constants
  { symbol: 'Math.PI', name: 'Pi (π)', description: '3.14159...', category: 'Constants' },
  { symbol: 'Math.E', name: "Euler's Number (e)", description: '2.71828...', category: 'Constants' },
];

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
  const [showOpPanel, setShowOpPanel] = useState(false);
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
  const handleDragStart = (e: DragEvent, varName: string) => {
    e.dataTransfer.setData('text/plain', varName);
    setDraggedVar(varName);
  };

  const handleDragEnd = () => setDraggedVar(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const varName = e.dataTransfer.getData('text/plain');
    if (varName) insertToken(varName);
    setDraggedVar(null);
  };

  const handleDragOver = (e: DragEvent) => e.preventDefault();

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
      setTimeout(() => {
        const pos = (before + pad + token + ' ').length;
        ta.focus();
        ta.setSelectionRange(pos, pos);
      }, 0);
    } else {
      setExpression(prev => prev + (prev && !prev.endsWith(' ') && !prev.endsWith('(') ? ' ' : '') + token + ' ');
    }
  };

  // --- Test Formula ---
  const testFormula = () => {
    setTestError(null);
    setTestResult(null);
    setTestPassed(null);

    let expr = expression.trim();
    if (!expr) { setTestError('Enter an expression first'); return; }

    // Check all variables have test values
    for (const v of variables) {
      if (expr.includes(v.name) && v.testValue.trim() === '') {
        setTestError(`Variable "${v.name}" needs a test value`);
        return;
      }
    }

    // Replace variable names with test values (longest first to avoid partial replacement)
    const sorted = [...variables].sort((a, b) => b.name.length - a.name.length);
    for (const v of sorted) {
      const val = parseFloat(v.testValue);
      if (expr.includes(v.name) && isNaN(val)) {
        setTestError(`Variable "${v.name}" test value is not a number`);
        return;
      }
      expr = expr.replace(new RegExp(`\\b${v.name}\\b`, 'g'), `(${val})`);
    }

    // Validate: only allow numbers, operators, parens, dots, spaces, Math.*
    const sanitized = expr.replace(/Math\.(sqrt|abs|log10|log|exp|round|floor|ceil|sin|cos|tan|PI|E)/g, '0');
    if (!/^[\d\s+\-*/%().**,]+$/.test(sanitized)) {
      setTestError('Invalid characters in expression');
      return;
    }

    try {
      const fn = new Function(`"use strict"; return (${expr});`);
      const res = fn();

      if (typeof res !== 'number' || !isFinite(res)) {
        setTestError('Result is not a valid number (Infinity or NaN)');
        setTestPassed(false);
        return;
      }

      const formatted = res % 1 === 0 ? res.toString() : res.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
      setTestResult(formatted);
      setTestPassed(true);
    } catch (e: any) {
      setTestError(`Error: ${e.message}`);
      setTestPassed(false);
    }
  };

  // --- Save ---
  const saveFormula = () => {
    if (!formulaName.trim() || !expression.trim()) return;
    if (testPassed !== true) {
      setTestError('Please test the formula successfully before saving');
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
        op.symbol.toLowerCase().includes(opSearch.toLowerCase()) ||
        op.description.toLowerCase().includes(opSearch.toLowerCase())
      )
    : OPERATIONS;

  const groupedOps = filteredOps.reduce<Record<string, Operation[]>>((acc, op) => {
    (acc[op.category] = acc[op.category] || []).push(op);
    return acc;
  }, {});

  // --- Display expression (prettify Math.* for readability) ---
  const prettyExpression = (expr: string) =>
    expr
      .replace(/Math\.sqrt\(/g, 'sqrt(')
      .replace(/Math\.abs\(/g, 'abs(')
      .replace(/Math\.log10\(/g, 'log10(')
      .replace(/Math\.log\(/g, 'ln(')
      .replace(/Math\.exp\(/g, 'exp(')
      .replace(/Math\.round\(/g, 'round(')
      .replace(/Math\.floor\(/g, 'floor(')
      .replace(/Math\.ceil\(/g, 'ceil(')
      .replace(/Math\.sin\(/g, 'sin(')
      .replace(/Math\.cos\(/g, 'cos(')
      .replace(/Math\.tan\(/g, 'tan(')
      .replace(/Math\.PI/g, 'π')
      .replace(/Math\.E/g, 'e')
      .replace(/\*\*/g, '^');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step 1: Define Variables */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Variable className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 1 — Define Variables</h3>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Drag variables into expression</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Existing variables as draggable chips */}
          <div className="flex flex-wrap gap-2">
            {variables.map(v => (
              <div
                key={v.id}
                draggable
                onDragStart={e => handleDragStart(e, v.name)}
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
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Variable Name</label>
              <input
                value={newVarName}
                onChange={e => setNewVarName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="e.g. mass, volume, density"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={e => e.key === 'Enter' && addVariable()}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Description (optional)</label>
              <input
                value={newVarDesc}
                onChange={e => setNewVarDesc(e.target.value)}
                placeholder="e.g. mass in grams"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                onKeyDown={e => e.key === 'Enter' && addVariable()}
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
            Variable names follow standard rules: start with a letter or underscore, contain letters, digits, or underscores.
          </p>
        </div>
      </div>

      {/* Step 2: Build Expression */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Step 2 — Build Expression</h3>
          </div>
          <button
            onClick={() => setShowOpPanel(!showOpPanel)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-3 h-3" />
            {showOpPanel ? 'Hide' : 'Show'} Operations
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
                    onChange={e => setOpSearch(e.target.value)}
                    placeholder="Search operations... (e.g. sqrt, multiply, log)"
                    className="w-full bg-input border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto p-2 space-y-3">
                {Object.entries(groupedOps).map(([category, ops]) => (
                  <div key={category}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-1.5">{category}</p>
                    <div className="flex flex-wrap gap-1">
                      {ops.map(op => (
                        <button
                          key={op.symbol}
                          onClick={() => insertToken(op.symbol)}
                          title={`${op.name}: ${op.description}`}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/30 transition-colors"
                        >
                          <span className="font-mono text-primary">{op.symbol === '**' ? '^' : op.symbol.replace('Math.', '')}</span>
                          <span className="text-muted-foreground">{op.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredOps.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">No matching operations</p>
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
              >
                {v.name}
              </button>
            ))}
            <span className="text-[10px] text-muted-foreground self-center ml-2">← click or drag into expression</span>
          </div>

          {/* Expression textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Formula Expression</label>
            <textarea
              ref={expressionRef}
              value={expression}
              onChange={e => { setExpression(e.target.value); setTestPassed(null); setTestResult(null); setTestError(null); }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder="Build your formula here... e.g. mass / (molWeight * volume) or drag variables above"
              rows={3}
              className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
            />
            {expression && (
              <div className="px-3 py-2 rounded-md bg-secondary/50 border border-border">
                <span className="text-[10px] text-muted-foreground mr-2">Preview:</span>
                <span className="text-sm font-mono text-foreground">{prettyExpression(expression)}</span>
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
            <h3 className="text-sm font-semibold text-foreground">Step 3 — Test Formula</h3>
          </div>
          {testPassed === true && (
            <span className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--success))]">
              <Check className="w-3.5 h-3.5" /> Test Passed
            </span>
          )}
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">Provide test values for each variable to verify the formula produces valid output.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {variables.map(v => (
              <div key={v.id} className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{v.name} {v.description && `(${v.description})`}</label>
                <input
                  type="number"
                  value={v.testValue}
                  onChange={e => updateVariable(v.id, 'testValue', e.target.value)}
                  placeholder="Test value"
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
            <Play className="w-4 h-4" /> Run Test
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
                <p className="text-xs text-muted-foreground">Test Output:</p>
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
          <h3 className="text-sm font-semibold text-foreground">Step 4 — Name & Save</h3>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Formula Name *</label>
            <input
              value={formulaName}
              onChange={e => setFormulaName(e.target.value)}
              placeholder="e.g. Molarity from Mass"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Description</label>
            <textarea
              value={formulaDesc}
              onChange={e => setFormulaDesc(e.target.value)}
              placeholder="What does this formula calculate? When should it be used?"
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
            <p className="text-[10px] text-[hsl(var(--warning))]">⚠ Formula must pass testing before saving</p>
          )}
        </div>
      </div>

      {/* Saved Formulas */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Saved Formulas</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">{savedFormulas.length} formulas</span>
        </div>
        <div className="p-5">
          {savedFormulas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No formulas saved yet. Define, test, and save your first formula above.</p>
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
                      <p className="text-xs font-mono text-primary mt-0.5 truncate">{prettyExpression(f.expression)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={e => { e.stopPropagation(); loadFormula(f); }}
                        className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteFormula(f.id); }}
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
                        Created {new Date(f.createdAt).toLocaleDateString()}
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
