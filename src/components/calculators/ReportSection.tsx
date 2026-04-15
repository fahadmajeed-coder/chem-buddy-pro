import { useState, useRef, useMemo } from 'react';
import { FileText, Download, Plus, Trash2, CheckCircle2, Clock, AlertCircle, Upload, Building2, Shield, Settings2, FlaskConical, Save, FolderOpen, AlertTriangle, X, RotateCcw, Search, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import type { AnalyticalResult } from './AnalyticalTestSection';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SectionCloudSync } from './SectionCloudSync';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type EntryStatus = 'good' | 'fair' | 'reject' | 'pending';

interface AnalysisParam {
  id: string;
  analysis: string;
  normalMin?: string;
  normalMax?: string;
  min: string;
  max: string;
  standard: string;
  withDeductionMin?: string;
  withDeductionMax?: string;
  outlierMin?: string;
  outlierMax?: string;
  reason: string;
  normal?: string;
  withDeduction?: string;
  outlier?: string;
}

interface SavedStandard {
  id: string;
  name: string;
  description: string;
  parameters: AnalysisParam[];
  createdAt: number;
}

interface CustomColumn {
  id: string;
  header: string;
  formula: string;
  deductionFormula?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  customColumns: CustomColumn[];
  showDeduction: boolean;
  deductionFormula: string;
  createdAt: number;
}

interface ReportEntry {
  id: string;
  parameter: string;
  method: string;
  result: string;
  unit: string;
  greenRange: string;
  yellowRange: string;
  status: EntryStatus;
  included: boolean;
  deduction: string;
  customValues: Record<string, string>;
}

// Mini calculator types
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

const AVAILABLE_TOKENS = [
  { token: '{result}', label: 'Result' },
  { token: '{greenMin}', label: 'Good Min' },
  { token: '{greenMax}', label: 'Good Max' },
  { token: '{yellowMin}', label: 'Fair Min' },
  { token: '{yellowMax}', label: 'Fair Max' },
  { token: '{deduction}', label: 'Deduction' },
];

const MATH_OPS = ['+', '-', '*', '/', '(', ')', 'abs('];

const formatRangeStr = (min?: string, max?: string, legacy?: string) => {
  const a = min || ''; const b = max || '';
  if (a && b) return `${a}–${b}`;
  if (a) return `≥${a}`;
  if (b) return `≤${b}`;
  return legacy || '';
};

const computeStatus = (result: string, greenRange: string, yellowRange: string): EntryStatus => {
  const res = parseFloat(result);
  const greenMatch = greenRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
  const yellowMatch = yellowRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
  if (!isNaN(res) && (greenMatch || yellowMatch)) {
    let status: EntryStatus = 'reject';
    if (greenMatch) {
      const gMin = parseFloat(greenMatch[1]);
      const gMax = parseFloat(greenMatch[2]);
      if (res >= gMin && res <= gMax) status = 'good';
    }
    if (status !== 'good' && yellowMatch) {
      const yMin = parseFloat(yellowMatch[1]);
      const yMax = parseFloat(yellowMatch[2]);
      if (res >= yMin && res <= yMax) status = 'fair';
    }
    return status;
  }
  return 'pending';
};

const computeDeduction = (result: string, greenRange: string, yellowRange: string, formula?: string): string => {
  const res = parseFloat(result);
  if (isNaN(res)) return '';
  const greenMatch = greenRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
  if (!greenMatch) return '';
  const gMin = parseFloat(greenMatch[1]);
  const gMax = parseFloat(greenMatch[2]);
  if (res >= gMin && res <= gMax) return '0';

  if (formula && formula.trim()) {
    try {
      const yellowMatch = yellowRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
      let expr = formula
        .replace(/\{result\}/gi, String(res))
        .replace(/\{greenMin\}/gi, String(gMin))
        .replace(/\{greenMax\}/gi, String(gMax))
        .replace(/\{yellowMin\}/gi, yellowMatch ? yellowMatch[1] : '0')
        .replace(/\{yellowMax\}/gi, yellowMatch ? yellowMatch[2] : '0')
        .replace(/abs\(/gi, 'Math.abs(');
      if (/^[\d\s+\-*/().a-zA-Z]+$/.test(expr)) {
        const val = Function('"use strict"; return (' + expr + ')')();
        if (typeof val === 'number' && !isNaN(val)) return val.toFixed(4);
      }
    } catch { /* fallback */ }
  }

  if (res < gMin) return (gMin - res).toFixed(4);
  if (res > gMax) return (res - gMax).toFixed(4);
  return '';
};

const makeEntry = (overrides?: Partial<ReportEntry>): ReportEntry => ({
  id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  parameter: '', method: '', result: '', unit: '', greenRange: '', yellowRange: '',
  status: 'pending', included: true, deduction: '', customValues: {},
  ...overrides,
});

const evalColumnFormula = (formula: string, entry: ReportEntry, allEntries?: ReportEntry[], colId?: string): string => {
  if (!formula.trim()) return '';
  try {
    const greenMatch = entry.greenRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    const yellowMatch = entry.yellowRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    let expr = formula
      .replace(/\{result\}/gi, entry.result || '0')
      .replace(/\{deduction\}/gi, entry.deduction || '0')
      .replace(/\{greenMin\}/gi, greenMatch ? greenMatch[1] : '0')
      .replace(/\{greenMax\}/gi, greenMatch ? greenMatch[2] : '0')
      .replace(/\{yellowMin\}/gi, yellowMatch ? yellowMatch[1] : '0')
      .replace(/\{yellowMax\}/gi, yellowMatch ? yellowMatch[2] : '0')
      .replace(/abs\(/gi, 'Math.abs(');
    if (/^[\d\s+\-*/().a-zA-Z]+$/.test(expr)) {
      const result = Function('"use strict"; return (' + expr + ')')();
      return typeof result === 'number' && !isNaN(result) ? result.toFixed(4) : '';
    }
  } catch { /* ignore */ }
  return '';
};

// Mini toJavaScript for inline calc
function toJavaScript(expr: string): string {
  let js = expr;
  js = js.replace(/\bPI\b/g, 'Math.PI').replace(/\bEULER\b/g, 'Math.E');
  js = js.replace(/√\(/g, 'Math.sqrt(');
  js = js.replace(/∛\(/g, 'Math.cbrt(');
  js = js.replace(/xⁿ/g, '**');
  js = js.replace(/\|([^|]+)\|/g, 'Math.abs($1)');
  js = js.replace(/\bln\(/g, 'Math.log(');
  js = js.replace(/\blog10\(/g, 'Math.log10(');
  js = js.replace(/\bexp\(/g, 'Math.exp(');
  js = js.replace(/\bfloor\(/g, 'Math.floor(');
  js = js.replace(/\bceil\(/g, 'Math.ceil(');
  js = js.replace(/\bround\(/g, 'Math.round(');
  js = js.replace(/\bmin\(/g, 'Math.min(');
  js = js.replace(/\bmax\(/g, 'Math.max(');
  js = js.replace(/\bsin\(/g, 'Math.sin(');
  js = js.replace(/\bcos\(/g, 'Math.cos(');
  js = js.replace(/\btan\(/g, 'Math.tan(');
  const arrayFns: Record<string, string> = {
    'sum': '((...a)=>a.reduce((s,v)=>s+v,0))',
    'average': '((...a)=>a.reduce((s,v)=>s+v,0)/a.length)',
    'stdDev': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))})',
  };
  for (const [fn, impl] of Object.entries(arrayFns)) {
    const re = new RegExp(`\\b${fn}\\(`, 'g');
    js = js.replace(re, `${impl}(`);
  }
  return js;
}

function evaluateMiniFormula(expression: string, variables: FormulaVariable[], values: Record<string, string>): number | null {
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

// Formula builder helper component
function FormulaBuilderInline({ formula, onChange, label, availableColumns }: {
  formula: string; onChange: (f: string) => void; label: string;
  availableColumns?: { id: string; header: string }[];
}) {
  const [showBuilder, setShowBuilder] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const insertToken = (token: string) => {
    if (!inputRef.current) { onChange(formula + token); return; }
    const start = inputRef.current.selectionStart || formula.length;
    const end = inputRef.current.selectionEnd || formula.length;
    const newFormula = formula.slice(0, start) + token + formula.slice(end);
    onChange(newFormula);
    setTimeout(() => {
      inputRef.current?.setSelectionRange(start + token.length, start + token.length);
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="text" value={formula} onChange={e => onChange(e.target.value)}
          placeholder={`e.g. {result} - {greenMax}`}
          className="flex-1 bg-input border border-border rounded px-2 py-1 text-[10px] font-mono text-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        <button onClick={() => setShowBuilder(!showBuilder)}
          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${showBuilder ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'}`}>
          ƒx
        </button>
      </div>
      {showBuilder && (
        <div className="p-2 rounded-md border border-primary/20 bg-primary/5 space-y-1.5">
          <div className="flex flex-wrap gap-1">
            <span className="text-[8px] text-muted-foreground uppercase w-full">Columns</span>
            {AVAILABLE_TOKENS.map(t => (
              <button key={t.token} onClick={() => insertToken(t.token)}
                className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-secondary border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors">
                {t.label}
              </button>
            ))}
            {availableColumns?.map(c => (
              <button key={c.id} onClick={() => insertToken(`{col:${c.header}}`)}
                className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors">
                {c.header}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[8px] text-muted-foreground uppercase w-full">Math</span>
            {MATH_OPS.map(op => (
              <button key={op} onClick={() => insertToken(op)}
                className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-secondary border border-border text-foreground hover:border-primary/50 transition-colors">
                {op}
              </button>
            ))}
          </div>
          <p className="text-[8px] text-muted-foreground">Click tokens to insert at cursor position</p>
        </div>
      )}
    </div>
  );
}

// Inline Mini Calculator for a parameter row
function InlineCalculator({ paramName, onResult, onClose }: {
  paramName: string;
  onResult: (result: string) => void;
  onClose: () => void;
}) {
  const [savedFormulas] = useLocalStorage<SavedFormula[]>('chem-formulas-v2', []);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [searchQ, setSearchQ] = useState('');

  const matchingFormulas = useMemo(() => {
    const q = (searchQ || paramName).toLowerCase();
    return savedFormulas.filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
  }, [savedFormulas, searchQ, paramName]);

  const selectedFormula = savedFormulas.find(f => f.id === selectedFormulaId);
  const result = selectedFormula ? evaluateMiniFormula(selectedFormula.expression, selectedFormula.variables, values) : null;

  return (
    <div className="border border-primary/30 rounded-lg bg-card p-3 space-y-2 animate-fade-in shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5" /> Quick Calculator — {paramName}
        </span>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {!selectedFormula ? (
        <div className="space-y-1.5">
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search formula..."
            className="w-full bg-input border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {matchingFormulas.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-2">No formulas found</p>
            ) : matchingFormulas.map(f => (
              <button key={f.id} onClick={() => {
                setSelectedFormulaId(f.id);
                const vals: Record<string, string> = {};
                f.variables.forEach(v => { if (v.defaultValue) vals[v.name] = v.defaultValue; });
                setValues(vals);
              }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-muted/50 text-xs text-foreground transition-colors">
                <span className="font-medium">{f.name}</span>
                {f.description && <span className="text-muted-foreground ml-1.5">— {f.description}</span>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => { setSelectedFormulaId(null); setValues({}); }}
              className="text-[10px] text-primary hover:underline">← Back</button>
            <span className="text-xs font-medium text-foreground">{selectedFormula.name}</span>
          </div>
          <div className="p-1.5 rounded bg-muted/50 border border-border">
            <code className="text-[10px] font-mono text-primary">{selectedFormula.expression}</code>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {selectedFormula.variables.map(v => (
              <div key={v.id} className="space-y-0.5">
                <label className="text-[9px] text-muted-foreground font-medium uppercase">{v.name}{v.description && ` (${v.description})`}</label>
                <input type="number" value={values[v.name] || ''} onChange={e => setValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                  placeholder={v.defaultValue || '0'}
                  onKeyDown={e => { if (e.key === 'Enter' && result !== null) { onResult(result.toFixed(4)); onClose(); } }}
                  className="w-full bg-input border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold font-mono text-primary">{result !== null ? result.toFixed(4) : '—'}</span>
            <button onClick={() => { if (result !== null) { onResult(result.toFixed(4)); onClose(); } }}
              disabled={result === null}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors">
              Apply Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportSection({ isAdmin = false }: { isAdmin?: boolean }) {
  const [savedStandards] = useLocalStorage<SavedStandard[]>('chemanalyst-standards', []);
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useLocalStorage<ReportTemplate[]>('chemanalyst-report-templates', []);
  const [templateName, setTemplateName] = useState('');
  const [deductionFormula, setDeductionFormula] = useState('');

  const [showDeduction, setShowDeduction] = useState(true);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);

  const [exportColumns, setExportColumns] = useState({
    parameter: true, method: true, result: true, unit: true, greenRange: true, yellowRange: true, status: true,
  });

  const [title, setTitle] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<ReportEntry[]>([makeEntry()]);
  const [confirmAction, setConfirmAction] = useState<{ type: string; fn: () => void; msg: string } | null>(null);
  const [rowFormulas, setRowFormulas] = useState<Record<string, Record<string, string>>>({});
  const [editingRowFormula, setEditingRowFormula] = useState<{ entryId: string; colId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [calcForEntry, setCalcForEntry] = useState<string | null>(null);

  const normalizeParam = (name: string) => name.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();

  const showConfirm = (msg: string, fn: () => void) => {
    setConfirmAction({ type: 'action', fn, msg });
  };

  const loadStandard = (standardId: string) => {
    const std = savedStandards.find(s => s.id === standardId);
    if (!std) return;
    showConfirm(`Load standard "${std.name}"? This will update parameters and ranges.`, () => {
      setSelectedStandardId(standardId);
      const existingByParam = new Map<string, ReportEntry>();
      for (const e of entries) {
        if (e.parameter.trim()) existingByParam.set(normalizeParam(e.parameter), e);
      }
      const usedExistingIds = new Set<string>();
      const stdEntries = std.parameters.map(p => {
        const greenRange = formatRangeStr(p.normalMin, p.normalMax, p.normal);
        const yellowRange = formatRangeStr(p.withDeductionMin, p.withDeductionMax, p.withDeduction);
        const paramKey = normalizeParam(p.analysis);
        const existing = existingByParam.get(paramKey);
        if (existing) usedExistingIds.add(existing.id);
        const resultVal = existing?.result || '';
        return makeEntry({
          parameter: p.analysis, method: existing?.method || '', result: resultVal, unit: existing?.unit || '',
          greenRange, yellowRange,
          status: resultVal ? computeStatus(resultVal, greenRange, yellowRange) : 'pending',
          included: existing?.included ?? true,
          deduction: resultVal ? computeDeduction(resultVal, greenRange, yellowRange, deductionFormula) : '',
          customValues: existing?.customValues || {},
        });
      });
      const extras = entries.filter(e => e.parameter.trim() && !usedExistingIds.has(e.id));
      setEntries([...stdEntries, ...extras]);
      setConfirmAction(null);
    });
  };

  const clearStandard = () => {
    showConfirm('Clear all loaded data? This will reset the report.', () => {
      setSelectedStandardId(null);
      setEntries([makeEntry()]);
      setConfirmAction(null);
      toast.success('All loaded results cleared');
    });
  };

  const addEntry = () => setEntries(prev => [...prev, makeEntry()]);

  const removeEntry = (id: string) => {
    if (entries.length > 1) setEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof ReportEntry, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, [field]: value };
      if (field === 'result' || field === 'greenRange' || field === 'yellowRange') {
        updated.status = computeStatus(updated.result, updated.greenRange, updated.yellowRange);
        if (field !== 'greenRange' || !e.deduction) {
          updated.deduction = computeDeduction(updated.result, updated.greenRange, updated.yellowRange, deductionFormula);
        }
      }
      return updated;
    }));
  };

  const updateCustomValue = (entryId: string, colId: string, value: string) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, customValues: { ...e.customValues, [colId]: value } } : e));
  };

  const setStatus = (id: string, status: EntryStatus) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const addCustomColumn = () => {
    setCustomColumns(prev => [...prev, { id: `col-${Date.now()}`, header: `Column ${prev.length + 1}`, formula: '', deductionFormula: '' }]);
  };

  const updateColumnHeader = (colId: string, header: string) => {
    setCustomColumns(prev => prev.map(c => c.id === colId ? { ...c, header } : c));
  };

  const updateColumnFormula = (colId: string, formula: string) => {
    setCustomColumns(prev => prev.map(c => c.id === colId ? { ...c, formula } : c));
  };

  const removeCustomColumn = (colId: string) => {
    setCustomColumns(prev => prev.filter(c => c.id !== colId));
  };

  const resetLoadedResults = () => {
    showConfirm('Reset all results? This will clear all entries.', () => {
      setEntries([makeEntry()]);
      setSelectedStandardId(null);
      toast.success('All loaded results cleared');
      setConfirmAction(null);
    });
  };

  const resetAnalyticalInReport = () => {
    showConfirm('Reset analytical test results in report? This clears result values only.', () => {
      setEntries(prev => prev.map(e => ({
        ...e, result: '', status: 'pending' as EntryStatus, deduction: '',
      })));
      toast.success('Analytical results reset');
      setConfirmAction(null);
    });
  };

  const applyDeductionFormula = () => {
    setEntries(prev => prev.map(e => ({
      ...e,
      deduction: e.result ? computeDeduction(e.result, e.greenRange, e.yellowRange, deductionFormula) : e.deduction,
    })));
    toast.success('Deduction formula applied');
  };

  const saveTemplate = () => {
    const name = templateName.trim() || `Template ${savedTemplates.length + 1}`;
    const template: ReportTemplate = {
      id: `tmpl-${Date.now()}`, name,
      customColumns: [...customColumns], showDeduction, deductionFormula,
      createdAt: Date.now(),
    };
    setSavedTemplates(prev => [...prev, template]);
    setTemplateName('');
    toast.success(`Template "${name}" saved`);
  };

  const loadTemplate = (tmpl: ReportTemplate) => {
    setCustomColumns(tmpl.customColumns.map(c => ({ ...c })));
    setShowDeduction(tmpl.showDeduction);
    setDeductionFormula(tmpl.deductionFormula || '');
    toast.success(`Template "${tmpl.name}" loaded`);
  };

  const deleteTemplate = (id: string) => {
    setSavedTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const statusIcon = (status: EntryStatus) => {
    switch (status) {
      case 'good': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'fair': return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'reject': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const toggleColumn = (col: keyof typeof exportColumns) => {
    setExportColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const columnLabels: Record<keyof typeof exportColumns, string> = {
    parameter: 'Parameter', method: 'Method', result: 'Result', unit: 'Unit',
    greenRange: 'Good Range', yellowRange: 'Fair Range', status: 'Status',
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getColValue = (entry: ReportEntry, cc: CustomColumn): string => {
    const rowFormula = rowFormulas[entry.id]?.[cc.id];
    const effectiveFormula = rowFormula !== undefined ? rowFormula : cc.formula;
    if (effectiveFormula) return evalColumnFormula(effectiveFormula, entry);
    return entry.customValues[cc.id] || '';
  };

  // Enter key handler for report table
  const handleEntryKeyDown = (e: React.KeyboardEvent, entryIdx: number, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (entryIdx === entries.length - 1) addEntry();
      setTimeout(() => {
        const next = document.querySelector(`[data-entry-idx="${entryIdx + 1}"][data-field="${field}"]`) as HTMLInputElement;
        next?.focus();
      }, 50);
    }
  };

  // Auto-unselect entries with no data
  const autoUnselect = () => {
    setEntries(prev => prev.map(e => ({
      ...e, included: !!(e.parameter.trim() && e.result.trim()),
    })));
    toast.success('Auto-unselected empty parameters');
  };

  // Search filter for standards
  const filteredStandards = useMemo(() => {
    if (!searchQuery.trim()) return savedStandards;
    const q = searchQuery.toLowerCase();
    return savedStandards.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [savedStandards, searchQuery]);

  const exportPDF = () => {
    const exportEntries = entries.filter(e => e.included);
    const reportTitle = title || 'Certificate of Analysis';
    const date = new Date().toISOString().split('T')[0];
    const doc = new jsPDF();
    let yPos = 14;
    if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', 14, yPos, 24, 24); } catch { /* skip */ } }
    const textX = logoDataUrl ? 42 : 14;
    if (companyName) { doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 160, 145); doc.text(companyName, textX, yPos + 8); }
    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(30);
    doc.text(reportTitle, textX, yPos + (companyName ? 18 : 10));
    yPos = 44;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(60);
    doc.text(`Batch No: ${batchNo || '—'}`, 14, yPos);
    doc.text(`Date: ${date}`, 196, yPos, { align: 'right' });
    const selectedStd = savedStandards.find(s => s.id === selectedStandardId);
    if (selectedStd) { doc.text(`Standard: ${selectedStd.name}`, 14, yPos + 6); yPos += 6; }
    doc.setDrawColor(0, 200, 180); doc.setLineWidth(0.5); doc.line(14, yPos + 4, 196, yPos + 4);

    type ColKey = keyof typeof exportColumns;
    const allCols: { key: ColKey; header: string; getValue: (e: ReportEntry) => string }[] = [
      { key: 'parameter', header: 'Parameter', getValue: (e) => e.parameter || '—' },
      { key: 'method', header: 'Method', getValue: (e) => e.method || '—' },
      { key: 'result', header: 'Result', getValue: (e) => `${e.result || '—'} ${e.unit}`.trim() },
      { key: 'greenRange', header: 'Good Range', getValue: (e) => e.greenRange || '—' },
      { key: 'yellowRange', header: 'Fair Range', getValue: (e) => e.yellowRange || '—' },
      { key: 'status', header: 'Status', getValue: (e) => e.status === 'good' ? 'GOOD' : e.status === 'fair' ? 'FAIR' : e.status === 'reject' ? 'REJECT' : 'Pending' },
    ];
    let finalCols = allCols.filter(c => exportColumns[c.key]);
    if (showDeduction) {
      const statusIdx = finalCols.findIndex(c => c.key === 'status');
      const dedCol = { key: 'status' as ColKey, header: 'Deduction', getValue: (e: ReportEntry) => e.deduction || '—' };
      if (statusIdx >= 0) finalCols.splice(statusIdx + 1, 0, dedCol); else finalCols.push(dedCol);
    }
    for (const cc of customColumns) {
      finalCols.push({ key: 'status' as ColKey, header: cc.header, getValue: (e) => getColValue(e, cc) || '—' });
    }
    const statusColIndex = finalCols.findIndex(c => c.header === 'Status');
    autoTable(doc, {
      startY: yPos + 10,
      head: [finalCols.map(c => c.header)],
      body: exportEntries.map(e => finalCols.map(c => c.getValue(e))),
      theme: 'grid',
      headStyles: { fillColor: [0, 160, 145], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      ...(statusColIndex >= 0 ? { columnStyles: { [statusColIndex]: { fontStyle: 'bold', halign: 'center' as const } } } : {}),
      didParseCell: (data) => {
        if (data.section === 'body' && statusColIndex >= 0 && data.column.index === statusColIndex) {
          const val = data.cell.raw as string;
          if (val === 'GOOD') { data.cell.styles.textColor = [255, 255, 255]; data.cell.styles.fillColor = [0, 160, 80]; }
          else if (val === 'FAIR') { data.cell.styles.textColor = [40, 40, 40]; data.cell.styles.fillColor = [255, 200, 50]; }
          else if (val === 'REJECT') { data.cell.styles.textColor = [255, 255, 255]; data.cell.styles.fillColor = [200, 50, 50]; }
        }
      },
    });
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text('Generated by ChemAnalyst', 14, pageHeight - 10);
    doc.text(`Page 1 of 1`, 196, pageHeight - 10, { align: 'right' });
    doc.save(`COA_${batchNo || 'report'}_${date}.pdf`);
  };

  const loadFromAnalyticalTests = () => {
    try {
      const raw = localStorage.getItem('chemanalyst-analytical-results');
      if (!raw) return;
      const results: AnalyticalResult[] = JSON.parse(raw);
      if (!results.length) return;
      const analyticalMap = new Map<string, AnalyticalResult>();
      for (const r of results) analyticalMap.set(normalizeParam(r.formulaName), r);
      const hasExistingParams = entries.some(e => e.parameter.trim());
      if (hasExistingParams) {
        const updatedEntries = entries.map(e => {
          const paramKey = normalizeParam(e.parameter);
          const match = analyticalMap.get(paramKey);
          if (match) {
            analyticalMap.delete(paramKey);
            const result = match.result.toFixed(4);
            return { ...e, result, status: computeStatus(result, e.greenRange, e.yellowRange), deduction: computeDeduction(result, e.greenRange, e.yellowRange, deductionFormula) };
          }
          return e;
        });
        const extraEntries: ReportEntry[] = [];
        for (const [, r] of analyticalMap) {
          extraEntries.push(makeEntry({ parameter: r.formulaName + (r.sampleId ? ` (${r.sampleId})` : ''), result: r.result.toFixed(4) }));
        }
        setEntries([...updatedEntries, ...extraEntries]);
      } else {
        setEntries(results.map(r => makeEntry({ parameter: r.formulaName + (r.sampleId ? ` (${r.sampleId})` : ''), result: r.result.toFixed(4) })));
      }
      toast.success('Analytical results loaded and merged.');
    } catch { /* ignore */ }
  };

  const hasAnalyticalResults = (() => {
    try { const raw = localStorage.getItem('chemanalyst-analytical-results'); return raw ? JSON.parse(raw).length > 0 : false; } catch { return false; }
  })();

  return (
    <div className="space-y-4">
      <SectionCloudSync sectionKey="chemanalyst-standards" label="Report Standards" isAdmin={isAdmin} />

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
          <div className="bg-card border border-border rounded-lg p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Confirm Action</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{confirmAction.msg}</p>
            <div className="flex gap-2">
              <button onClick={() => confirmAction.fn()} className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Confirm</button>
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Data Sources */}
      {(savedStandards.length > 0 || hasAnalyticalResults) && (
        <div className="glass-panel rounded-lg p-4 sm:p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Data Sources</h3>
            <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">Load from Standards and/or Analytical Tests</span>
          </div>
          {savedStandards.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">① Standard Template</p>
              {/* Search */}
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search standards..."
                  className="w-full pl-8 pr-3 py-1.5 bg-input border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredStandards.map(s => (
                  <button key={s.id} onClick={() => loadStandard(s.id)}
                    className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${selectedStandardId === s.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-foreground border-border hover:border-primary/50 hover:bg-secondary'}`}>
                    {s.name}<span className="ml-1.5 text-[10px] opacity-70">({s.parameters.length})</span>
                  </button>
                ))}
                {selectedStandardId && (
                  <button onClick={clearStandard} className="px-3 py-2 rounded-md text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">Clear Template</button>
                )}
                <button onClick={resetLoadedResults} className="px-3 py-2 rounded-md text-xs font-medium border border-warning/30 text-warning hover:bg-warning/10 transition-colors">Reset All Results</button>
              </div>
            </div>
          )}
          {hasAnalyticalResults && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">② Analytical Test Results</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={loadFromAnalyticalTests} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 border border-primary/20 transition-colors">
                  <FlaskConical className="w-3.5 h-3.5" /> Load Analytical Results
                </button>
                <button onClick={resetAnalyticalInReport} className="flex items-center gap-2 px-4 py-2 rounded-md bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 border border-warning/20 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Test Results
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Branding */}
      <div className="glass-panel rounded-lg p-4 sm:p-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Company Branding</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company Name</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Laboratories"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company Logo</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-input border border-border rounded-md px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Upload className="w-3.5 h-3.5" /> {logoDataUrl ? 'Change Logo' : 'Upload Logo'}
            </button>
          </div>
          {logoDataUrl && (
            <div className="flex items-center gap-2">
              <img src={logoDataUrl} alt="Logo" className="w-10 h-10 rounded border border-border object-contain bg-white" />
              <button onClick={() => setLogoDataUrl(null)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      </div>

      {/* Report Header */}
      <div className="glass-panel rounded-lg p-4 sm:p-5 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Certificate of Analysis</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const date = new Date().toISOString().split('T')[0];
              const headers = ['Parameter', 'Method', 'Result', 'Unit', 'Good Range', 'Fair Range', 'Status'];
              if (showDeduction) headers.push('Deduction');
              customColumns.forEach(cc => headers.push(cc.header));
              const csvEntries = entries.filter(e => e.included);
              const rows = csvEntries.map(e => {
                const row = [e.parameter, e.method, e.result, e.unit, e.greenRange, e.yellowRange, e.status === 'good' ? 'GOOD' : e.status === 'fair' ? 'FAIR' : e.status === 'reject' ? 'REJECT' : 'Pending'];
                if (showDeduction) row.push(e.deduction || '');
                customColumns.forEach(cc => row.push(getColValue(e, cc)));
                return row;
              });
              const metaRows: string[][] = [];
              if (companyName) metaRows.push(['Company', companyName]);
              metaRows.push(['Report Title', title || 'Certificate of Analysis']);
              if (batchNo) metaRows.push(['Batch No', batchNo]);
              metaRows.push(['Date', date]);
              metaRows.push([]);
              const csv = [...metaRows, headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = `COA_${batchNo || 'report'}_${date}.csv`; a.click(); URL.revokeObjectURL(url);
              toast.success('CSV exported');
            }} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 border border-border transition-colors">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={autoUnselect} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border transition-colors" title="Auto-unselect empty parameters">
              Auto ✓
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Report Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Certificate of Analysis"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Batch Number</label>
            <input type="text" value={batchNo} onChange={e => setBatchNo(e.target.value)} placeholder="BATCH-001"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Column Settings */}
      <div className="glass-panel rounded-lg p-4 sm:p-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Column Settings</h3>
        </div>

        <div className="flex flex-wrap gap-3 mb-3">
          {(Object.keys(exportColumns) as (keyof typeof exportColumns)[]).map(col => (
            <label key={col} className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox" checked={exportColumns[col]} onChange={() => toggleColumn(col)} className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5" />
              <span className={`text-xs font-medium ${exportColumns[col] ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{columnLabels[col]}</span>
            </label>
          ))}
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={showDeduction} onChange={() => setShowDeduction(!showDeduction)} className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5" />
            <span className={`text-xs font-medium ${showDeduction ? 'text-warning' : 'text-muted-foreground line-through'}`}>Deduction</span>
          </label>
        </div>

        {/* Deduction Formula (Admin only) */}
        {showDeduction && (
          <div className="mb-3 p-2 rounded-md bg-warning/5 border border-warning/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-warning font-medium">Deduction Formula</span>
              {!isAdmin && <span className="text-[9px] text-muted-foreground">Set by admin</span>}
            </div>
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <FormulaBuilderInline formula={deductionFormula} onChange={setDeductionFormula} label="Deduction" />
                </div>
                <button onClick={applyDeductionFormula} className="px-2 py-1 rounded-md bg-warning/10 text-warning text-[10px] font-medium hover:bg-warning/20 border border-warning/20 shrink-0">Apply</button>
              </div>
            ) : deductionFormula ? (
              <span className="text-[10px] font-mono text-warning/70">ƒ {deductionFormula}</span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Default formula (absolute difference)</span>
            )}
          </div>
        )}

        {/* Custom columns with formula builder */}
        {customColumns.length > 0 && (
          <div className="space-y-2 mb-3">
            {customColumns.map(cc => (
              <div key={cc.id} className="bg-secondary/50 border border-border rounded-md px-2 py-1.5 space-y-1">
                <div className="flex items-center gap-2">
                  <input type="text" value={cc.header} onChange={e => updateColumnHeader(cc.id, e.target.value)}
                    className="bg-transparent text-xs font-medium text-foreground w-24 focus:outline-none focus:ring-0 border-none" placeholder="Header name" />
                  {cc.formula && !isAdmin && <span className="text-[10px] text-muted-foreground font-mono">ƒ auto</span>}
                  <button onClick={() => removeCustomColumn(cc.id)} className="text-destructive hover:text-destructive/80 p-0.5 ml-auto"><Trash2 className="w-3 h-3" /></button>
                </div>
                {isAdmin && (
                  <FormulaBuilderInline
                    formula={cc.formula}
                    onChange={f => updateColumnFormula(cc.id, f)}
                    label={cc.header}
                    availableColumns={customColumns.filter(c => c.id !== cc.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={addCustomColumn} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Column
          </button>
          <div className="flex items-center gap-1.5 ml-auto">
            <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name"
              className="bg-input border border-border rounded-md px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary w-28" />
            <button onClick={saveTemplate} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors">
              <Save className="w-3 h-3" /> Save
            </button>
          </div>
        </div>

        {savedTemplates.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Saved Templates</p>
            <div className="flex flex-wrap gap-2">
              {savedTemplates.map(tmpl => (
                <div key={tmpl.id} className="flex items-center gap-1">
                  <button onClick={() => loadTemplate(tmpl)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary/50 text-foreground border border-border hover:border-primary/50 transition-colors">
                    <FolderOpen className="w-3 h-3" /> {tmpl.name}
                  </button>
                  <button onClick={() => deleteTemplate(tmpl.id)} className="p-1 text-destructive/60 hover:text-destructive transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entries Table */}
      <div className="glass-panel rounded-lg overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '700px' }}>
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="py-2.5 px-2 text-center">
                  <input type="checkbox" checked={entries.every(e => e.included)} onChange={e => setEntries(prev => prev.map(en => ({ ...en, included: e.target.checked })))}
                    className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5" />
                </th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Parameter</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block"></span> Good</span>
                </th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block"></span> Fair</span>
                </th>
                <th className="text-center py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                {showDeduction && <th className="text-left py-2.5 px-2 text-xs font-medium text-warning uppercase tracking-wider">Ded.</th>}
                {customColumns.map(cc => (
                  <th key={cc.id} className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {cc.header}
                    {cc.formula && <span className="ml-1 text-[8px] text-primary">ƒx</span>}
                  </th>
                ))}
                <th className="py-2.5 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, entryIdx) => (
                <>
                  <tr key={entry.id} className={`border-b border-border/50 transition-colors ${entry.included ? 'hover:bg-secondary/20' : 'opacity-40'}`}>
                    <td className="py-2 px-2 text-center">
                      <input type="checkbox" checked={entry.included} onChange={e => setEntries(prev => prev.map(en => en.id === entry.id ? { ...en, included: e.target.checked } : en))}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={entry.parameter} onChange={e => updateEntry(entry.id, 'parameter', e.target.value)}
                        data-entry-idx={entryIdx} data-field="parameter"
                        onKeyDown={e => handleEntryKeyDown(e, entryIdx, 'parameter')}
                        placeholder="Parameter"
                        className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={entry.method} onChange={e => updateEntry(entry.id, 'method', e.target.value)}
                        data-entry-idx={entryIdx} data-field="method"
                        onKeyDown={e => handleEntryKeyDown(e, entryIdx, 'method')}
                        placeholder="Method"
                        className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-0.5">
                        <input type="text" value={entry.result} onChange={e => updateEntry(entry.id, 'result', e.target.value)}
                          data-entry-idx={entryIdx} data-field="result"
                          onKeyDown={e => handleEntryKeyDown(e, entryIdx, 'result')}
                          placeholder="Result"
                          className="flex-1 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors min-w-0" />
                        {entry.parameter.trim() && (
                          <button onClick={() => setCalcForEntry(calcForEntry === entry.id ? null : entry.id)}
                            className={`p-0.5 rounded shrink-0 transition-colors ${calcForEntry === entry.id ? 'text-primary bg-primary/10' : 'text-primary/30 hover:text-primary'}`}
                            title="Quick calculator">
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={entry.unit} onChange={e => updateEntry(entry.id, 'unit', e.target.value)}
                        data-entry-idx={entryIdx} data-field="unit"
                        onKeyDown={e => handleEntryKeyDown(e, entryIdx, 'unit')}
                        placeholder="%"
                        className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={entry.greenRange} onChange={e => updateEntry(entry.id, 'greenRange', e.target.value)}
                        data-entry-idx={entryIdx} data-field="greenRange"
                        onKeyDown={e => handleEntryKeyDown(e, entryIdx, 'greenRange')}
                        placeholder="e.g. 90-95"
                        className="w-full bg-transparent border border-transparent hover:border-border focus:border-success/60 rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={entry.yellowRange} onChange={e => updateEntry(entry.id, 'yellowRange', e.target.value)}
                        data-entry-idx={entryIdx} data-field="yellowRange"
                        onKeyDown={e => handleEntryKeyDown(e, entryIdx, 'yellowRange')}
                        placeholder="e.g. 95-100"
                        className="w-full bg-transparent border border-transparent hover:border-border focus:border-warning/60 rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        {statusIcon(entry.status)}
                        <select value={entry.status} onChange={e => setStatus(entry.id, e.target.value as EntryStatus)}
                          className="bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-0.5 text-[10px] font-medium text-foreground focus:ring-0 focus:outline-none transition-colors cursor-pointer appearance-none">
                          <option value="pending">Pending</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="reject">Reject</option>
                        </select>
                      </div>
                    </td>
                    {showDeduction && (
                      <td className="py-2 px-2">
                        <input type="text" value={entry.deduction} onChange={e => setEntries(prev => prev.map(en => en.id === entry.id ? { ...en, deduction: e.target.value } : en))}
                          placeholder="Auto" className="w-16 bg-transparent border border-transparent hover:border-border focus:border-warning/60 rounded px-2 py-1 text-xs font-mono text-warning focus:ring-0 focus:outline-none transition-colors" />
                      </td>
                    )}
                    {customColumns.map(cc => {
                      const effectiveFormula = rowFormulas[entry.id]?.[cc.id] !== undefined ? rowFormulas[entry.id][cc.id] : cc.formula;
                      const formulaVal = effectiveFormula ? evalColumnFormula(effectiveFormula, entry) : '';
                      const isEditingThis = editingRowFormula?.entryId === entry.id && editingRowFormula?.colId === cc.id;
                      return (
                        <td key={cc.id} className="py-2 px-2">
                          {effectiveFormula ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono text-foreground px-1">{formulaVal || '—'}</span>
                              {isAdmin && (
                                <button onClick={() => setEditingRowFormula(isEditingThis ? null : { entryId: entry.id, colId: cc.id })}
                                  className={`text-[8px] px-1 py-0.5 rounded ${isEditingThis ? 'bg-primary/10 text-primary' : 'text-muted-foreground/40 hover:text-primary'}`}>
                                  ƒ
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input type="text" value={entry.customValues[cc.id] || ''} onChange={e => updateCustomValue(entry.id, cc.id, e.target.value)}
                                placeholder="—" className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                              {isAdmin && (
                                <button onClick={() => setEditingRowFormula(isEditingThis ? null : { entryId: entry.id, colId: cc.id })}
                                  className={`text-[8px] px-1 py-0.5 rounded shrink-0 ${isEditingThis ? 'bg-primary/10 text-primary' : 'text-muted-foreground/40 hover:text-primary'}`}>
                                  ƒ
                                </button>
                              )}
                            </div>
                          )}
                          {isEditingThis && isAdmin && (
                            <div className="mt-1">
                              <FormulaBuilderInline
                                formula={rowFormulas[entry.id]?.[cc.id] || cc.formula}
                                onChange={f => setRowFormulas(prev => ({ ...prev, [entry.id]: { ...(prev[entry.id] || {}), [cc.id]: f } }))}
                                label="Row formula"
                                availableColumns={customColumns.filter(c => c.id !== cc.id)}
                              />
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => {
                                  setRowFormulas(prev => {
                                    const n = { ...prev };
                                    if (n[entry.id]) { delete n[entry.id][cc.id]; if (!Object.keys(n[entry.id]).length) delete n[entry.id]; }
                                    return n;
                                  });
                                  setEditingRowFormula(null);
                                }} className="text-[8px] px-1 py-0.5 rounded bg-secondary text-muted-foreground">Use column default</button>
                                <button onClick={() => setEditingRowFormula(null)} className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary">Done</button>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-2">
                      {entries.length > 1 && (
                        <button onClick={() => removeEntry(entry.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                  </tr>
                  {/* Inline calculator */}
                  {calcForEntry === entry.id && (
                    <tr key={`calc-${entry.id}`}>
                      <td colSpan={9 + (showDeduction ? 1 : 0) + customColumns.length + 1} className="p-0">
                        <div className="px-3 py-2">
                          <InlineCalculator
                            paramName={entry.parameter}
                            onResult={(result) => {
                              updateEntry(entry.id, 'result', result);
                            }}
                            onClose={() => setCalcForEntry(null)}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={addEntry}
        className="w-full py-3 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-sm transition-all">
        <Plus className="w-4 h-4" /> Add Parameter
      </button>
    </div>
  );
}
