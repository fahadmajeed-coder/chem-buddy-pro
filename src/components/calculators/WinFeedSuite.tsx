import { useState, useMemo, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { solveLP, type LPConstraint } from '@/lib/lpSolver';
import {
  Calculator, Target, BarChart3, AlertTriangle, Trash2, Plus,
  Wand2, TrendingUp, Sigma, FileSpreadsheet, Upload, Download,
  Sparkles, Activity, Database, RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import type { SavedStandard } from './StandardsSection';

// ============= Types =============
export interface WFNutrient {
  id: string;
  name: string;       // e.g. CP, ME, Ca, P, Lys
  unit: string;       // %, kcal/kg, g/kg
  min?: number;
  max?: number;
}

export interface WFIngredient {
  id: string;
  name: string;
  cost: number;       // per kg
  dm: number;         // dry matter %
  nutrients: Record<string, number>;     // mean values (as-fed)
  sd?: Record<string, number>;            // standard deviation per nutrient
  minIncl?: number;   // % min inclusion
  maxIncl?: number;   // % max inclusion
}

export interface WFTemplate {
  id: string;
  name: string;
  species: string;    // poultry, cattle, fish, swine
  basis: 'as-fed' | 'dry-matter';
  totalWeight: number;       // % e.g. 100
  nutrients: WFNutrient[];
  ingredients: WFIngredient[]; // template ingredient pool (matrix)
  createdAt: number;
}

interface FormulationResult {
  status: string;
  cost: number;
  inclusions: { id: string; name: string; pct: number; cost: number; kg?: number }[];
  achieved: Record<string, number>;
  shadow: { name: string; value: number; type: string }[];
  reduced: { id: string; name: string; value: number }[];
  message?: string;
}

// ============= Default ingredient library (chemistry-friendly) =============
const DEFAULT_NUTRIENTS: WFNutrient[] = [
  { id: 'cp', name: 'Crude Protein', unit: '%', min: 18 },
  { id: 'me', name: 'ME', unit: 'kcal/kg', min: 2800 },
  { id: 'ca', name: 'Calcium', unit: '%', min: 0.9, max: 1.2 },
  { id: 'p', name: 'Available P', unit: '%', min: 0.4, max: 0.6 },
  { id: 'lys', name: 'Lysine', unit: '%', min: 1.0 },
  { id: 'met', name: 'Methionine', unit: '%', min: 0.45 },
  { id: 'fiber', name: 'Crude Fiber', unit: '%', max: 5 },
];

const DEFAULT_INGREDIENTS: WFIngredient[] = [
  { id: 'corn', name: 'Maize/Corn', cost: 28, dm: 88, nutrients: { cp: 8.5, me: 3350, ca: 0.02, p: 0.08, lys: 0.25, met: 0.18, fiber: 2.5 }, sd: { cp: 0.6, me: 80 }, maxIncl: 65 },
  { id: 'sbm', name: 'Soybean Meal 48%', cost: 60, dm: 89, nutrients: { cp: 47.5, me: 2440, ca: 0.32, p: 0.30, lys: 2.96, met: 0.65, fiber: 3.4 }, sd: { cp: 1.2, me: 100 }, maxIncl: 35 },
  { id: 'wheat', name: 'Wheat', cost: 32, dm: 88, nutrients: { cp: 12.0, me: 3120, ca: 0.05, p: 0.30, lys: 0.32, met: 0.18, fiber: 2.8 }, sd: { cp: 0.8 }, maxIncl: 40 },
  { id: 'fishmeal', name: 'Fish Meal 60%', cost: 180, dm: 92, nutrients: { cp: 60, me: 2820, ca: 5.5, p: 2.8, lys: 4.7, met: 1.7, fiber: 1.0 }, sd: { cp: 1.8 }, maxIncl: 8 },
  { id: 'lime', name: 'Limestone', cost: 8, dm: 99, nutrients: { ca: 38, p: 0.02 }, maxIncl: 12 },
  { id: 'dcp', name: 'DCP', cost: 65, dm: 97, nutrients: { ca: 23, p: 18.5 }, maxIncl: 4 },
  { id: 'oil', name: 'Vegetable Oil', cost: 110, dm: 100, nutrients: { me: 8800 }, maxIncl: 6 },
  { id: 'lys-hcl', name: 'L-Lysine HCl', cost: 280, dm: 99, nutrients: { cp: 95, lys: 78 }, maxIncl: 1 },
  { id: 'dl-met', name: 'DL-Methionine', cost: 380, dm: 99, nutrients: { cp: 58, met: 99 }, maxIncl: 0.5 },
  { id: 'salt', name: 'Common Salt', cost: 12, dm: 99, nutrients: {}, maxIncl: 0.5 },
];

const DEFAULT_TEMPLATES: WFTemplate[] = [
  {
    id: 'tpl-broiler',
    name: 'Broiler Starter',
    species: 'Poultry',
    basis: 'as-fed',
    totalWeight: 100,
    nutrients: [
      { id: 'cp', name: 'Crude Protein', unit: '%', min: 22 },
      { id: 'me', name: 'ME', unit: 'kcal/kg', min: 2950, max: 3100 },
      { id: 'ca', name: 'Calcium', unit: '%', min: 0.95, max: 1.1 },
      { id: 'p', name: 'Available P', unit: '%', min: 0.45, max: 0.55 },
      { id: 'lys', name: 'Lysine', unit: '%', min: 1.32 },
      { id: 'met', name: 'Methionine', unit: '%', min: 0.5 },
    ],
    ingredients: DEFAULT_INGREDIENTS,
    createdAt: Date.now(),
  },
  {
    id: 'tpl-layer',
    name: 'Layer Phase-1',
    species: 'Poultry',
    basis: 'as-fed',
    totalWeight: 100,
    nutrients: [
      { id: 'cp', name: 'Crude Protein', unit: '%', min: 17 },
      { id: 'me', name: 'ME', unit: 'kcal/kg', min: 2750 },
      { id: 'ca', name: 'Calcium', unit: '%', min: 3.5, max: 4.2 },
      { id: 'p', name: 'Available P', unit: '%', min: 0.4 },
      { id: 'lys', name: 'Lysine', unit: '%', min: 0.8 },
    ],
    ingredients: DEFAULT_INGREDIENTS,
    createdAt: Date.now(),
  },
  {
    id: 'tpl-fish',
    name: 'Fish Grower',
    species: 'Fish',
    basis: 'as-fed',
    totalWeight: 100,
    nutrients: [
      { id: 'cp', name: 'Crude Protein', unit: '%', min: 32 },
      { id: 'me', name: 'ME', unit: 'kcal/kg', min: 2900 },
      { id: 'lys', name: 'Lysine', unit: '%', min: 1.7 },
    ],
    ingredients: DEFAULT_INGREDIENTS,
    createdAt: Date.now(),
  },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

// Standard normal inverse approximation (for stochastic factor)
function normInv(p: number): number {
  // Beasley-Springer-Moro
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pl = 0.02425, ph = 1 - pl;
  let q: number, r: number;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  if (p <= ph) { q = p - 0.5; r = q*q; return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1); }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}

// ============= Main Component =============
export function WinFeedSuite({ isAdmin = false }: { isAdmin?: boolean }) {
  const [templates, setTemplates] = useLocalStorage<WFTemplate[]>('winfeed-templates', DEFAULT_TEMPLATES);
  const [savedStandards] = useLocalStorage<SavedStandard[]>('chemanalyst-standards', []);
  const [activeTplId, setActiveTplId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [tab, setTab] = useState<'design' | 'matrix' | 'optimize' | 'stochastic' | 'sensitivity' | 'backward' | 'batch' | 'reports'>('design');
  const [batchKg, setBatchKg] = useState<number>(1000);
  const [confidence, setConfidence] = useState<number>(95);
  const [basis, setBasis] = useState<'as-fed' | 'dry-matter'>('as-fed');
  const [result, setResult] = useState<FormulationResult | null>(null);
  const [stochResult, setStochResult] = useState<FormulationResult | null>(null);
  const [backwardForm, setBackwardForm] = useState<{ id: string; pct: number }[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const tpl = templates.find(t => t.id === activeTplId) || templates[0];

  const updateTpl = (patch: Partial<WFTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, ...patch } : t));
  };

  const addTemplate = () => {
    const id = `tpl-${Date.now()}`;
    const t: WFTemplate = {
      id, name: 'New Template', species: 'Poultry', basis: 'as-fed', totalWeight: 100,
      nutrients: [...DEFAULT_NUTRIENTS], ingredients: [...DEFAULT_INGREDIENTS], createdAt: Date.now(),
    };
    setTemplates(prev => [t, ...prev]);
    setActiveTplId(id);
    toast.success('Template created');
  };

  const deleteTemplate = () => {
    if (templates.length <= 1) { toast.error('Keep at least 1 template'); return; }
    setTemplates(prev => prev.filter(t => t.id !== tpl.id));
    setActiveTplId(templates.find(t => t.id !== tpl.id)?.id || '');
    toast.success('Template deleted');
  };

  // ============= LP Optimization =============
  const runOptimize = (stochastic = false) => {
    const ings = tpl.ingredients;
    const nuts = tpl.nutrients;
    if (ings.length === 0 || nuts.length === 0) { toast.error('Add nutrients & ingredients first'); return; }
    const n = ings.length;
    const c = ings.map(i => i.cost);
    const lb = ings.map(i => i.minIncl ?? 0);
    const ub = ings.map(i => i.maxIncl ?? 100);
    const constraints: LPConstraint[] = [];

    // Total = totalWeight
    constraints.push({ coeffs: new Array(n).fill(1), type: '=', rhs: tpl.totalWeight, name: 'Total weight' });

    // Stochastic z-factor
    const z = stochastic ? normInv(confidence / 100) : 0;

    nuts.forEach(nut => {
      const coeffs = ings.map(i => {
        let val = i.nutrients[nut.id] ?? 0;
        if (basis === 'dry-matter' && i.dm > 0) val = (val * 100) / i.dm;
        // Stochastic: penalize variability for min constraints (subtract z*sd)
        if (stochastic && nut.min !== undefined) {
          const sd = i.sd?.[nut.id] ?? 0;
          val = val - z * sd / Math.sqrt(Math.max(1, n)); // simplified pooled sd contribution
        }
        return val / tpl.totalWeight; // per percent of mix => contribution per 1% inclusion
      });
      // contribution = sum(coeffs[i] * x[i]) where x in % of mix
      // Result is in nutrient units (e.g. % CP)
      if (nut.min !== undefined) constraints.push({ coeffs, type: '>=', rhs: nut.min, name: `${nut.name} min` });
      if (nut.max !== undefined) constraints.push({ coeffs, type: '<=', rhs: nut.max, name: `${nut.name} max` });
    });

    const sol = solveLP({ c, lb, ub, constraints, varNames: ings.map(i => i.name) });

    if (sol.status !== 'optimal') {
      toast.error(`LP ${sol.status}: ${sol.message || 'no solution'}`);
      const r: FormulationResult = { status: sol.status, cost: 0, inclusions: [], achieved: {}, shadow: [], reduced: [], message: sol.message };
      stochastic ? setStochResult(r) : setResult(r);
      return;
    }

    const inclusions = ings.map((i, idx) => ({
      id: i.id, name: i.name, pct: sol.x[idx], cost: sol.x[idx] * i.cost / tpl.totalWeight,
    })).filter(i => i.pct > 1e-6);

    const achieved: Record<string, number> = {};
    nuts.forEach(nut => {
      let total = 0;
      ings.forEach((i, idx) => {
        let val = i.nutrients[nut.id] ?? 0;
        if (basis === 'dry-matter' && i.dm > 0) val = (val * 100) / i.dm;
        total += (val * sol.x[idx]) / tpl.totalWeight;
      });
      achieved[nut.id] = total;
    });

    const shadow = sol.shadowPrices.map((v, i) => ({
      name: constraints[i].name || `c${i}`, value: v, type: constraints[i].type,
    })).filter(s => Math.abs(s.value) > 1e-4);

    const reduced = ings.map((i, idx) => ({
      id: i.id, name: i.name, value: sol.reducedCosts[idx],
    }));

    const r: FormulationResult = {
      status: 'optimal',
      cost: sol.objective / tpl.totalWeight, // cost per kg (when totalWeight=100, this is cost/100kg => /100; but objective already in cost*pct/100 so this is /kg of mix)
      inclusions, achieved, shadow, reduced,
    };
    // Cost adjustment: objective = sum(c_i * x_i) where x_i is %; so per 1% mix. Per kg: divide by 100 if totalWeight=100
    r.cost = sol.objective / tpl.totalWeight;
    stochastic ? setStochResult(r) : setResult(r);
    toast.success(stochastic ? `Stochastic solution at ${confidence}% confidence` : 'Optimal solution found');
  };

  const batchScale = useMemo(() => {
    if (!result) return [];
    return result.inclusions.map(i => ({ ...i, kg: (i.pct / tpl.totalWeight) * batchKg }));
  }, [result, batchKg, tpl.totalWeight]);

  // ============= Backward Analysis =============
  const backwardAnalysis = useMemo(() => {
    if (backwardForm.length === 0) return null;
    const totalPct = backwardForm.reduce((s, b) => s + b.pct, 0) || 1;
    const cost = backwardForm.reduce((s, b) => {
      const ing = tpl.ingredients.find(i => i.id === b.id);
      return s + (ing?.cost || 0) * b.pct / 100;
    }, 0);
    const achieved: Record<string, number> = {};
    tpl.nutrients.forEach(nut => {
      let total = 0;
      backwardForm.forEach(b => {
        const ing = tpl.ingredients.find(i => i.id === b.id);
        if (!ing) return;
        let val = ing.nutrients[nut.id] ?? 0;
        if (basis === 'dry-matter' && ing.dm > 0) val = (val * 100) / ing.dm;
        total += (val * b.pct) / totalPct;
      });
      achieved[nut.id] = total;
    });
    return { totalPct, cost, achieved };
  }, [backwardForm, tpl, basis]);

  // ============= Excel Import / Export =============
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const matrix = [
      ['Ingredient', 'Cost/kg', 'DM%', 'Min%', 'Max%', ...tpl.nutrients.map(n => `${n.name} (${n.unit})`)],
      ...tpl.ingredients.map(i => [
        i.name, i.cost, i.dm, i.minIncl ?? 0, i.maxIncl ?? 100,
        ...tpl.nutrients.map(n => i.nutrients[n.id] ?? ''),
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(matrix), 'Ingredient Matrix');
    if (result) {
      const r = [
        ['Formulation Result'],
        ['Cost/kg', result.cost.toFixed(3)],
        [],
        ['Ingredient', '%', 'Cost/kg', `${batchKg}kg batch`],
        ...result.inclusions.map(i => [i.name, i.pct.toFixed(3), i.cost.toFixed(3), ((i.pct / tpl.totalWeight) * batchKg).toFixed(2)]),
        [],
        ['Nutrient', 'Achieved', 'Min', 'Max'],
        ...tpl.nutrients.map(n => [n.name, (result.achieved[n.id] ?? 0).toFixed(3), n.min ?? '', n.max ?? '']),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(r), 'Result');
    }
    XLSX.writeFile(wb, `${tpl.name.replace(/\s+/g, '_')}_formulation.xlsx`);
    toast.success('Excel exported');
  };

  const importExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data.length < 2) { toast.error('Empty sheet'); return; }
        const header = data[0].map((h: any) => String(h));
        const nutCols = header.slice(5);
        const newNuts: WFNutrient[] = nutCols.map((h, idx) => {
          const m = h.match(/^(.*?)\s*\((.*?)\)\s*$/);
          return { id: `imp-${idx}`, name: m ? m[1] : h, unit: m ? m[2] : '%' };
        });
        const newIngs: WFIngredient[] = data.slice(1).filter(r => r[0]).map((row, idx) => ({
          id: `imp-ing-${idx}-${Date.now()}`,
          name: String(row[0]), cost: +row[1] || 0, dm: +row[2] || 88,
          minIncl: +row[3] || 0, maxIncl: +row[4] || 100,
          nutrients: Object.fromEntries(newNuts.map((n, i) => [n.id, +row[5 + i] || 0])),
        }));
        updateTpl({ nutrients: [...tpl.nutrients, ...newNuts.filter(n => !tpl.nutrients.find(x => x.name === n.name))], ingredients: newIngs });
        toast.success(`Imported ${newIngs.length} ingredients`);
      } catch (err) { toast.error('Import failed'); console.error(err); }
    };
    reader.readAsBinaryString(file);
  };

  // ============= UI =============
  const tabs: { id: typeof tab; label: string; icon: any }[] = [
    { id: 'design', label: 'Design', icon: Target },
    { id: 'matrix', label: 'Ingredient Matrix', icon: Database },
    { id: 'optimize', label: 'LP Optimize', icon: Wand2 },
    { id: 'stochastic', label: 'Stochastic', icon: Sigma },
    { id: 'sensitivity', label: 'Sensitivity', icon: TrendingUp },
    { id: 'backward', label: 'Backward', icon: Activity },
    { id: 'batch', label: 'Batch & Charts', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const chartData = result?.inclusions.map((i, idx) => ({ name: i.name, value: i.pct, fill: COLORS[idx % COLORS.length] })) || [];
  const nutChartData = result ? tpl.nutrients.map(n => ({
    name: n.name,
    achieved: +(result.achieved[n.id] ?? 0).toFixed(2),
    min: n.min ?? 0,
    max: n.max ?? 0,
  })) : [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header: template selector + actions */}
      <div className="glass-panel rounded-lg p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">WinFeed Pro Suite</span>
          <span className="text-[10px] text-muted-foreground">LP Optimizer • Stochastic • Sensitivity • Batch</span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <select value={tpl.id} onChange={e => setActiveTplId(e.target.value)}
              className="bg-input border border-border rounded-md px-2 py-1 text-xs text-foreground">
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.species})</option>)}
            </select>
            <button onClick={addTemplate} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
              <Plus className="w-3 h-3" /> New
            </button>
            <button onClick={deleteTemplate} className="p-1 text-muted-foreground hover:text-destructive" title="Delete template">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={e => e.target.files?.[0] && importExcel(e.target.files[0])} />
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border">
              <Upload className="w-3 h-3" /> Excel
            </button>
            <button onClick={exportExcel} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                tab === t.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/40'
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* DESIGN: Template setup + nutrient constraints */}
      {tab === 'design' && (
        <div className="glass-panel rounded-lg">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Template Setup & Nutrient Constraints</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-medium">Name</label>
                <input value={tpl.name} onChange={e => updateTpl({ name: e.target.value })}
                  className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-medium">Species</label>
                <select value={tpl.species} onChange={e => updateTpl({ species: e.target.value })}
                  className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm">
                  {['Poultry', 'Cattle', 'Fish', 'Swine', 'Pet', 'Custom'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-medium">Basis</label>
                <select value={basis} onChange={e => setBasis(e.target.value as any)}
                  className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm">
                  <option value="as-fed">As-Fed</option>
                  <option value="dry-matter">Dry Matter</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-medium">Total Weight (%)</label>
                <input type="number" value={tpl.totalWeight} onChange={e => updateTpl({ totalWeight: +e.target.value || 100 })}
                  className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm font-mono" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: '600px' }}>
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-2 px-2 text-muted-foreground uppercase">Nutrient</th>
                    <th className="text-left py-2 px-2 text-muted-foreground uppercase">Unit</th>
                    <th className="text-center py-2 px-2 text-muted-foreground uppercase">Min</th>
                    <th className="text-center py-2 px-2 text-muted-foreground uppercase">Max</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {tpl.nutrients.map((n, idx) => (
                    <tr key={n.id} className="border-b border-border/40">
                      <td className="py-1 px-2"><input value={n.name} onChange={e => {
                        const next = [...tpl.nutrients]; next[idx] = { ...n, name: e.target.value }; updateTpl({ nutrients: next });
                      }} className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-1 font-medium text-foreground" /></td>
                      <td className="py-1 px-2"><input value={n.unit} onChange={e => {
                        const next = [...tpl.nutrients]; next[idx] = { ...n, unit: e.target.value }; updateTpl({ nutrients: next });
                      }} className="w-20 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-1 font-mono" /></td>
                      <td className="py-1 px-2"><input type="number" value={n.min ?? ''} onChange={e => {
                        const next = [...tpl.nutrients]; next[idx] = { ...n, min: e.target.value === '' ? undefined : +e.target.value }; updateTpl({ nutrients: next });
                      }} className="w-20 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-1 font-mono text-center" /></td>
                      <td className="py-1 px-2"><input type="number" value={n.max ?? ''} onChange={e => {
                        const next = [...tpl.nutrients]; next[idx] = { ...n, max: e.target.value === '' ? undefined : +e.target.value }; updateTpl({ nutrients: next });
                      }} className="w-20 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-1 font-mono text-center" /></td>
                      <td><button onClick={() => updateTpl({ nutrients: tpl.nutrients.filter((_, i) => i !== idx) })}
                        className="p-1 text-destructive/60 hover:text-destructive"><Trash2 className="w-3 h-3" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => updateTpl({ nutrients: [...tpl.nutrients, { id: `n-${Date.now()}`, name: 'New', unit: '%' }] })}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
              <Plus className="w-3 h-3" /> Add Nutrient
            </button>
          </div>
        </div>
      )}

      {/* MATRIX: ingredients */}
      {tab === 'matrix' && (
        <div className="glass-panel rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Ingredient × Nutrient Matrix</h3>
              <span className="text-[10px] text-muted-foreground">{tpl.ingredients.length} ingredients</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => updateTpl({ ingredients: [...tpl.ingredients, { id: `ing-${Date.now()}`, name: 'New', cost: 0, dm: 88, nutrients: {} }] })}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                <Plus className="w-3 h-3" /> Ingredient
              </button>
              <button onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground hover:text-foreground border border-border">
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>
          <div className="overflow-x-auto p-3">
            <table className="text-xs" style={{ minWidth: '900px' }}>
              <thead>
                <tr className="border-b border-border bg-secondary/30 sticky top-0">
                  <th className="text-left py-2 px-2 text-muted-foreground uppercase whitespace-nowrap">Ingredient</th>
                  <th className="text-center py-2 px-1 text-muted-foreground uppercase whitespace-nowrap">Cost/kg</th>
                  <th className="text-center py-2 px-1 text-muted-foreground uppercase whitespace-nowrap">DM%</th>
                  <th className="text-center py-2 px-1 text-muted-foreground uppercase whitespace-nowrap">Min%</th>
                  <th className="text-center py-2 px-1 text-muted-foreground uppercase whitespace-nowrap">Max%</th>
                  {tpl.nutrients.map(n => (
                    <th key={n.id} className="text-center py-2 px-1 text-primary uppercase whitespace-nowrap" title={n.unit}>
                      {n.name}
                    </th>
                  ))}
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {tpl.ingredients.map((ing, idx) => (
                  <tr key={ing.id} className="border-b border-border/40 hover:bg-secondary/20">
                    <td className="py-1 px-2"><input value={ing.name} onChange={e => {
                      const next = [...tpl.ingredients]; next[idx] = { ...ing, name: e.target.value }; updateTpl({ ingredients: next });
                    }} className="w-32 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-1 font-medium text-foreground" /></td>
                    <td><input type="number" value={ing.cost} onChange={e => {
                      const next = [...tpl.ingredients]; next[idx] = { ...ing, cost: +e.target.value || 0 }; updateTpl({ ingredients: next });
                    }} className="w-16 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-1 font-mono text-center" /></td>
                    <td><input type="number" value={ing.dm} onChange={e => {
                      const next = [...tpl.ingredients]; next[idx] = { ...ing, dm: +e.target.value || 0 }; updateTpl({ ingredients: next });
                    }} className="w-14 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-1 font-mono text-center" /></td>
                    <td><input type="number" value={ing.minIncl ?? ''} placeholder="0" onChange={e => {
                      const next = [...tpl.ingredients]; next[idx] = { ...ing, minIncl: e.target.value === '' ? undefined : +e.target.value }; updateTpl({ ingredients: next });
                    }} className="w-14 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-1 font-mono text-center" /></td>
                    <td><input type="number" value={ing.maxIncl ?? ''} placeholder="100" onChange={e => {
                      const next = [...tpl.ingredients]; next[idx] = { ...ing, maxIncl: e.target.value === '' ? undefined : +e.target.value }; updateTpl({ ingredients: next });
                    }} className="w-14 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-1 font-mono text-center" /></td>
                    {tpl.nutrients.map(n => (
                      <td key={n.id} className="py-0.5">
                        <input type="number" value={ing.nutrients[n.id] ?? ''} placeholder="0" onChange={e => {
                          const next = [...tpl.ingredients];
                          next[idx] = { ...ing, nutrients: { ...ing.nutrients, [n.id]: +e.target.value || 0 } };
                          updateTpl({ ingredients: next });
                        }} className="w-16 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-1 font-mono text-center" />
                        {ing.sd?.[n.id] !== undefined && (
                          <div className="text-[9px] text-muted-foreground text-center">±{ing.sd[n.id]}</div>
                        )}
                      </td>
                    ))}
                    <td><button onClick={() => updateTpl({ ingredients: tpl.ingredients.filter((_, i) => i !== idx) })}
                      className="p-1 text-destructive/60 hover:text-destructive"><Trash2 className="w-3 h-3" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OPTIMIZE */}
      {tab === 'optimize' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-lg p-4 flex flex-wrap items-center gap-3">
            <button onClick={() => runOptimize(false)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium">
              <Wand2 className="w-4 h-4" /> Solve Least-Cost (LP)
            </button>
            <span className="text-xs text-muted-foreground">Basis: <strong className="text-foreground">{basis}</strong></span>
            {result && (
              <span className="ml-auto text-sm font-mono text-success font-bold">
                Cost: {result.cost.toFixed(3)} per kg
              </span>
            )}
          </div>

          {result && result.status === 'optimal' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-panel rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2 text-foreground">Inclusions</h4>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1 text-muted-foreground">Ingredient</th>
                      <th className="text-right py-1 text-muted-foreground">%</th>
                      <th className="text-right py-1 text-muted-foreground">Cost/kg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.inclusions.map(i => (
                      <tr key={i.id} className="border-b border-border/30">
                        <td className="py-1 text-foreground">{i.name}</td>
                        <td className="py-1 font-mono text-right text-primary font-bold">{i.pct.toFixed(3)}</td>
                        <td className="py-1 font-mono text-right text-muted-foreground">{i.cost.toFixed(3)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-primary/5">
                      <td className="py-1.5">Total</td>
                      <td className="py-1.5 font-mono text-right">{result.inclusions.reduce((s, i) => s + i.pct, 0).toFixed(2)}</td>
                      <td className="py-1.5 font-mono text-right text-success">{result.cost.toFixed(3)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="glass-panel rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2 text-foreground">Nutrients Achieved</h4>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1 text-muted-foreground">Nutrient</th>
                      <th className="text-right py-1 text-muted-foreground">Achieved</th>
                      <th className="text-right py-1 text-muted-foreground">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tpl.nutrients.map(n => {
                      const v = result.achieved[n.id] ?? 0;
                      const okMin = n.min === undefined || v >= n.min - 1e-3;
                      const okMax = n.max === undefined || v <= n.max + 1e-3;
                      const ok = okMin && okMax;
                      return (
                        <tr key={n.id} className="border-b border-border/30">
                          <td className="py-1 text-foreground">{n.name} <span className="text-muted-foreground">({n.unit})</span></td>
                          <td className={`py-1 font-mono text-right font-bold ${ok ? 'text-success' : 'text-destructive'}`}>{v.toFixed(3)}</td>
                          <td className="py-1 font-mono text-right text-muted-foreground">{n.min ?? '—'} ‒ {n.max ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result?.status !== 'optimal' && result && (
            <div className="glass-panel rounded-lg p-4 border-destructive/30">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-semibold">{result.status}: {result.message}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Try relaxing nutrient constraints or raising max-inclusion limits on key ingredients.</p>
            </div>
          )}
        </div>
      )}

      {/* STOCHASTIC */}
      {tab === 'stochastic' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Sigma className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Stochastic (Probability-Based)</span>
              <label className="text-xs text-muted-foreground ml-auto">Confidence:</label>
              <input type="range" min="50" max="99.99" step="0.5" value={confidence} onChange={e => setConfidence(+e.target.value)}
                className="w-32" />
              <span className="text-sm font-mono font-bold text-primary w-16 text-right">{confidence}%</span>
              <button onClick={() => runOptimize(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium">
                <Wand2 className="w-4 h-4" /> Solve Stochastic
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">Accounts for nutrient variability (SD) — solution guarantees nutrient targets are met with selected probability. Add SD values per ingredient/nutrient in the matrix (currently using defaults).</p>
          </div>

          {stochResult && stochResult.status === 'optimal' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-panel rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Stochastic Inclusions @ {confidence}%</h4>
                <table className="w-full text-xs">
                  <tbody>
                    {stochResult.inclusions.map(i => (
                      <tr key={i.id} className="border-b border-border/30">
                        <td className="py-1 text-foreground">{i.name}</td>
                        <td className="py-1 font-mono text-right text-primary font-bold">{i.pct.toFixed(3)}%</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-primary/5">
                      <td className="py-1.5">Cost/kg</td>
                      <td className="py-1.5 font-mono text-right text-success">{stochResult.cost.toFixed(3)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="glass-panel rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Comparison vs Deterministic</h4>
                {result ? (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border"><th className="text-left py-1">Metric</th><th className="text-right py-1">Deterministic</th><th className="text-right py-1">Stochastic</th></tr></thead>
                    <tbody>
                      <tr className="border-b border-border/30"><td className="py-1">Cost/kg</td><td className="py-1 text-right font-mono">{result.cost.toFixed(3)}</td><td className="py-1 text-right font-mono text-primary font-bold">{stochResult.cost.toFixed(3)}</td></tr>
                      <tr><td className="py-1">Risk Premium</td><td colSpan={2} className="py-1 text-right font-mono text-warning">+{((stochResult.cost - result.cost) / result.cost * 100).toFixed(2)}%</td></tr>
                    </tbody>
                  </table>
                ) : <p className="text-xs text-muted-foreground">Run deterministic LP first to compare.</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SENSITIVITY */}
      {tab === 'sensitivity' && (
        <div className="space-y-4">
          {!result ? (
            <div className="glass-panel rounded-lg p-6 text-center text-sm text-muted-foreground">
              Run LP Optimize first to see shadow prices & sensitivity.
            </div>
          ) : (
            <>
              <div className="glass-panel rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Shadow Prices (Constraint Sensitivity)</h4>
                <p className="text-[11px] text-muted-foreground mb-2">How much the optimal cost changes per unit relaxation of each binding constraint.</p>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border"><th className="text-left py-1">Constraint</th><th className="text-center py-1">Type</th><th className="text-right py-1">Shadow Price</th></tr></thead>
                  <tbody>
                    {result.shadow.length === 0 && <tr><td colSpan={3} className="py-3 text-center text-muted-foreground">No binding constraints with active dual values.</td></tr>}
                    {result.shadow.map((s, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="py-1 text-foreground">{s.name}</td>
                        <td className="py-1 text-center font-mono">{s.type}</td>
                        <td className={`py-1 font-mono text-right font-bold ${s.value > 0 ? 'text-warning' : 'text-success'}`}>{s.value.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="glass-panel rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Reduced Costs (Ingredient Marginals)</h4>
                <p className="text-[11px] text-muted-foreground mb-2">Cost penalty if a non-included ingredient were forced into the formula. 0 = currently used; positive = uneconomic at current price.</p>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border"><th className="text-left py-1">Ingredient</th><th className="text-right py-1">Reduced Cost</th><th className="text-right py-1">Status</th></tr></thead>
                  <tbody>
                    {result.reduced.map(r => {
                      const used = result.inclusions.find(i => i.id === r.id);
                      return (
                        <tr key={r.id} className="border-b border-border/30">
                          <td className="py-1 text-foreground">{r.name}</td>
                          <td className="py-1 font-mono text-right">{r.value.toFixed(4)}</td>
                          <td className={`py-1 text-right text-[10px] font-bold ${used ? 'text-success' : 'text-muted-foreground'}`}>{used ? `IN (${used.pct.toFixed(2)}%)` : 'Excluded'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* BACKWARD ANALYSIS */}
      {tab === 'backward' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Backward Analysis — Analyze Existing Formula</h4>
              </div>
              <button onClick={() => setBackwardForm([...backwardForm, { id: tpl.ingredients[0]?.id || '', pct: 0 }])}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20"><Plus className="w-3 h-3" />Row</button>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border"><th className="text-left py-1">Ingredient</th><th className="text-right py-1">%</th><th className="w-8"></th></tr></thead>
              <tbody>
                {backwardForm.map((b, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="py-1">
                      <select value={b.id} onChange={e => {
                        const next = [...backwardForm]; next[i] = { ...b, id: e.target.value }; setBackwardForm(next);
                      }} className="bg-input border border-border rounded px-2 py-1 text-xs w-full">
                        {tpl.ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                      </select>
                    </td>
                    <td className="py-1"><input type="number" value={b.pct} onChange={e => {
                      const next = [...backwardForm]; next[i] = { ...b, pct: +e.target.value || 0 }; setBackwardForm(next);
                    }} className="w-20 bg-input border border-border rounded px-2 py-1 font-mono text-right" /></td>
                    <td><button onClick={() => setBackwardForm(backwardForm.filter((_, x) => x !== i))} className="p-1 text-destructive/60 hover:text-destructive"><Trash2 className="w-3 h-3" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {backwardAnalysis && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass-panel rounded-lg p-4">
                <span className="text-[10px] uppercase text-muted-foreground">Total %</span>
                <p className={`text-2xl font-bold font-mono ${Math.abs(backwardAnalysis.totalPct - 100) < 0.5 ? 'text-success' : 'text-warning'}`}>{backwardAnalysis.totalPct.toFixed(2)}</p>
              </div>
              <div className="glass-panel rounded-lg p-4">
                <span className="text-[10px] uppercase text-muted-foreground">Cost / kg</span>
                <p className="text-2xl font-bold font-mono text-primary">{(backwardAnalysis.cost / (backwardAnalysis.totalPct / 100)).toFixed(3)}</p>
              </div>
              <div className="glass-panel rounded-lg p-4">
                <span className="text-[10px] uppercase text-muted-foreground">Cost (raw)</span>
                <p className="text-2xl font-bold font-mono">{backwardAnalysis.cost.toFixed(3)}</p>
              </div>
              <div className="sm:col-span-3 glass-panel rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Nutrient Profile</h4>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border"><th className="text-left py-1">Nutrient</th><th className="text-right py-1">Value</th><th className="text-right py-1">Target Min</th><th className="text-right py-1">Target Max</th></tr></thead>
                  <tbody>
                    {tpl.nutrients.map(n => {
                      const v = backwardAnalysis.achieved[n.id] ?? 0;
                      const ok = (n.min === undefined || v >= n.min) && (n.max === undefined || v <= n.max);
                      return <tr key={n.id} className="border-b border-border/30"><td className="py-1">{n.name}</td>
                        <td className={`py-1 font-mono text-right font-bold ${ok ? 'text-success' : 'text-destructive'}`}>{v.toFixed(3)} {n.unit}</td>
                        <td className="py-1 text-right font-mono text-muted-foreground">{n.min ?? '—'}</td>
                        <td className="py-1 text-right font-mono text-muted-foreground">{n.max ?? '—'}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BATCH & CHARTS */}
      {tab === 'batch' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-lg p-4 flex flex-wrap items-center gap-3">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Batch Size:</span>
            <input type="number" value={batchKg} onChange={e => setBatchKg(+e.target.value || 0)}
              className="w-32 bg-input border border-border rounded px-3 py-1.5 text-sm font-mono" />
            <span className="text-xs text-muted-foreground">kg (up to 1,000,000)</span>
            {result && <span className="ml-auto text-sm font-mono text-success font-bold">Total cost: {(result.cost * batchKg).toFixed(2)}</span>}
          </div>

          {result && result.status === 'optimal' && (
            <>
              <div className="glass-panel rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">Production Quantities</h4>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border"><th className="text-left py-1">Ingredient</th><th className="text-right py-1">%</th><th className="text-right py-1">Quantity (kg)</th><th className="text-right py-1">Cost</th></tr></thead>
                  <tbody>
                    {batchScale.map(i => (
                      <tr key={i.id} className="border-b border-border/30">
                        <td className="py-1 font-medium">{i.name}</td>
                        <td className="py-1 text-right font-mono">{i.pct.toFixed(3)}</td>
                        <td className="py-1 text-right font-mono text-primary font-bold">{i.kg!.toFixed(3)}</td>
                        <td className="py-1 text-right font-mono">{(i.kg! * (tpl.ingredients.find(x => x.id === i.id)?.cost || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass-panel rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-2">Inclusion Distribution</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(d: any) => `${d.name}: ${d.value.toFixed(1)}%`}>
                        {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass-panel rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-2">Nutrient Achievement vs Targets</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={nutChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="min" fill="#94a3b8" name="Min" />
                      <Bar dataKey="achieved" fill="#3b82f6" name="Achieved" />
                      <Bar dataKey="max" fill="#cbd5e1" name="Max" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* REPORTS */}
      {tab === 'reports' && (
        <div className="glass-panel rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold">Reports & Documentation</h4>
          </div>
          {!result ? <p className="text-sm text-muted-foreground">Run LP first to generate report.</p> : (
            <div className="space-y-3 text-xs">
              <h3 className="text-base font-bold text-foreground">{tpl.name} — Formulation Report</h3>
              <p className="text-muted-foreground">Species: {tpl.species} • Basis: {basis} • Cost/kg: <strong className="text-success">{result.cost.toFixed(3)}</strong></p>
              <div>
                <h5 className="text-sm font-semibold text-foreground mt-3 mb-1">Ingredients</h5>
                <ul className="ml-4 list-disc space-y-0.5">
                  {result.inclusions.map(i => <li key={i.id}><strong>{i.name}</strong>: {i.pct.toFixed(3)}% — {((i.pct / tpl.totalWeight) * batchKg).toFixed(2)} kg</li>)}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-foreground mt-3 mb-1">Guaranteed Analysis</h5>
                <ul className="ml-4 list-disc space-y-0.5">
                  {tpl.nutrients.map(n => <li key={n.id}>{n.name}: <strong>{(result.achieved[n.id] ?? 0).toFixed(2)} {n.unit}</strong></li>)}
                </ul>
              </div>
              <button onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2 mt-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium">
                <Download className="w-4 h-4" /> Export to Excel
              </button>
            </div>
          )}
        </div>
      )}

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setConfirmReset(false)}>
          <div className="bg-card border border-border rounded-lg p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-2">Reset Ingredient Library?</h3>
            <p className="text-xs text-muted-foreground mb-4">Replaces ingredients in this template with the default library.</p>
            <div className="flex gap-2">
              <button onClick={() => { updateTpl({ ingredients: [...DEFAULT_INGREDIENTS] }); setConfirmReset(false); toast.success('Reset'); }}
                className="flex-1 px-3 py-2 rounded-md bg-destructive text-destructive-foreground text-sm">Reset</button>
              <button onClick={() => setConfirmReset(false)} className="px-3 py-2 rounded-md bg-secondary text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
