import { useState, useMemo } from 'react';
import { Calculator, FlaskConical, Flame, Beaker, Layers, Target, Plus, Trash2, ArrowRight, Copy, Sigma, Percent, Atom } from 'lucide-react';
import { calcMolarMass, parseFormula, elements } from '@/lib/periodicTableData';
import { toast } from 'sonner';

type ToolId =
  | 'percent-composition'
  | 'mixture-designer'
  | 'concentration-correction'
  | 'back-titration'
  | 'combustion'
  | 'gravimetric'
  | 'multistep'
  | 'empirical'
  | 'limiting-reagent'
  | 'ph-buffer'
  | 'fertilizer-solver'
  | 'buffer-inventory'
  | 'elemental-analysis'
  | 'hydrate'
  | 'ratio-proportion'
  | 'serial-dilution'
  | 'percent-solution'
  | 'ppm-converter'
  | 'reagent-scaleup'
  | 'molarity-mass';

interface ToolDef {
  id: ToolId;
  name: string;
  icon: React.ReactNode;
  desc: string;
}

const TOOLS: ToolDef[] = [
  { id: 'ratio-proportion', name: 'Ratio & Batch', icon: <Sigma className="w-4 h-4" />, desc: 'N-variable ratio → scale to any total batch size (e.g. 90:7:3 → 5 g)' },
  { id: 'fertilizer-solver', name: 'Fertilizer Solver', icon: <Target className="w-4 h-4" />, desc: 'NPK formulation solver: target N/P₂O₅/K₂O → optimal blend & cost' },
  { id: 'percent-composition', name: '% Composition', icon: <Percent className="w-4 h-4" />, desc: 'Element % in any compound (supports ·5H₂O hydrates)' },
  { id: 'mixture-designer', name: 'Mixture Designer', icon: <Layers className="w-4 h-4" />, desc: 'Solve mass fractions for target element % from multiple salts' },
  { id: 'hydrate', name: 'Hydrate / Anhydrous', icon: <Beaker className="w-4 h-4" />, desc: 'Convert between hydrated & anhydrous mass (e.g. CuSO₄·5H₂O ↔ CuSO₄)' },
  { id: 'serial-dilution', name: 'Serial Dilution', icon: <Layers className="w-4 h-4" />, desc: 'Multi-step serial / log dilution scheme (1:10, 1:2, custom)' },
  { id: 'percent-solution', name: '% Solution (w/w, w/v, v/v)', icon: <Percent className="w-4 h-4" />, desc: 'Make any % solution; solute, solvent & density-aware' },
  { id: 'ppm-converter', name: 'PPM / PPB / mg-L', icon: <Calculator className="w-4 h-4" />, desc: 'Convert between ppm, ppb, mg/L, µg/mL, mg/kg, %' },
  { id: 'molarity-mass', name: 'Molarity ⇄ Mass', icon: <Calculator className="w-4 h-4" />, desc: 'Quick g ⇄ mol ⇄ Molarity for any formula (auto MW)' },
  { id: 'reagent-scaleup', name: 'Reagent Scale-Up', icon: <Sigma className="w-4 h-4" />, desc: 'Scale a recipe up/down by factor or by one reference ingredient' },
  { id: 'concentration-correction', name: 'Conc. Correction', icon: <Target className="w-4 h-4" />, desc: 'Standardization error correction with stock adjustment' },
  { id: 'back-titration', name: 'Back-Titration', icon: <FlaskConical className="w-4 h-4" />, desc: 'Excess reagent + back-titrant analyte calculation' },
  { id: 'combustion', name: 'Combustion / LOI', icon: <Flame className="w-4 h-4" />, desc: 'Loss-on-ignition, ash, moisture, volatile matter' },
  { id: 'elemental-analysis', name: 'Elemental Analysis', icon: <Atom className="w-4 h-4" />, desc: 'CHNS / ash → element % (mg/kg, ppm, %, g/100g)' },
  { id: 'gravimetric', name: 'Gravimetric', icon: <Beaker className="w-4 h-4" />, desc: 'Analyte from precipitate weight using gravimetric factor' },
  { id: 'multistep', name: 'Multi-Step Chain', icon: <Sigma className="w-4 h-4" />, desc: 'Chain calculations: prep → dilute → titrate → result' },
  { id: 'empirical', name: 'Empirical Formula', icon: <Atom className="w-4 h-4" />, desc: 'Empirical & molecular formula from % composition' },
  { id: 'limiting-reagent', name: 'Limiting Reagent', icon: <Calculator className="w-4 h-4" />, desc: 'Stoichiometry, theoretical yield, % yield' },
  { id: 'ph-buffer', name: 'pH / Buffer', icon: <FlaskConical className="w-4 h-4" />, desc: 'pH, pOH, Henderson-Hasselbalch buffer calc' },
  { id: 'buffer-inventory', name: 'Buffer Inventory', icon: <FlaskConical className="w-4 h-4" />, desc: 'Standard pH 0–14 buffer recipes (citrate, phosphate, borate …)' },
];

export function CalculationSuite() {
  const [active, setActive] = useState<ToolId>('ratio-proportion');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`p-3 rounded-lg border text-left transition-all ${
              active === t.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card hover:border-primary/50 text-foreground'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {t.icon}
              <span className="text-xs font-semibold">{t.name}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        {active === 'percent-composition' && <PercentComposition />}
        {active === 'mixture-designer' && <MixtureDesigner />}
        {active === 'concentration-correction' && <ConcentrationCorrection />}
        {active === 'back-titration' && <BackTitration />}
        {active === 'combustion' && <CombustionAnalysis />}
        {active === 'gravimetric' && <Gravimetric />}
        {active === 'multistep' && <MultiStepChain />}
        {active === 'empirical' && <EmpiricalFormula />}
        {active === 'limiting-reagent' && <LimitingReagent />}
        {active === 'ph-buffer' && <PHBuffer />}
        {active === 'fertilizer-solver' && <FertilizerSolver />}
        {active === 'buffer-inventory' && <BufferInventory />}
        {active === 'elemental-analysis' && <ElementalAnalysis />}
        {active === 'hydrate' && <HydrateConverter />}
        {active === 'ratio-proportion' && <RatioProportion />}
        {active === 'serial-dilution' && <SerialDilution />}
        {active === 'percent-solution' && <PercentSolution />}
        {active === 'ppm-converter' && <PpmConverter />}
        {active === 'reagent-scaleup' && <ReagentScaleUp />}
        {active === 'molarity-mass' && <MolarityMass />}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
const num = (v: string | number) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return isNaN(n) ? 0 : n;
};

function NumInput({ label, value, onChange, unit, placeholder }: { label: string; value: string; onChange: (v: string) => void; unit?: string; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none min-w-0"
        />
        {unit && <span className="text-xs font-mono text-muted-foreground shrink-0 w-12">{unit}</span>}
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
      />
    </div>
  );
}

function ResultBox({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: boolean }) {
  return (
    <div className={`rounded-md p-3 border ${accent ? 'border-primary/40 bg-primary/5' : 'border-border bg-secondary/30'}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono text-base font-semibold mt-0.5 ${accent ? 'text-primary' : 'text-foreground'}`}>
        {value} {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

/* ============ TOOL 1: % Composition ============ */
function PercentComposition() {
  const [formula, setFormula] = useState('K2SO4');
  const [target, setTarget] = useState('K');
  const [sampleMass, setSampleMass] = useState('1.0');

  const result = useMemo(() => {
    const mm = calcMolarMass(formula);
    if (!mm) return null;
    const counts = parseFormula(formula);
    const breakdown = Object.entries(counts).map(([sym, n]) => {
      const el = elements.find(e => e.symbol === sym);
      const elMass = el ? el.atomicMass * n : 0;
      return { sym, n, mass: elMass, percent: (elMass / mm.total) * 100 };
    });
    const tgt = breakdown.find(b => b.sym === target);
    return { mm: mm.total, breakdown, tgt };
  }, [formula, target]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Percent className="w-4 h-4 text-primary" /> Element % Composition</h3>
      <p className="text-xs text-muted-foreground">Calculate weight % of any element in a compound. Example: K in K₂SO₄ = 44.87%.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TextInput label="Formula" value={formula} onChange={setFormula} placeholder="K2SO4" />
        <TextInput label="Target Element" value={target} onChange={setTarget} placeholder="K" />
        <NumInput label="Sample Mass" value={sampleMass} onChange={setSampleMass} unit="g" />
      </div>
      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ResultBox label="Molar Mass" value={result.mm.toFixed(3)} unit="g/mol" />
            {result.tgt && <ResultBox label={`% ${target}`} value={result.tgt.percent.toFixed(3)} unit="%" accent />}
            {result.tgt && <ResultBox label={`Mass of ${target}`} value={(result.tgt.percent / 100 * num(sampleMass)).toFixed(4)} unit="g" />}
            {result.tgt && <ResultBox label={`mol ${target}`} value={((result.tgt.percent / 100 * num(sampleMass)) / (elements.find(e => e.symbol === target)?.atomicMass || 1)).toFixed(5)} unit="mol" />}
          </div>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-secondary/50">
                <tr><th className="text-left p-2">Element</th><th className="text-right p-2">Count</th><th className="text-right p-2">Mass (g/mol)</th><th className="text-right p-2">%</th></tr>
              </thead>
              <tbody>
                {result.breakdown.map(b => (
                  <tr key={b.sym} className={`border-t border-border ${b.sym === target ? 'bg-primary/5' : ''}`}>
                    <td className="p-2 font-mono">{b.sym}</td>
                    <td className="p-2 text-right font-mono">{b.n}</td>
                    <td className="p-2 text-right font-mono">{b.mass.toFixed(3)}</td>
                    <td className="p-2 text-right font-mono">{b.percent.toFixed(3)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ============ TOOL 2: Mixture Designer ============ */
interface MixComp { id: string; formula: string; fraction: string; }
function MixtureDesigner() {
  const [comps, setComps] = useState<MixComp[]>([
    { id: '1', formula: 'K2SO4', fraction: '40' },
    { id: '2', formula: 'KCl', fraction: '40' },
    { id: '3', formula: 'Na2SO4', fraction: '20' },
  ]);
  const [targetElement, setTargetElement] = useState('K');
  const [totalMass, setTotalMass] = useState('100');

  const result = useMemo(() => {
    const totalFrac = comps.reduce((s, c) => s + num(c.fraction), 0) || 1;
    const rows = comps.map(c => {
      const mm = calcMolarMass(c.formula);
      if (!mm) return { ...c, mm: 0, elPercent: 0, elMass: 0, mass: 0 };
      const counts = parseFormula(c.formula);
      const cnt = counts[targetElement] || 0;
      const el = elements.find(e => e.symbol === targetElement);
      const elPercent = el ? (el.atomicMass * cnt / mm.total) * 100 : 0;
      const mass = (num(c.fraction) / totalFrac) * num(totalMass);
      const elMass = mass * elPercent / 100;
      return { ...c, mm: mm.total, elPercent, elMass, mass };
    });
    const totalEl = rows.reduce((s, r) => s + r.elMass, 0);
    const overallPercent = (totalEl / num(totalMass)) * 100;
    return { rows, totalEl, overallPercent };
  }, [comps, targetElement, totalMass]);

  const update = (id: string, k: keyof MixComp, v: string) => setComps(p => p.map(c => c.id === id ? { ...c, [k]: v } : c));
  const add = () => setComps(p => [...p, { id: Date.now().toString(), formula: '', fraction: '0' }]);
  const remove = (id: string) => setComps(p => p.filter(c => c.id !== id));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> Mixture / Blend Designer</h3>
      <p className="text-xs text-muted-foreground">Mix multiple salts (K₂SO₄ + KCl + Na₂SO₄ …) and see resulting % of target element (K, S, N, P …) in the blend.</p>
      <div className="grid grid-cols-2 gap-3">
        <TextInput label="Target Element" value={targetElement} onChange={setTargetElement} placeholder="K" />
        <NumInput label="Total Blend Mass" value={totalMass} onChange={setTotalMass} unit="g" />
      </div>
      <div className="space-y-2">
        {comps.map(c => (
          <div key={c.id} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-5"><TextInput label="Formula" value={c.formula} onChange={v => update(c.id, 'formula', v)} placeholder="K2SO4" /></div>
            <div className="col-span-5"><NumInput label="Mass Fraction" value={c.fraction} onChange={v => update(c.id, 'fraction', v)} unit="parts" /></div>
            <button onClick={() => remove(c.id)} className="col-span-2 p-2 text-destructive hover:bg-destructive/10 rounded transition-colors mb-0.5"><Trash2 className="w-4 h-4 mx-auto" /></button>
          </div>
        ))}
        <button onClick={add} className="w-full py-2 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs"><Plus className="w-3 h-3" /> Add Component</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ResultBox label={`Total ${targetElement}`} value={result.totalEl.toFixed(4)} unit="g" />
        <ResultBox label={`Overall % ${targetElement}`} value={result.overallPercent.toFixed(3)} unit="%" accent />
      </div>
      <div className="border border-border rounded-md overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-2">Compound</th>
              <th className="text-right p-2">Mass (g)</th>
              <th className="text-right p-2">% {targetElement} in salt</th>
              <th className="text-right p-2">{targetElement} contributed (g)</th>
              <th className="text-right p-2">% of blend</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map(r => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-2 font-mono">{r.formula}</td>
                <td className="p-2 text-right font-mono">{r.mass.toFixed(3)}</td>
                <td className="p-2 text-right font-mono">{r.elPercent.toFixed(3)}%</td>
                <td className="p-2 text-right font-mono">{r.elMass.toFixed(4)}</td>
                <td className="p-2 text-right font-mono">{(r.elMass / num(totalMass) * 100).toFixed(3)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ TOOL 3: Concentration Correction ============ */
function ConcentrationCorrection() {
  const [target, setTarget] = useState('0.1');
  const [actual, setActual] = useState('0.0987');
  const [stockConc, setStockConc] = useState('1.0');
  const [currentVol, setCurrentVol] = useState('1000');
  const [solventDensity, setSolventDensity] = useState('1.0');

  const r = useMemo(() => {
    const T = num(target), A = num(actual), S = num(stockConc), V = num(currentVol);
    if (!T || !A || !V) return null;
    const errorPct = ((A - T) / T) * 100;
    const totalMolesNeeded = T * V / 1000; // assuming V in mL → L
    const totalMolesPresent = A * V / 1000;
    const deltaMoles = totalMolesNeeded - totalMolesPresent;
    let action: 'add-stock' | 'add-solvent' | 'none' = 'none';
    let amount = 0;
    let note = '';
    if (Math.abs(errorPct) < 0.05) {
      action = 'none';
      note = 'Within tolerance — no correction needed.';
    } else if (A < T) {
      action = 'add-stock';
      // moles to add = deltaMoles ; volume of stock = deltaMoles / S (in L)
      // also adds extra volume so factor is approximate; iterative correction:
      // (A*V + S*x) / (V + x) = T → x = V*(T-A)/(S-T)
      const x = V * (T - A) / (S - T);
      amount = x;
      note = `Add ${x.toFixed(3)} mL of stock (${S} N/M) to raise concentration.`;
    } else {
      action = 'add-solvent';
      // (A*V) / (V + x) = T → x = V*(A-T)/T
      const x = V * (A - T) / T;
      amount = x;
      note = `Dilute by adding ${x.toFixed(3)} mL of solvent.`;
    }
    const factor = A / T;
    return { errorPct, totalMolesNeeded, totalMolesPresent, deltaMoles, action, amount, note, factor };
  }, [target, actual, stockConc, currentVol]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Standardization Correction</h3>
      <p className="text-xs text-muted-foreground">After standardizing a 0.1 N solution, you may find it is 0.0987 N or 0.1023 N. This tool tells you exactly how much stock or solvent to add to make it accurate.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumInput label="Target Conc." value={target} onChange={setTarget} unit="N/M" />
        <NumInput label="Standardized (actual)" value={actual} onChange={setActual} unit="N/M" />
        <NumInput label="Stock Conc." value={stockConc} onChange={setStockConc} unit="N/M" />
        <NumInput label="Current Volume" value={currentVol} onChange={setCurrentVol} unit="mL" />
      </div>
      {r && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ResultBox label="Error" value={`${r.errorPct >= 0 ? '+' : ''}${r.errorPct.toFixed(3)}`} unit="%" accent />
            <ResultBox label="Correction Factor" value={r.factor.toFixed(5)} />
            <ResultBox label="Δ moles" value={r.deltaMoles.toExponential(3)} unit="mol" />
            <ResultBox
              label={r.action === 'add-stock' ? 'Add Stock' : r.action === 'add-solvent' ? 'Add Solvent' : 'Action'}
              value={r.action === 'none' ? '—' : r.amount.toFixed(3)}
              unit={r.action === 'none' ? '' : 'mL'}
              accent
            />
          </div>
          <div className="bg-primary/5 border border-primary/30 rounded-md p-3">
            <div className="text-xs font-semibold text-primary mb-1">Recommendation</div>
            <div className="text-sm text-foreground">{r.note}</div>
            <div className="text-[11px] text-muted-foreground mt-2">
              Use the correction factor <span className="font-mono">{r.factor.toFixed(5)}</span> to multiply titrant volumes if you cannot adjust the bulk solution.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============ TOOL 4: Back Titration ============ */
function BackTitration() {
  const [excessVol, setExcessVol] = useState('25');
  const [excessN, setExcessN] = useState('0.1');
  const [titrantVol, setTitrantVol] = useState('8.5');
  const [titrantN, setTitrantN] = useState('0.1');
  const [eqWt, setEqWt] = useState('40');
  const [sampleMass, setSampleMass] = useState('0.5');

  const r = useMemo(() => {
    const meqAdded = num(excessVol) * num(excessN);
    const meqBack = num(titrantVol) * num(titrantN);
    const meqAnalyte = meqAdded - meqBack;
    const massAnalyte = meqAnalyte * num(eqWt) / 1000; // g
    const purity = (massAnalyte / num(sampleMass)) * 100;
    return { meqAdded, meqBack, meqAnalyte, massAnalyte, purity };
  }, [excessVol, excessN, titrantVol, titrantN, eqWt, sampleMass]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><FlaskConical className="w-4 h-4 text-primary" /> Back-Titration</h3>
      <p className="text-xs text-muted-foreground">Add excess reagent to sample, then titrate the leftover excess with a second titrant.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NumInput label="Excess Reagent Vol" value={excessVol} onChange={setExcessVol} unit="mL" />
        <NumInput label="Excess Reagent N" value={excessN} onChange={setExcessN} unit="N" />
        <NumInput label="Sample Mass" value={sampleMass} onChange={setSampleMass} unit="g" />
        <NumInput label="Back-Titrant Vol" value={titrantVol} onChange={setTitrantVol} unit="mL" />
        <NumInput label="Back-Titrant N" value={titrantN} onChange={setTitrantN} unit="N" />
        <NumInput label="Equivalent Weight" value={eqWt} onChange={setEqWt} unit="g/eq" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <ResultBox label="meq Added" value={r.meqAdded.toFixed(4)} />
        <ResultBox label="meq Back" value={r.meqBack.toFixed(4)} />
        <ResultBox label="meq Analyte" value={r.meqAnalyte.toFixed(4)} />
        <ResultBox label="Mass Analyte" value={r.massAnalyte.toFixed(5)} unit="g" />
        <ResultBox label="% Purity" value={r.purity.toFixed(3)} unit="%" accent />
      </div>
    </div>
  );
}

/* ============ TOOL 5: Combustion / LOI ============ */
function CombustionAnalysis() {
  const [crucible, setCrucible] = useState('25.123');
  const [crucibleSample, setCrucibleSample] = useState('27.456');
  const [afterDry, setAfterDry] = useState('27.234');
  const [afterIgn, setAfterIgn] = useState('25.387');

  const r = useMemo(() => {
    const sample = num(crucibleSample) - num(crucible);
    const dryLoss = num(crucibleSample) - num(afterDry); // moisture
    const ignLoss = num(afterDry) - num(afterIgn); // organic + volatiles
    const ash = num(afterIgn) - num(crucible);
    return {
      sample,
      moisture: sample ? (dryLoss / sample) * 100 : 0,
      volatile: sample ? (ignLoss / sample) * 100 : 0,
      ash: sample ? (ash / sample) * 100 : 0,
      drySample: sample - dryLoss,
      drymatter: sample ? ((sample - dryLoss) / sample) * 100 : 0,
    };
  }, [crucible, crucibleSample, afterDry, afterIgn]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Flame className="w-4 h-4 text-primary" /> Combustion / LOI / Ash</h3>
      <p className="text-xs text-muted-foreground">Determine moisture, volatile matter and ash content from sequential weighings.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumInput label="Crucible (empty)" value={crucible} onChange={setCrucible} unit="g" />
        <NumInput label="Crucible + Sample" value={crucibleSample} onChange={setCrucibleSample} unit="g" />
        <NumInput label="After Drying (105°C)" value={afterDry} onChange={setAfterDry} unit="g" />
        <NumInput label="After Ignition (550°C)" value={afterIgn} onChange={setAfterIgn} unit="g" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <ResultBox label="Sample" value={r.sample.toFixed(4)} unit="g" />
        <ResultBox label="Moisture" value={r.moisture.toFixed(3)} unit="%" accent />
        <ResultBox label="Dry Matter" value={r.drymatter.toFixed(3)} unit="%" />
        <ResultBox label="Volatile/Organic" value={r.volatile.toFixed(3)} unit="%" accent />
        <ResultBox label="Ash" value={r.ash.toFixed(3)} unit="%" accent />
      </div>
    </div>
  );
}

/* ============ TOOL 6: Gravimetric ============ */
function Gravimetric() {
  const [sampleMass, setSampleMass] = useState('0.5');
  const [pptMass, setPptMass] = useState('0.4523');
  const [analyteFormula, setAnalyteFormula] = useState('SO4');
  const [pptFormula, setPptFormula] = useState('BaSO4');
  const [stoich, setStoich] = useState('1');

  const r = useMemo(() => {
    const a = calcMolarMass(analyteFormula);
    const p = calcMolarMass(pptFormula);
    if (!a || !p) return null;
    const factor = (num(stoich) * a.total) / p.total;
    const massAnalyte = num(pptMass) * factor;
    const percent = (massAnalyte / num(sampleMass)) * 100;
    return { factor, massAnalyte, percent, mmA: a.total, mmP: p.total };
  }, [sampleMass, pptMass, analyteFormula, pptFormula, stoich]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Beaker className="w-4 h-4 text-primary" /> Gravimetric Analysis</h3>
      <p className="text-xs text-muted-foreground">% analyte = (ppt mass × gravimetric factor) / sample mass × 100. Factor = (n × MW analyte) / MW precipitate.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NumInput label="Sample Mass" value={sampleMass} onChange={setSampleMass} unit="g" />
        <NumInput label="Precipitate Mass" value={pptMass} onChange={setPptMass} unit="g" />
        <NumInput label="Stoichiometry n" value={stoich} onChange={setStoich} />
        <TextInput label="Analyte Formula" value={analyteFormula} onChange={setAnalyteFormula} placeholder="SO4" />
        <TextInput label="Precipitate Formula" value={pptFormula} onChange={setPptFormula} placeholder="BaSO4" />
      </div>
      {r && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ResultBox label="MW Analyte" value={r.mmA.toFixed(3)} unit="g/mol" />
          <ResultBox label="MW Precipitate" value={r.mmP.toFixed(3)} unit="g/mol" />
          <ResultBox label="Gravimetric Factor" value={r.factor.toFixed(5)} accent />
          <ResultBox label="% Analyte" value={r.percent.toFixed(3)} unit="%" accent />
        </div>
      )}
    </div>
  );
}

/* ============ TOOL 7: Multi-Step Chain ============ */
interface Step { id: string; label: string; expr: string; }
function MultiStepChain() {
  const [steps, setSteps] = useState<Step[]>([
    { id: '1', label: 'Sample mass (g)', expr: '0.5' },
    { id: '2', label: 'Aliquot factor', expr: '250 / 25' },
    { id: '3', label: 'Titrant meq (V*N)', expr: '12.5 * 0.1' },
    { id: '4', label: '% Analyte', expr: '(s3 * 56.1 / 1000) * s2 / s1 * 100' },
  ]);

  const results = useMemo(() => {
    const out: Record<string, number> = {};
    const list: { id: string; label: string; value: number; ok: boolean; expr: string }[] = [];
    steps.forEach((st, idx) => {
      let expr = st.expr;
      // replace s1, s2, ... with previous results
      Object.entries(out).forEach(([k, v]) => {
        expr = expr.replace(new RegExp(`\\b${k}\\b`, 'g'), String(v));
      });
      try {
        // eslint-disable-next-line no-new-func
        const v = Function('"use strict"; return (' + expr + ')')();
        const num = typeof v === 'number' && isFinite(v) ? v : NaN;
        out[`s${idx + 1}`] = num;
        list.push({ id: st.id, label: st.label, value: num, ok: !isNaN(num), expr });
      } catch {
        list.push({ id: st.id, label: st.label, value: NaN, ok: false, expr });
      }
    });
    return list;
  }, [steps]);

  const update = (id: string, k: keyof Step, v: string) => setSteps(p => p.map(s => s.id === id ? { ...s, [k]: v } : s));
  const add = () => setSteps(p => [...p, { id: Date.now().toString(), label: `Step ${p.length + 1}`, expr: '0' }]);
  const remove = (id: string) => setSteps(p => p.filter(s => s.id !== id));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Sigma className="w-4 h-4 text-primary" /> Multi-Step Calculation Chain</h3>
      <p className="text-xs text-muted-foreground">
        Build a chain: each step is an expression. Reference previous step results as <span className="font-mono text-primary">s1, s2, s3 …</span>.
        Operators: + − × (use *) ÷ (use /), parentheses, Math.sqrt, Math.log.
      </p>
      <div className="space-y-2">
        {steps.map((st, idx) => {
          const r = results[idx];
          return (
            <div key={st.id} className="grid grid-cols-12 gap-2 items-end p-2 rounded border border-border bg-secondary/20">
              <div className="col-span-1 text-xs font-mono font-semibold text-primary text-center pb-2">s{idx + 1}</div>
              <div className="col-span-4"><TextInput label="Label" value={st.label} onChange={v => update(st.id, 'label', v)} /></div>
              <div className="col-span-4"><TextInput label="Expression" value={st.expr} onChange={v => update(st.id, 'expr', v)} placeholder="e.g. s1 * 0.1" /></div>
              <div className="col-span-2 text-right">
                <div className="text-[10px] text-muted-foreground uppercase">Result</div>
                <div className={`font-mono text-sm font-semibold ${r?.ok ? 'text-primary' : 'text-destructive'}`}>
                  {r?.ok ? r.value.toLocaleString(undefined, { maximumFractionDigits: 6 }) : 'ERR'}
                </div>
              </div>
              <button onClick={() => remove(st.id)} className="col-span-1 p-2 text-destructive hover:bg-destructive/10 rounded transition-colors">
                <Trash2 className="w-4 h-4 mx-auto" />
              </button>
            </div>
          );
        })}
        <button onClick={add} className="w-full py-2 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs">
          <Plus className="w-3 h-3" /> Add Step
        </button>
      </div>
      <button
        onClick={() => {
          const txt = results.map((r, i) => `s${i + 1}  ${r.label} = ${r.ok ? r.value : 'ERR'}\n   = ${r.expr}`).join('\n');
          navigator.clipboard.writeText(txt);
          toast.success('Chain copied');
        }}
        className="text-xs flex items-center gap-1 text-primary hover:underline"
      >
        <Copy className="w-3 h-3" /> Copy chain & results
      </button>
    </div>
  );
}

/* ============ TOOL 8: Empirical Formula ============ */
interface ElPct { id: string; sym: string; pct: string; }
function EmpiricalFormula() {
  const [items, setItems] = useState<ElPct[]>([
    { id: '1', sym: 'C', pct: '40.00' },
    { id: '2', sym: 'H', pct: '6.71' },
    { id: '3', sym: 'O', pct: '53.29' },
  ]);
  const [molMass, setMolMass] = useState('180');

  const r = useMemo(() => {
    const rows = items.map(it => {
      const el = elements.find(e => e.symbol === it.sym);
      const mass = el?.atomicMass || 0;
      const moles = mass ? num(it.pct) / mass : 0;
      return { ...it, mass, moles };
    });
    const minMol = Math.min(...rows.map(r => r.moles).filter(v => v > 0)) || 1;
    const ratios = rows.map(r => ({ ...r, ratio: r.moles / minMol }));
    // round to nearest integer if close
    const rounded = ratios.map(r => ({ ...r, n: Math.round(r.ratio * 100) / 100 }));
    const empirical = rounded.map(r => `${r.sym}${r.n === 1 ? '' : r.n}`).join('');
    const empMass = rounded.reduce((s, r) => s + r.mass * r.n, 0);
    const factor = num(molMass) / (empMass || 1);
    const k = Math.round(factor);
    const molecular = rounded.map(r => `${r.sym}${(r.n * k) === 1 ? '' : (r.n * k).toFixed(0)}`).join('');
    return { rounded, empirical, empMass, factor, k, molecular };
  }, [items, molMass]);

  const update = (id: string, k: keyof ElPct, v: string) => setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i));
  const add = () => setItems(p => [...p, { id: Date.now().toString(), sym: '', pct: '0' }]);
  const remove = (id: string) => setItems(p => p.filter(i => i.id !== id));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Atom className="w-4 h-4 text-primary" /> Empirical & Molecular Formula</h3>
      <p className="text-xs text-muted-foreground">Convert % composition into empirical and molecular formula.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NumInput label="Molecular Mass (optional)" value={molMass} onChange={setMolMass} unit="g/mol" />
      </div>
      <div className="space-y-2">
        {items.map(it => (
          <div key={it.id} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4"><TextInput label="Element" value={it.sym} onChange={v => update(it.id, 'sym', v)} placeholder="C" /></div>
            <div className="col-span-6"><NumInput label="Percent" value={it.pct} onChange={v => update(it.id, 'pct', v)} unit="%" /></div>
            <button onClick={() => remove(it.id)} className="col-span-2 p-2 text-destructive hover:bg-destructive/10 rounded mb-0.5"><Trash2 className="w-4 h-4 mx-auto" /></button>
          </div>
        ))}
        <button onClick={add} className="w-full py-2 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs"><Plus className="w-3 h-3" /> Add Element</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <ResultBox label="Empirical Formula" value={r.empirical} accent />
        <ResultBox label="Empirical Mass" value={r.empMass.toFixed(3)} unit="g/mol" />
        <ResultBox label="Multiplier (k)" value={r.k} />
        <ResultBox label="Molecular Formula" value={r.molecular} accent />
      </div>
    </div>
  );
}

/* ============ TOOL 9: Limiting Reagent ============ */
interface Reagent { id: string; formula: string; mass: string; coef: string; }
function LimitingReagent() {
  const [reagents, setReagents] = useState<Reagent[]>([
    { id: '1', formula: 'H2', mass: '2.0', coef: '2' },
    { id: '2', formula: 'O2', mass: '32', coef: '1' },
  ]);
  const [productFormula, setProductFormula] = useState('H2O');
  const [productCoef, setProductCoef] = useState('2');
  const [actualYield, setActualYield] = useState('15');

  const r = useMemo(() => {
    const rows = reagents.map(re => {
      const mm = calcMolarMass(re.formula);
      const moles = mm ? num(re.mass) / mm.total : 0;
      const ratio = num(re.coef) ? moles / num(re.coef) : 0;
      return { ...re, mm: mm?.total || 0, moles, ratio };
    });
    if (!rows.length) return null;
    const limiting = rows.reduce((min, r) => (r.ratio < min.ratio ? r : min), rows[0]);
    const prodMM = calcMolarMass(productFormula);
    const theoMoles = limiting.ratio * num(productCoef);
    const theoMass = prodMM ? theoMoles * prodMM.total : 0;
    const yieldPct = theoMass ? (num(actualYield) / theoMass) * 100 : 0;
    return { rows, limiting, theoMoles, theoMass, yieldPct, prodMM: prodMM?.total || 0 };
  }, [reagents, productFormula, productCoef, actualYield]);

  const update = (id: string, k: keyof Reagent, v: string) => setReagents(p => p.map(r => r.id === id ? { ...r, [k]: v } : r));
  const add = () => setReagents(p => [...p, { id: Date.now().toString(), formula: '', mass: '0', coef: '1' }]);
  const remove = (id: string) => setReagents(p => p.filter(r => r.id !== id));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Calculator className="w-4 h-4 text-primary" /> Limiting Reagent / Yield</h3>
      <div className="space-y-2">
        {reagents.map(re => (
          <div key={re.id} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4"><TextInput label="Formula" value={re.formula} onChange={v => update(re.id, 'formula', v)} /></div>
            <div className="col-span-3"><NumInput label="Mass" value={re.mass} onChange={v => update(re.id, 'mass', v)} unit="g" /></div>
            <div className="col-span-3"><NumInput label="Coefficient" value={re.coef} onChange={v => update(re.id, 'coef', v)} /></div>
            <button onClick={() => remove(re.id)} className="col-span-2 p-2 text-destructive hover:bg-destructive/10 rounded mb-0.5"><Trash2 className="w-4 h-4 mx-auto" /></button>
          </div>
        ))}
        <button onClick={add} className="w-full py-2 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs"><Plus className="w-3 h-3" /> Add Reagent</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TextInput label="Product Formula" value={productFormula} onChange={setProductFormula} />
        <NumInput label="Product Coefficient" value={productCoef} onChange={setProductCoef} />
        <NumInput label="Actual Yield" value={actualYield} onChange={setActualYield} unit="g" />
      </div>
      {r && (
        <>
          <div className="border border-border rounded-md overflow-x-auto">
            <table className="w-full text-xs min-w-[400px]">
              <thead className="bg-secondary/50">
                <tr><th className="text-left p-2">Reagent</th><th className="text-right p-2">moles</th><th className="text-right p-2">moles/coef</th><th className="text-center p-2">Status</th></tr>
              </thead>
              <tbody>
                {r.rows.map(row => (
                  <tr key={row.id} className={`border-t border-border ${row.id === r.limiting.id ? 'bg-primary/10' : ''}`}>
                    <td className="p-2 font-mono">{row.formula}</td>
                    <td className="p-2 text-right font-mono">{row.moles.toFixed(4)}</td>
                    <td className="p-2 text-right font-mono">{row.ratio.toFixed(4)}</td>
                    <td className="p-2 text-center">{row.id === r.limiting.id ? <span className="text-primary font-semibold">LIMITING</span> : <span className="text-muted-foreground">excess</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ResultBox label="Limiting" value={r.limiting.formula} accent />
            <ResultBox label="Theo. moles" value={r.theoMoles.toFixed(4)} unit="mol" />
            <ResultBox label="Theo. mass" value={r.theoMass.toFixed(3)} unit="g" />
            <ResultBox label="% Yield" value={r.yieldPct.toFixed(2)} unit="%" accent />
          </div>
        </>
      )}
    </div>
  );
}

/* ============ TOOL 10: pH / Buffer Lab ============ */
interface BufferSystem {
  id: string;
  name: string;
  acid: { formula: string; mw: number; nFactor?: number };
  base: { formula: string; mw: number; nFactor?: number };
  pKa: number;
  range: [number, number];
}

const BUFFER_SYSTEMS: BufferSystem[] = [
  { id: 'phosphoric-1',  name: 'Phosphoric / Phosphate (pKa₁)',     acid:{formula:'H3PO4', mw:97.99},     base:{formula:'NaH2PO4', mw:119.98},  pKa:2.15,  range:[1.15,3.15] },
  { id: 'glycine-1',     name: 'Glycine / Glycinium (pKa₁)',         acid:{formula:'Glycine·HCl', mw:111.53}, base:{formula:'Glycine', mw:75.07}, pKa:2.34, range:[1.34,3.34] },
  { id: 'citrate-1',     name: 'Citric acid / Na-Citrate (pKa₁)',    acid:{formula:'C6H8O7·H2O', mw:210.14}, base:{formula:'Na3C6H5O7·2H2O', mw:294.10}, pKa:3.13, range:[2.13,4.13] },
  { id: 'formate',       name: 'Formate (HCOOH / HCOONa)',           acid:{formula:'HCOOH', mw:46.03},     base:{formula:'HCOONa', mw:68.01},     pKa:3.75, range:[2.75,4.75] },
  { id: 'acetate',       name: 'Acetate (AcOH / NaOAc)',             acid:{formula:'CH3COOH', mw:60.05},   base:{formula:'CH3COONa·3H2O', mw:136.08}, pKa:4.76, range:[3.76,5.76] },
  { id: 'citrate-2',     name: 'Citrate (pKa₂)',                     acid:{formula:'NaH2C6H5O7', mw:214.10}, base:{formula:'Na2HC6H5O7', mw:236.08}, pKa:4.76, range:[3.76,5.76] },
  { id: 'mes',           name: 'MES (Good buffer)',                  acid:{formula:'MES·H', mw:217.22},     base:{formula:'MES-Na', mw:239.20},     pKa:6.15, range:[5.15,7.15] },
  { id: 'bicarbonate-1', name: 'Carbonic / Bicarbonate (pKa₁)',      acid:{formula:'H2CO3', mw:62.03},     base:{formula:'NaHCO3', mw:84.01},     pKa:6.35, range:[5.35,7.35] },
  { id: 'citrate-3',     name: 'Citrate (pKa₃)',                     acid:{formula:'Na2HC6H5O7', mw:236.08}, base:{formula:'Na3C6H5O7·2H2O', mw:294.10}, pKa:6.40, range:[5.40,7.40] },
  { id: 'mops',          name: 'MOPS (Good buffer)',                 acid:{formula:'MOPS·H', mw:209.26},   base:{formula:'MOPS-Na', mw:231.24},   pKa:7.20, range:[6.20,8.20] },
  { id: 'phosphate-2',   name: 'Phosphate (pKa₂)  H₂PO₄⁻/HPO₄²⁻',   acid:{formula:'NaH2PO4', mw:119.98},  base:{formula:'Na2HPO4', mw:141.96},   pKa:7.21, range:[6.21,8.21] },
  { id: 'hepes',         name: 'HEPES (Good buffer)',                acid:{formula:'HEPES·H', mw:238.30},  base:{formula:'HEPES-Na', mw:260.28},  pKa:7.55, range:[6.55,8.55] },
  { id: 'tris',          name: 'Tris-HCl / Tris',                    acid:{formula:'Tris·HCl', mw:157.60}, base:{formula:'Tris', mw:121.14},      pKa:8.06, range:[7.06,9.06] },
  { id: 'borate',        name: 'Borate (Boric / Borax)',             acid:{formula:'H3BO3', mw:61.83},     base:{formula:'Na2B4O7·10H2O', mw:381.37}, pKa:9.24, range:[8.24,10.24] },
  { id: 'ammonia',       name: 'Ammonium / Ammonia',                 acid:{formula:'NH4Cl', mw:53.49},     base:{formula:'NH3', mw:17.03},        pKa:9.25, range:[8.25,10.25] },
  { id: 'glycine-2',     name: 'Glycine / Glycinate (pKa₂)',         acid:{formula:'Glycine', mw:75.07},   base:{formula:'Na-Glycinate', mw:97.05}, pKa:9.60, range:[8.60,10.60] },
  { id: 'carbonate',     name: 'Carbonate (pKa₂)  HCO₃⁻/CO₃²⁻',      acid:{formula:'NaHCO3', mw:84.01},    base:{formula:'Na2CO3', mw:105.99},    pKa:10.33, range:[9.33,11.33] },
  { id: 'phosphate-3',   name: 'Phosphate (pKa₃) HPO₄²⁻/PO₄³⁻',     acid:{formula:'Na2HPO4', mw:141.96},  base:{formula:'Na3PO4', mw:163.94},    pKa:12.32, range:[11.32,13.32] },
];

function PHBuffer() {
  const [mode, setMode] = useState<'designer' | 'reverse' | 'buffer' | 'mix' | 'ph'>('designer');

  // --- pH / pOH ---
  const [phMode, setPhMode] = useState<'h' | 'oh' | 'ph' | 'poh'>('h');
  const [phInput, setPhInput] = useState('0.001');
  const phRes = useMemo(() => {
    const v = num(phInput); if (!v) return null;
    let pH = 0;
    if (phMode === 'h')   pH = -Math.log10(v);
    if (phMode === 'oh')  pH = 14 - (-Math.log10(v));
    if (phMode === 'ph')  pH = v;
    if (phMode === 'poh') pH = 14 - v;
    const pOH = 14 - pH;
    return { pH, pOH, h: Math.pow(10,-pH), oh: Math.pow(10,-pOH) };
  }, [phInput, phMode]);

  // --- Henderson-Hasselbalch (manual) ---
  const [pKa, setPKa] = useState('4.76');
  const [acid, setAcid] = useState('0.1');
  const [base, setBase] = useState('0.1');
  const bufRes = useMemo(() => {
    const a = num(acid), b = num(base), pk = num(pKa);
    if (!a || !b || a<=0 || b<=0) return null;
    const pH = pk + Math.log10(b / a);
    const totalConc = a + b;
    const beta = 2.303 * totalConc * ((a*b)/Math.pow(a+b,2));
    return { pH, pOH: 14 - pH, ratio: b/a, beta };
  }, [acid, base, pKa]);

  // --- Buffer Designer (pick system → grams/mL) ---
  const [sysId, setSysId] = useState('phosphate-2');
  const [targetPH, setTargetPH] = useState('7.40');
  const [targetConc, setTargetConc] = useState('0.1');
  const [concUnit, setConcUnit] = useState<'M'|'N'>('M');
  const [bufVol, setBufVol] = useState('500');
  const [acidPurity, setAcidPurity] = useState('100');
  const [basePurity, setBasePurity] = useState('100');
  const [acidDensity, setAcidDensity] = useState('');
  const [baseDensity, setBaseDensity] = useState('');

  const designer = useMemo(() => {
    const sys = BUFFER_SYSTEMS.find(s=>s.id===sysId); if (!sys) return null;
    const pH = num(targetPH), C = num(targetConc), V = num(bufVol)/1000;
    if (!pH || !C || !V) return null;
    const ratio = Math.pow(10, pH - sys.pKa);
    const nA = sys.acid.nFactor || 1, nB = sys.base.nFactor || 1;
    const C_M_acid = concUnit==='N' ? C / nA : C;
    const C_M_base = concUnit==='N' ? C / nB : C;
    const fracA = 1/(1+ratio);
    const fracB = ratio/(1+ratio);
    const molAcid = C_M_acid * V * fracA;
    const molBase = C_M_base * V * fracB;
    const pA = num(acidPurity)/100 || 1;
    const pB = num(basePurity)/100 || 1;
    const massAcid = (molAcid * sys.acid.mw) / pA;
    const massBase = (molBase * sys.base.mw) / pB;
    const dA = num(acidDensity), dB = num(baseDensity);
    const volAcid = dA>0 ? massAcid/dA : null;
    const volBase = dB>0 ? massBase/dB : null;
    const inRange = pH >= sys.range[0] && pH <= sys.range[1];
    const beta = 2.303 * (C_M_acid*fracA + C_M_base*fracB) * (fracA*fracB);
    return { sys, ratio, fracA, fracB, molAcid, molBase, massAcid, massBase, volAcid, volBase, inRange, beta };
  }, [sysId, targetPH, targetConc, concUnit, bufVol, acidPurity, basePurity, acidDensity, baseDensity]);

  const bestSystems = useMemo(() => {
    const pH = num(targetPH); if (!pH) return [];
    return [...BUFFER_SYSTEMS].sort((a,b) => Math.abs(a.pKa-pH) - Math.abs(b.pKa-pH)).slice(0,4);
  }, [targetPH]);

  // --- Reverse: mass/vol of A + B → resulting pH, M, N ---
  const [rSysId, setRSysId] = useState('phosphate-2');
  const [rMassA, setRMassA] = useState('3.39');
  const [rMassB, setRMassB] = useState('3.53');
  const [rPurA, setRPurA] = useState('100');
  const [rPurB, setRPurB] = useState('100');
  const [rVol, setRVol]   = useState('1000');

  const reverse = useMemo(() => {
    const sys = BUFFER_SYSTEMS.find(s=>s.id===rSysId); if (!sys) return null;
    const mA = num(rMassA), mB = num(rMassB), V = num(rVol)/1000;
    if (!V || (mA<=0 && mB<=0)) return null;
    const pA = num(rPurA)/100||1, pB = num(rPurB)/100||1;
    const molA = (mA * pA) / sys.acid.mw;
    const molB = (mB * pB) / sys.base.mw;
    const cA = molA/V, cB = molB/V;
    let pH: number;
    if (molA>0 && molB>0)      pH = sys.pKa + Math.log10(molB/molA);
    else if (molA>0)           pH = 0.5*(sys.pKa - Math.log10(cA));
    else                       pH = 14 - 0.5*((14-sys.pKa) - Math.log10(cB));
    const totalM = cA + cB;
    const nA = sys.acid.nFactor||1, nB = sys.base.nFactor||1;
    const totalN = cA*nA + cB*nB;
    const denom = Math.pow((cA+cB)||1, 2);
    const beta = 2.303 * totalM * ((cA*cB)/denom);
    return { sys, molA, molB, cA, cB, pH, totalM, totalN, beta };
  }, [rSysId, rMassA, rMassB, rPurA, rPurB, rVol]);

  // --- Strong acid + Strong base mix ---
  const [saConc, setSaConc] = useState('0.1');
  const [saVol, setSaVol] = useState('25');
  const [sbConc, setSbConc] = useState('0.1');
  const [sbVol, setSbVol] = useState('20');
  const mixRes = useMemo(() => {
    const nA = num(saConc)*num(saVol)/1000;
    const nB = num(sbConc)*num(sbVol)/1000;
    const Vtot = (num(saVol)+num(sbVol))/1000;
    if (!Vtot) return null;
    const excess = nA - nB;
    let pH = 7;
    if (Math.abs(excess) < 1e-12) pH = 7;
    else if (excess > 0) pH = -Math.log10(excess/Vtot);
    else pH = 14 - (-Math.log10(-excess/Vtot));
    return { nA, nB, excess, pH, Vtot };
  }, [saConc, saVol, sbConc, sbVol]);

  const tabBtn = (k: typeof mode, label: string) => (
    <button onClick={()=>setMode(k)} className={`px-3 py-1.5 rounded text-xs font-medium ${mode===k?'bg-primary text-primary-foreground':'bg-secondary text-foreground hover:bg-secondary/80'}`}>{label}</button>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><FlaskConical className="w-4 h-4 text-primary" /> pH / Buffer Lab</h3>
      <div className="flex flex-wrap gap-2">
        {tabBtn('designer','① Buffer Designer (g / mL needed)')}
        {tabBtn('reverse','② Reverse: have g of A & B → pH/M/N')}
        {tabBtn('buffer','③ Henderson–Hasselbalch')}
        {tabBtn('mix','④ Strong acid + base mix')}
        {tabBtn('ph','⑤ pH / pOH / [H⁺] / [OH⁻]')}
      </div>

      {mode === 'designer' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Buffer System</label>
              <select value={sysId} onChange={e=>setSysId(e.target.value)} className="w-full bg-input border border-border rounded-md px-2 py-2 text-xs">
                {BUFFER_SYSTEMS.map(s => <option key={s.id} value={s.id}>{s.name} · pKa {s.pKa}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Concentration Unit</label>
              <div className="flex rounded-md border border-border overflow-hidden">
                <button onClick={()=>setConcUnit('M')} className={`flex-1 py-2 text-xs ${concUnit==='M'?'bg-primary text-primary-foreground':'bg-secondary'}`}>Molarity (M)</button>
                <button onClick={()=>setConcUnit('N')} className={`flex-1 py-2 text-xs ${concUnit==='N'?'bg-primary text-primary-foreground':'bg-secondary'}`}>Normality (N)</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <NumInput label="Target pH" value={targetPH} onChange={setTargetPH} />
            <NumInput label={`Target Conc (${concUnit})`} value={targetConc} onChange={setTargetConc} unit={concUnit} />
            <NumInput label="Final Volume" value={bufVol} onChange={setBufVol} unit="mL" />
            <NumInput label="Acid purity" value={acidPurity} onChange={setAcidPurity} unit="%" />
            <NumInput label="Base purity" value={basePurity} onChange={setBasePurity} unit="%" />
            <div />
            <NumInput label="Acid density (liquid)" value={acidDensity} onChange={setAcidDensity} unit="g/mL" />
            <NumInput label="Base density (liquid)" value={baseDensity} onChange={setBaseDensity} unit="g/mL" />
          </div>

          {designer && (
            <>
              <div className={`p-3 rounded-md border ${designer.inRange?'bg-primary/5 border-primary/30':'bg-destructive/10 border-destructive/30'}`}>
                <div className="text-xs">
                  <span className="font-semibold">{designer.sys.name}</span> · pKa {designer.sys.pKa} · useful range pH {designer.sys.range[0].toFixed(2)}–{designer.sys.range[1].toFixed(2)}
                  {!designer.inRange && <span className="text-destructive font-semibold"> · ⚠ target pH outside ±1 of pKa (poor buffering)</span>}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono mt-1">
                  [A⁻]/[HA] = 10^(pH−pKa) = 10^({(num(targetPH)-designer.sys.pKa).toFixed(3)}) = {designer.ratio.toFixed(4)}
                </div>
              </div>

              <div className="border border-border rounded-md overflow-x-auto">
                <table className="w-full text-xs min-w-[640px]">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-2">Component</th>
                      <th className="text-left p-2">Formula</th>
                      <th className="text-right p-2">MW</th>
                      <th className="text-right p-2">Fraction</th>
                      <th className="text-right p-2">Moles</th>
                      <th className="text-right p-2">Mass (g)</th>
                      <th className="text-right p-2">Volume (mL)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="p-2 font-semibold">Weak Acid (HA)</td>
                      <td className="p-2 font-mono">{designer.sys.acid.formula}</td>
                      <td className="p-2 text-right font-mono">{designer.sys.acid.mw.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono">{(designer.fracA*100).toFixed(2)}%</td>
                      <td className="p-2 text-right font-mono">{designer.molAcid.toFixed(5)}</td>
                      <td className="p-2 text-right font-mono text-primary font-bold">{designer.massAcid.toFixed(4)}</td>
                      <td className="p-2 text-right font-mono">{designer.volAcid!==null ? designer.volAcid.toFixed(3) : '—'}</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="p-2 font-semibold">Conj. Base (A⁻)</td>
                      <td className="p-2 font-mono">{designer.sys.base.formula}</td>
                      <td className="p-2 text-right font-mono">{designer.sys.base.mw.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono">{(designer.fracB*100).toFixed(2)}%</td>
                      <td className="p-2 text-right font-mono">{designer.molBase.toFixed(5)}</td>
                      <td className="p-2 text-right font-mono text-primary font-bold">{designer.massBase.toFixed(4)}</td>
                      <td className="p-2 text-right font-mono">{designer.volBase!==null ? designer.volBase.toFixed(3) : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ResultBox label="Target pH" value={num(targetPH).toFixed(3)} accent />
                <ResultBox label="Total Conc" value={num(targetConc).toFixed(4)} unit={concUnit} />
                <ResultBox label="Volume" value={num(bufVol).toFixed(1)} unit="mL" />
                <ResultBox label="β (capacity)" value={designer.beta.toFixed(4)} unit="M/pH" />
              </div>

              <div className="bg-secondary/30 border border-border rounded-md p-2">
                <div className="text-[11px] font-semibold text-muted-foreground mb-1">Top 4 buffer systems for pH {targetPH}</div>
                <div className="flex flex-wrap gap-1">
                  {bestSystems.map(s => (
                    <button key={s.id} onClick={()=>setSysId(s.id)} className={`text-[10px] px-2 py-1 rounded border ${s.id===sysId?'border-primary bg-primary/10 text-primary':'border-border bg-card'}`}>
                      {s.name.split(' ')[0]} · pKa {s.pKa} · Δ{Math.abs(s.pKa - num(targetPH)).toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">After mixing, verify pH with a calibrated meter and fine-tune with ~0.1 M HCl/NaOH. Adjust to final volume <strong>after</strong> pH correction.</p>
            </>
          )}
        </div>
      )}

      {mode === 'reverse' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Buffer System</label>
            <select value={rSysId} onChange={e=>setRSysId(e.target.value)} className="w-full bg-input border border-border rounded-md px-2 py-2 text-xs">
              {BUFFER_SYSTEMS.map(s => <option key={s.id} value={s.id}>{s.name} · pKa {s.pKa}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <NumInput label="Mass of weak acid (A)" value={rMassA} onChange={setRMassA} unit="g" />
            <NumInput label="Acid purity" value={rPurA} onChange={setRPurA} unit="%" />
            <div />
            <NumInput label="Mass of conj. base (B)" value={rMassB} onChange={setRMassB} unit="g" />
            <NumInput label="Base purity" value={rPurB} onChange={setRPurB} unit="%" />
            <NumInput label="Final volume" value={rVol} onChange={setRVol} unit="mL" />
          </div>
          {reverse && (
            <>
              <div className="border border-border rounded-md overflow-x-auto">
                <table className="w-full text-xs min-w-[520px]">
                  <thead className="bg-secondary/50"><tr>
                    <th className="text-left p-2">Component</th><th className="text-right p-2">MW</th><th className="text-right p-2">Moles</th><th className="text-right p-2">[ ] (M)</th>
                  </tr></thead>
                  <tbody>
                    <tr className="border-t border-border"><td className="p-2 font-mono">{reverse.sys.acid.formula} (HA)</td><td className="p-2 text-right font-mono">{reverse.sys.acid.mw.toFixed(2)}</td><td className="p-2 text-right font-mono">{reverse.molA.toFixed(5)}</td><td className="p-2 text-right font-mono">{reverse.cA.toFixed(5)}</td></tr>
                    <tr className="border-t border-border"><td className="p-2 font-mono">{reverse.sys.base.formula} (A⁻)</td><td className="p-2 text-right font-mono">{reverse.sys.base.mw.toFixed(2)}</td><td className="p-2 text-right font-mono">{reverse.molB.toFixed(5)}</td><td className="p-2 text-right font-mono">{reverse.cB.toFixed(5)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ResultBox label="Resulting pH" value={reverse.pH.toFixed(3)} accent />
                <ResultBox label="Total Molarity" value={reverse.totalM.toFixed(4)} unit="M" accent />
                <ResultBox label="Total Normality" value={reverse.totalN.toFixed(4)} unit="N" />
                <ResultBox label="β capacity" value={reverse.beta.toFixed(4)} unit="M/pH" />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">pH = pKa + log([A⁻]/[HA]) = {reverse.sys.pKa} + log({reverse.cB.toFixed(4)}/{reverse.cA.toFixed(4)})</p>
            </>
          )}
        </div>
      )}

      {mode === 'buffer' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <NumInput label="pKa" value={pKa} onChange={setPKa} />
            <NumInput label="[Acid] HA" value={acid} onChange={setAcid} unit="M" />
            <NumInput label="[Conj. Base] A⁻" value={base} onChange={setBase} unit="M" />
          </div>
          {bufRes && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <ResultBox label="Buffer pH" value={bufRes.pH.toFixed(3)} accent />
              <ResultBox label="Buffer pOH" value={bufRes.pOH.toFixed(3)} />
              <ResultBox label="[A⁻]/[HA]" value={bufRes.ratio.toFixed(4)} />
              <ResultBox label="β capacity" value={bufRes.beta.toFixed(4)} unit="M/pH" />
            </div>
          )}
          <p className="text-[11px] text-muted-foreground font-mono">pH = pKa + log([A⁻]/[HA]) · β = 2.303·C·([HA][A⁻]/([HA]+[A⁻])²)</p>
        </div>
      )}

      {mode === 'mix' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Mix a strong monoprotic acid with a strong monoprotic base — get the resulting pH from excess H⁺ or OH⁻.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NumInput label="Acid Concentration" value={saConc} onChange={setSaConc} unit="M" />
            <NumInput label="Acid Volume" value={saVol} onChange={setSaVol} unit="mL" />
            <NumInput label="Base Concentration" value={sbConc} onChange={setSbConc} unit="M" />
            <NumInput label="Base Volume" value={sbVol} onChange={setSbVol} unit="mL" />
          </div>
          {mixRes && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ResultBox label="mol Acid" value={mixRes.nA.toFixed(5)} unit="mol" />
                <ResultBox label="mol Base" value={mixRes.nB.toFixed(5)} unit="mol" />
                <ResultBox label="Excess" value={Math.abs(mixRes.excess).toExponential(3)} unit={mixRes.excess>=0?'mol H⁺':'mol OH⁻'} />
                <ResultBox label="Final pH" value={mixRes.pH.toFixed(3)} accent />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">Final V = {(mixRes.Vtot*1000).toFixed(2)} mL · assumes complete neutralisation (no buffering)</p>
            </>
          )}
        </div>
      )}

      {mode === 'ph' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['h','oh','ph','poh'] as const).map(k => (
              <button key={k} onClick={()=>setPhMode(k)} className={`px-2.5 py-1 rounded text-[11px] ${phMode===k?'bg-primary text-primary-foreground':'bg-secondary'}`}>
                from {k === 'h' ? '[H⁺]' : k === 'oh' ? '[OH⁻]' : k === 'ph' ? 'pH' : 'pOH'}
              </button>
            ))}
          </div>
          <NumInput label={phMode==='h'?'[H⁺]':phMode==='oh'?'[OH⁻]':phMode==='ph'?'pH':'pOH'} value={phInput} onChange={setPhInput} unit={phMode==='h'||phMode==='oh'?'M':''} />
          {phRes && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <ResultBox label="pH" value={phRes.pH.toFixed(3)} accent />
              <ResultBox label="pOH" value={phRes.pOH.toFixed(3)} />
              <ResultBox label="[H⁺]" value={phRes.h.toExponential(3)} unit="M" />
              <ResultBox label="[OH⁻]" value={phRes.oh.toExponential(3)} unit="M" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ TOOL 11: Hydrate Converter ============ */
function HydrateConverter() {
  const [anhydrous, setAnhydrous] = useState('CuSO4');
  const [waters, setWaters] = useState('5');
  const [mass, setMass] = useState('10');
  const [direction, setDirection] = useState<'hydrated-from-anhy' | 'anhy-from-hydrated'>('hydrated-from-anhy');

  const r = useMemo(() => {
    const a = calcMolarMass(anhydrous);
    const w = calcMolarMass('H2O');
    if (!a || !w) return null;
    const n = num(waters);
    const mmHydrated = a.total + n * w.total;
    const fracAnhy = a.total / mmHydrated;
    const fracWater = (n * w.total) / mmHydrated;
    const m = num(mass);
    let outAnhy = 0, outHyd = 0, outWater = 0;
    if (direction === 'hydrated-from-anhy') {
      outAnhy = m;
      outHyd = m * mmHydrated / a.total;
      outWater = outHyd - outAnhy;
    } else {
      outHyd = m;
      outAnhy = m * fracAnhy;
      outWater = m * fracWater;
    }
    return { mmA: a.total, mmW: w.total, mmHydrated, fracAnhy, fracWater, outAnhy, outHyd, outWater };
  }, [anhydrous, waters, mass, direction]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Beaker className="w-4 h-4 text-primary" /> Hydrate ↔ Anhydrous Converter</h3>
      <p className="text-xs text-muted-foreground">Convert between hydrated salt (e.g. CuSO₄·5H₂O) and anhydrous mass. Specify number of water molecules.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TextInput label="Anhydrous Formula" value={anhydrous} onChange={setAnhydrous} placeholder="CuSO4" />
        <NumInput label="Water Molecules (n)" value={waters} onChange={setWaters} unit="H₂O" />
        <NumInput label="Mass Available" value={mass} onChange={setMass} unit="g" />
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Direction</label>
          <select value={direction} onChange={e => setDirection(e.target.value as any)} className="w-full bg-input border border-border rounded-md px-2 py-2 text-xs">
            <option value="hydrated-from-anhy">Have anhydrous → need hydrated</option>
            <option value="anhy-from-hydrated">Have hydrated → need anhydrous</option>
          </select>
        </div>
      </div>
      {r && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ResultBox label="MW Anhydrous" value={r.mmA.toFixed(3)} unit="g/mol" />
            <ResultBox label="MW Hydrated" value={r.mmHydrated.toFixed(3)} unit="g/mol" />
            <ResultBox label="% Anhydrous" value={(r.fracAnhy * 100).toFixed(2)} unit="%" />
            <ResultBox label="% Water" value={(r.fracWater * 100).toFixed(2)} unit="%" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ResultBox label="Anhydrous mass" value={r.outAnhy.toFixed(4)} unit="g" accent />
            <ResultBox label="Hydrated mass" value={r.outHyd.toFixed(4)} unit="g" accent />
            <ResultBox label="Water released/needed" value={r.outWater.toFixed(4)} unit="g" />
          </div>
        </>
      )}
    </div>
  );
}

/* ============ TOOL 12: Elemental Analysis ============ */
interface ElEntry { id: string; sym: string; raw: string; }
function ElementalAnalysis() {
  const [sampleMass, setSampleMass] = useState('1.000');
  const [unit, setUnit] = useState<'g' | 'mg' | 'percent' | 'mg_per_kg' | 'ppm'>('g');
  const [items, setItems] = useState<ElEntry[]>([
    { id: '1', sym: 'C', raw: '0.452' },
    { id: '2', sym: 'H', raw: '0.067' },
    { id: '3', sym: 'N', raw: '0.121' },
    { id: '4', sym: 'S', raw: '0.024' },
  ]);

  const r = useMemo(() => {
    const sm = num(sampleMass);
    const rows = items.map(it => {
      const v = num(it.raw);
      let massG = 0;
      if (unit === 'g') massG = v;
      else if (unit === 'mg') massG = v / 1000;
      else if (unit === 'percent') massG = sm * v / 100;
      else if (unit === 'mg_per_kg' || unit === 'ppm') massG = sm * v / 1e6;
      const pct = sm ? (massG / sm) * 100 : 0;
      const ppm = pct * 10000;
      const mgkg = ppm;
      const el = elements.find(e => e.symbol === it.sym);
      const moles = el ? massG / el.atomicMass : 0;
      return { ...it, massG, pct, ppm, mgkg, moles, mw: el?.atomicMass || 0 };
    });
    const totalPct = rows.reduce((s, r) => s + r.pct, 0);
    return { rows, totalPct, otherPct: Math.max(0, 100 - totalPct) };
  }, [items, sampleMass, unit]);

  const update = (id: string, k: keyof ElEntry, v: string) => setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i));
  const add = () => setItems(p => [...p, { id: Date.now().toString(), sym: '', raw: '0' }]);
  const remove = (id: string) => setItems(p => p.filter(i => i.id !== id));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Atom className="w-4 h-4 text-primary" /> Elemental Analysis (CHNS / Trace)</h3>
      <p className="text-xs text-muted-foreground">Convert raw element readings (CHNS analyzer, AAS, ICP) into %, ppm, mg/kg and moles. Switch the input unit to match your instrument.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NumInput label="Sample Mass" value={sampleMass} onChange={setSampleMass} unit="g" />
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Reading Unit</label>
          <select value={unit} onChange={e => setUnit(e.target.value as any)} className="w-full bg-input border border-border rounded-md px-2 py-2 text-xs">
            <option value="g">grams of element</option>
            <option value="mg">mg of element</option>
            <option value="percent">% w/w</option>
            <option value="mg_per_kg">mg/kg of sample</option>
            <option value="ppm">ppm of sample</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        {items.map(it => (
          <div key={it.id} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4"><TextInput label="Element" value={it.sym} onChange={v => update(it.id, 'sym', v)} placeholder="C" /></div>
            <div className="col-span-6"><NumInput label="Reading" value={it.raw} onChange={v => update(it.id, 'raw', v)} unit={unit} /></div>
            <button onClick={() => remove(it.id)} className="col-span-2 p-2 text-destructive hover:bg-destructive/10 rounded mb-0.5"><Trash2 className="w-4 h-4 mx-auto" /></button>
          </div>
        ))}
        <button onClick={add} className="w-full py-2 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs"><Plus className="w-3 h-3" /> Add Element</button>
      </div>
      <div className="border border-border rounded-md overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-2">Element</th>
              <th className="text-right p-2">Mass (g)</th>
              <th className="text-right p-2">%</th>
              <th className="text-right p-2">mg/kg (ppm)</th>
              <th className="text-right p-2">moles</th>
            </tr>
          </thead>
          <tbody>
            {r.rows.map(row => (
              <tr key={row.id} className="border-t border-border">
                <td className="p-2 font-mono">{row.sym}</td>
                <td className="p-2 text-right font-mono">{row.massG.toExponential(3)}</td>
                <td className="p-2 text-right font-mono">{row.pct.toFixed(4)}</td>
                <td className="p-2 text-right font-mono">{row.ppm.toFixed(2)}</td>
                <td className="p-2 text-right font-mono">{row.moles.toExponential(3)}</td>
              </tr>
            ))}
            <tr className="border-t border-border bg-secondary/30 font-semibold">
              <td className="p-2">Total identified</td>
              <td></td>
              <td className="p-2 text-right font-mono">{r.totalPct.toFixed(3)}%</td>
              <td colSpan={2} className="p-2 text-right text-muted-foreground">Balance / O / ash: {r.otherPct.toFixed(3)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ TOOL 13: Buffer Inventory (pH 0–14) ============ */
interface BufferRecipe {
  pH: number;
  name: string;
  components: string;
  recipe: string;
  notes?: string;
}
const BUFFER_RECIPES: BufferRecipe[] = [
  { pH: 1.0, name: 'HCl / KCl (Clark–Lubs)', components: 'KCl 0.2 M + HCl 0.2 M', recipe: '50 mL 0.2 M KCl + 67.0 mL 0.2 M HCl, dilute to 200 mL' },
  { pH: 1.68, name: 'Potassium Tetraoxalate', components: 'KH3(C2O4)2·2H2O', recipe: 'Saturated solution at 25 °C (≈0.05 m)' },
  { pH: 2.0, name: 'HCl / KCl', components: 'KCl 0.2 M + HCl 0.2 M', recipe: '50 mL 0.2 M KCl + 13.0 mL 0.2 M HCl → 200 mL' },
  { pH: 3.0, name: 'Citrate', components: 'Citric acid + Na-citrate', recipe: '20.5 mL 0.1 M citric acid + 4.5 mL 0.1 M tri-Na citrate → 100 mL' },
  { pH: 3.56, name: 'Potassium Hydrogen Tartrate', components: 'KHC4H4O6', recipe: 'Saturated solution at 25 °C' },
  { pH: 4.0, name: 'Phthalate (NIST)', components: 'KHC8H4O4 0.05 m', recipe: '10.21 g KHP in 1 L CO₂-free water' },
  { pH: 4.5, name: 'Acetate', components: 'Acetic acid + NaOAc', recipe: '14.8 mL 0.2 M AcOH + 5.2 mL 0.2 M NaOAc → 100 mL' },
  { pH: 5.0, name: 'Acetate', components: 'Acetic acid + NaOAc', recipe: '14.8 mL 0.2 M AcOH + 35.2 mL 0.2 M NaOAc → 100 mL' },
  { pH: 6.0, name: 'Phosphate', components: 'KH2PO4 + Na2HPO4', recipe: '87.7 mL 0.1 M KH2PO4 + 12.3 mL 0.1 M Na2HPO4' },
  { pH: 6.86, name: 'Phosphate (NIST 1:1)', components: 'KH2PO4 + Na2HPO4', recipe: '3.39 g KH2PO4 + 3.53 g Na2HPO4 → 1 L' },
  { pH: 7.0, name: 'Phosphate', components: 'KH2PO4 + Na2HPO4', recipe: '39.0 mL 0.1 M KH2PO4 + 61.0 mL 0.1 M Na2HPO4' },
  { pH: 7.4, name: 'Phosphate (PBS)', components: 'NaCl + KCl + Na2HPO4 + KH2PO4', recipe: '8.0 g NaCl + 0.2 g KCl + 1.44 g Na2HPO4 + 0.24 g KH2PO4 → 1 L' },
  { pH: 8.0, name: 'Tris-HCl', components: 'Tris + HCl', recipe: '50 mL 0.1 M Tris + 26.8 mL 0.1 M HCl → 100 mL' },
  { pH: 9.0, name: 'Borate', components: 'Boric acid + Borax', recipe: '50 mL 0.1 M H3BO3/KCl + 4.6 mL 0.1 M NaOH → 100 mL' },
  { pH: 9.18, name: 'Borax (NIST)', components: 'Na2B4O7·10H2O 0.01 m', recipe: '3.80 g Borax → 1 L' },
  { pH: 10.0, name: 'Carbonate', components: 'NaHCO3 + Na2CO3', recipe: '50 mL 0.1 M NaHCO3 + 10.7 mL 0.1 M NaOH → 100 mL' },
  { pH: 10.01, name: 'NIST Carbonate', components: 'NaHCO3 + Na2CO3 0.025 m each', recipe: '2.092 g NaHCO3 + 2.640 g Na2CO3 → 1 L' },
  { pH: 11.0, name: 'Phosphate / NaOH', components: 'Na2HPO4 + NaOH', recipe: '50 mL 0.05 M Na2HPO4 + 4.1 mL 0.1 M NaOH → 100 mL' },
  { pH: 12.0, name: 'KCl / NaOH', components: 'KCl 0.2 M + NaOH 0.2 M', recipe: '50 mL 0.2 M KCl + 6.0 mL 0.2 M NaOH → 200 mL' },
  { pH: 12.45, name: 'Calcium Hydroxide', components: 'Ca(OH)2 saturated', recipe: 'Saturated Ca(OH)2 at 25 °C' },
  { pH: 13.0, name: 'KCl / NaOH', components: 'KCl 0.2 M + NaOH 0.2 M', recipe: '25 mL 0.2 M KCl + 66.0 mL 0.2 M NaOH → 200 mL' },
  { pH: 14.0, name: 'NaOH 1 M', components: 'NaOH', recipe: '40.0 g NaOH → 1 L (handle with care)' },
];

function BufferInventory() {
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState('7.4');
  const [volume, setVolume] = useState('500');

  const filtered = BUFFER_RECIPES.filter(b =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.components.toLowerCase().includes(search.toLowerCase()) ||
    b.pH.toString().includes(search)
  );

  const closest = useMemo(() => {
    const t = num(target);
    return [...BUFFER_RECIPES].sort((a, b) => Math.abs(a.pH - t) - Math.abs(b.pH - t)).slice(0, 3);
  }, [target]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><FlaskConical className="w-4 h-4 text-primary" /> pH Buffer Inventory (0–14)</h3>
      <p className="text-xs text-muted-foreground">Standard buffer recipes from NIST, Clark–Lubs and Sörensen tables. Enter your target pH to get the closest matches.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NumInput label="Target pH" value={target} onChange={setTarget} />
        <NumInput label="Volume needed" value={volume} onChange={setVolume} unit="mL" />
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Search</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="phosphate, citrate, 7.4 …"
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/30 rounded-md p-3 space-y-2">
        <div className="text-xs font-semibold text-primary">Closest matches for pH {target}</div>
        {closest.map(b => (
          <div key={b.pH + b.name} className="text-xs">
            <span className="font-mono font-semibold text-primary">pH {b.pH.toFixed(2)}</span> — <span className="font-medium">{b.name}</span> · <span className="text-muted-foreground">{b.recipe} (scale × {(num(volume) / (b.recipe.includes('1 L') ? 1000 : b.recipe.match(/(\d+)\s*mL/) ? num(b.recipe.match(/(\d+)\s*mL/)![1]) : 100)).toFixed(2)})</span>
          </div>
        ))}
      </div>

      <div className="border border-border rounded-md overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-2 w-16">pH</th>
              <th className="text-left p-2">Buffer System</th>
              <th className="text-left p-2">Components</th>
              <th className="text-left p-2">Recipe (per batch)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.pH + b.name} className="border-t border-border hover:bg-secondary/20">
                <td className="p-2 font-mono font-semibold text-primary">{b.pH.toFixed(2)}</td>
                <td className="p-2">{b.name}</td>
                <td className="p-2 font-mono text-muted-foreground">{b.components}</td>
                <td className="p-2 text-muted-foreground">{b.recipe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ TOOL 14: Fertilizer / NPK Solver ============ */
interface FertRM {
  id: string;
  name: string;
  N: string;
  P2O5: string;
  K2O: string;
  cost: string;
  density: string;
  maxPct: string;
  enabled: boolean;
}
function FertilizerSolver() {
  const [tgtN, setTgtN] = useState('12');
  const [tgtP, setTgtP] = useState('15');
  const [tgtK, setTgtK] = useState('0');
  const [batch, setBatch] = useState('1000');
  const [phase, setPhase] = useState<'liquid' | 'solid'>('liquid');
  const [maxSolids, setMaxSolids] = useState('50');
  const [rms, setRms] = useState<FertRM[]>([
    { id: '1', name: 'Phosphoric Acid (75%)', N: '0', P2O5: '54', K2O: '0', cost: '120', density: '1.579', maxPct: '80', enabled: true },
    { id: '2', name: 'MAP', N: '12', P2O5: '61', K2O: '0', cost: '150', density: '1.0', maxPct: '100', enabled: true },
    { id: '3', name: 'DAP', N: '18', P2O5: '46', K2O: '0', cost: '140', density: '1.0', maxPct: '100', enabled: true },
    { id: '4', name: 'Urea', N: '46', P2O5: '0', K2O: '0', cost: '100', density: '1.0', maxPct: '100', enabled: true },
    { id: '5', name: 'KCl (MOP)', N: '0', P2O5: '0', K2O: '60', cost: '90', density: '1.0', maxPct: '100', enabled: true },
    { id: '6', name: 'K2SO4 (SOP)', N: '0', P2O5: '0', K2O: '50', cost: '160', density: '1.0', maxPct: '100', enabled: true },
    { id: '7', name: 'Water', N: '0', P2O5: '0', K2O: '0', cost: '1', density: '1.0', maxPct: '100', enabled: true },
  ]);

  const update = (id: string, k: keyof FertRM, v: any) => setRms(p => p.map(r => r.id === id ? { ...r, [k]: v } : r));
  const add = () => setRms(p => [...p, { id: Date.now().toString(), name: 'New RM', N: '0', P2O5: '0', K2O: '0', cost: '0', density: '1.0', maxPct: '100', enabled: true }]);
  const remove = (id: string) => setRms(p => p.filter(r => r.id !== id));

  // Linear-programming-ish heuristic: greedy by cost-per-nutrient; iteratively allocate to meet targets,
  // then balance with water (fill).
  const result = useMemo(() => {
    const T = { N: num(tgtN), P2O5: num(tgtP), K2O: num(tgtK) };
    const B = num(batch);
    if (!B) return null;
    const massNeeded = { N: T.N * B / 100, P2O5: T.P2O5 * B / 100, K2O: T.K2O * B / 100 };
    const active = rms.filter(r => r.enabled).map(r => ({ ...r, used: 0 }));
    const water = active.find(r => r.name.toLowerCase().includes('water'));
    const sources = active.filter(r => r !== water);

    const remaining = { ...massNeeded };
    const warnings: string[] = [];

    // Strategy: for each nutrient, pick cheapest pure source first, then partial sources.
    const nutrients: (keyof typeof remaining)[] = ['P2O5', 'K2O', 'N']; // tackle hard ones first
    for (const nutr of nutrients) {
      if (remaining[nutr] <= 0) continue;
      // sort candidates by cost / (% of nutr) ascending, skip those that contribute to already-overshooting nutrients
      const cands = sources
        .filter(s => num(s[nutr]) > 0)
        .map(s => ({ s, costPerKg: num(s.cost) / (num(s[nutr]) / 100) }))
        .sort((a, b) => a.costPerKg - b.costPerKg);
      for (const { s } of cands) {
        if (remaining[nutr] <= 1e-6) break;
        const pct = num(s[nutr]) / 100;
        const maxByPct = (num(s.maxPct) / 100) * B - s.used;
        const needMass = remaining[nutr] / pct;
        const add = Math.max(0, Math.min(needMass, maxByPct));
        if (add <= 0) continue;
        s.used += add;
        // subtract contributions to all nutrients
        remaining.N -= add * num(s.N) / 100;
        remaining.P2O5 -= add * num(s.P2O5) / 100;
        remaining.K2O -= add * num(s.K2O) / 100;
      }
    }

    // Check feasibility
    (['N', 'P2O5', 'K2O'] as const).forEach(n => {
      if (remaining[n] > 0.01) warnings.push(`Could not meet ${n}: short by ${remaining[n].toFixed(2)} g`);
    });

    const usedMass = active.reduce((s, a) => s + a.used, 0);
    const solidsMass = active.filter(a => a !== water).reduce((s, a) => s + a.used, 0);
    let waterAdd = 0;
    if (water) {
      waterAdd = Math.max(0, B - usedMass);
      water.used = waterAdd;
    }
    const finalMass = active.reduce((s, a) => s + a.used, 0);

    const solidsPct = (solidsMass / (finalMass || 1)) * 100;
    if (phase === 'liquid' && solidsPct > num(maxSolids)) {
      warnings.push(`Solids ${solidsPct.toFixed(1)}% exceeds max solids loading ${maxSolids}%`);
    }

    const final = {
      N: active.reduce((s, a) => s + a.used * num(a.N) / 100, 0) / finalMass * 100,
      P2O5: active.reduce((s, a) => s + a.used * num(a.P2O5) / 100, 0) / finalMass * 100,
      K2O: active.reduce((s, a) => s + a.used * num(a.K2O) / 100, 0) / finalMass * 100,
    };
    const cost = active.reduce((s, a) => s + a.used / 1000 * num(a.cost), 0);
    const wAvg = active.reduce((s, a) => s + a.used * num(a.density), 0);
    const density = wAvg / (finalMass || 1);

    return { active, finalMass, solidsPct, waterAdd, final, cost, density, warnings, target: T };
  }, [rms, tgtN, tgtP, tgtK, batch, phase, maxSolids]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Fertilizer / NPK Formulation Solver</h3>
      <p className="text-xs text-muted-foreground">
        Enter target N–P₂O₅–K₂O grade. The solver greedily selects the cheapest combination of raw materials, balances with water, and reports density, solids loading, cost and warnings.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <NumInput label="Target N" value={tgtN} onChange={setTgtN} unit="%" />
        <NumInput label="Target P₂O₅" value={tgtP} onChange={setTgtP} unit="%" />
        <NumInput label="Target K₂O" value={tgtK} onChange={setTgtK} unit="%" />
        <NumInput label="Batch Size" value={batch} onChange={setBatch} unit="g" />
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Phase</label>
          <select value={phase} onChange={e => setPhase(e.target.value as any)} className="w-full bg-input border border-border rounded-md px-2 py-2 text-xs">
            <option value="liquid">Liquid</option>
            <option value="solid">Solid blend</option>
          </select>
        </div>
        <NumInput label="Max Solids" value={maxSolids} onChange={setMaxSolids} unit="%" />
      </div>

      <div className="border border-border rounded-md overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead className="bg-secondary/50">
            <tr>
              <th className="p-2 w-8"></th>
              <th className="text-left p-2">Raw Material</th>
              <th className="text-right p-2">N %</th>
              <th className="text-right p-2">P₂O₅ %</th>
              <th className="text-right p-2">K₂O %</th>
              <th className="text-right p-2">Cost /kg</th>
              <th className="text-right p-2">Density</th>
              <th className="text-right p-2">Max %</th>
              <th className="text-right p-2 bg-primary/10">Use (g)</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rms.map(r => {
              const used = result?.active.find(a => a.id === r.id)?.used || 0;
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2 text-center"><input type="checkbox" checked={r.enabled} onChange={e => update(r.id, 'enabled', e.target.checked)} /></td>
                  <td className="p-1"><input value={r.name} onChange={e => update(r.id, 'name', e.target.value)} className="w-32 bg-input border border-border rounded px-1.5 py-1 text-xs" /></td>
                  <td className="p-1"><input type="number" value={r.N} onChange={e => update(r.id, 'N', e.target.value)} className="w-16 bg-input border border-border rounded px-1.5 py-1 text-xs text-right font-mono" /></td>
                  <td className="p-1"><input type="number" value={r.P2O5} onChange={e => update(r.id, 'P2O5', e.target.value)} className="w-16 bg-input border border-border rounded px-1.5 py-1 text-xs text-right font-mono" /></td>
                  <td className="p-1"><input type="number" value={r.K2O} onChange={e => update(r.id, 'K2O', e.target.value)} className="w-16 bg-input border border-border rounded px-1.5 py-1 text-xs text-right font-mono" /></td>
                  <td className="p-1"><input type="number" value={r.cost} onChange={e => update(r.id, 'cost', e.target.value)} className="w-16 bg-input border border-border rounded px-1.5 py-1 text-xs text-right font-mono" /></td>
                  <td className="p-1"><input type="number" value={r.density} onChange={e => update(r.id, 'density', e.target.value)} className="w-16 bg-input border border-border rounded px-1.5 py-1 text-xs text-right font-mono" /></td>
                  <td className="p-1"><input type="number" value={r.maxPct} onChange={e => update(r.id, 'maxPct', e.target.value)} className="w-16 bg-input border border-border rounded px-1.5 py-1 text-xs text-right font-mono" /></td>
                  <td className="p-2 text-right font-mono font-semibold text-primary bg-primary/5">{used.toFixed(2)}</td>
                  <td className="p-2"><button onClick={() => remove(r.id)} className="text-destructive hover:bg-destructive/10 rounded p-1"><Trash2 className="w-3 h-3" /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={add} className="w-full py-2 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs">
        <Plus className="w-3 h-3" /> Add Raw Material
      </button>

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            <ResultBox label="Final N" value={result.final.N.toFixed(2)} unit="%" accent />
            <ResultBox label="Final P₂O₅" value={result.final.P2O5.toFixed(2)} unit="%" accent />
            <ResultBox label="Final K₂O" value={result.final.K2O.toFixed(2)} unit="%" accent />
            <ResultBox label="Density" value={result.density.toFixed(3)} unit="g/mL" />
            <ResultBox label="Solids" value={result.solidsPct.toFixed(1)} unit="%" />
            <ResultBox label="Total Cost" value={result.cost.toFixed(2)} unit="/batch" accent />
          </div>

          <div className="bg-secondary/30 border border-border rounded-md p-3">
            <div className="text-xs font-semibold mb-2 text-foreground">Step-by-step Preparation</div>
            <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
              {result.waterAdd > 0 && <li>Charge mixing vessel with <span className="font-mono text-foreground">{result.waterAdd.toFixed(2)} g</span> water (about ½ of total).</li>}
              {result.active.filter(a => a.used > 0 && !a.name.toLowerCase().includes('water')).map(a => (
                <li key={a.id}>Add <span className="font-mono text-foreground">{a.used.toFixed(2)} g</span> of <span className="text-foreground">{a.name}</span> with stirring; ensure complete dissolution before next addition.</li>
              ))}
              <li>Adjust to final mass <span className="font-mono text-foreground">{result.finalMass.toFixed(2)} g</span>; verify pH and density.</li>
            </ol>
          </div>

          {result.warnings.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 space-y-1">
              <div className="text-xs font-semibold text-destructive">⚠ Warnings</div>
              {result.warnings.map((w, i) => <div key={i} className="text-xs text-destructive">{w}</div>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============ Ratio & Batch Preparation ============ */
type RatioRow = { name: string; ratio: string; maxOn: boolean; max: string };
function RatioProportion() {
  const [rows, setRows] = useState<RatioRow[]>([
    { name: 'Component A', ratio: '90', maxOn: false, max: '' },
    { name: 'Component B', ratio: '7', maxOn: false, max: '' },
    { name: 'Component C', ratio: '3', maxOn: false, max: '' },
  ]);
  const [batch, setBatch] = useState('5');
  const [unit, setUnit] = useState('g');

  const sumRatio = rows.reduce((s, r) => s + num(r.ratio), 0);
  const userTotal = num(batch);

  // Derive effective batch from max-constrained rows: each constraint => total <= max_i * sumRatio / ratio_i
  const constraintTotals = rows
    .filter(r => r.maxOn && num(r.ratio) > 0 && num(r.max) > 0)
    .map(r => (num(r.max) * sumRatio) / num(r.ratio));
  const hasConstraint = constraintTotals.length > 0;
  const maxAllowed = hasConstraint ? Math.min(...constraintTotals) : Infinity;
  // If user hasn't set a batch (0) and we have constraints, use max allowed. Otherwise clamp user batch to max allowed.
  const total = hasConstraint
    ? (userTotal > 0 ? Math.min(userTotal, maxAllowed) : maxAllowed)
    : userTotal;
  const clamped = hasConstraint && userTotal > 0 && userTotal > maxAllowed;

  const update = (i: number, patch: Partial<RatioRow>) => {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };
  const add = () => setRows(rs => [...rs, { name: `Component ${String.fromCharCode(65 + rs.length)}`, ratio: '1', maxOn: false, max: '' }]);
  const remove = (i: number) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs);
  const useMaxAsBatch = () => { if (hasConstraint && isFinite(maxAllowed)) setBatch(maxAllowed.toFixed(4)); };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground mb-1">Ratio & Batch Preparation</h3>
        <p className="text-xs text-muted-foreground">Enter ratio parts per component. Toggle <b>Max</b> on a component and enter its maximum allowed amount — the batch auto-scales so that component never exceeds its limit while keeping the ratio.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <NumInput label="Total Batch Size" value={batch} onChange={setBatch} unit={unit} />
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Unit</label>
          <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none">
            {['g', 'kg', 'mg', 'mL', 'L', 'µL', 'tonne', 'lb', 'oz', 'pcs'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <ResultBox label="Ratio Sum" value={sumRatio.toFixed(4)} accent />
        <ResultBox label="Effective Batch" value={total.toFixed(4)} unit={unit} accent />
      </div>

      {hasConstraint && (
        <div className={`text-xs px-3 py-2 rounded border ${clamped ? 'border-warning/50 bg-warning/10 text-warning' : 'border-primary/30 bg-primary/5 text-muted-foreground'}`}>
          {clamped
            ? <>Requested batch exceeds the max constraint. Clamped to <b>{maxAllowed.toFixed(4)} {unit}</b>.</>
            : <>Max allowed batch by constraints: <b>{maxAllowed.toFixed(4)} {unit}</b>.</>}
          {' '}<button onClick={useMaxAsBatch} className="underline hover:text-primary ml-1">Use max as batch</button>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r, i) => {
          const part = sumRatio > 0 ? (num(r.ratio) / sumRatio) * total : 0;
          const pct = sumRatio > 0 ? (num(r.ratio) / sumRatio) * 100 : 0;
          const overMax = r.maxOn && num(r.max) > 0 && part > num(r.max) + 1e-9;
          return (
            <div key={i} className={`grid grid-cols-12 gap-2 items-end p-2 rounded border bg-secondary/20 ${r.maxOn ? 'border-primary/40' : 'border-border'}`}>
              <div className="col-span-12 sm:col-span-3">
                <TextInput label={`Component ${i + 1}`} value={r.name} onChange={v => update(i, { name: v })} />
              </div>
              <div className="col-span-3 sm:col-span-1">
                <NumInput label="Ratio" value={r.ratio} onChange={v => update(i, { ratio: v })} />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <input type="checkbox" checked={r.maxOn} onChange={e => update(i, { maxOn: e.target.checked })} className="accent-primary" />
                    Max {unit}
                  </label>
                  <input
                    type="number"
                    value={r.max}
                    onChange={e => update(i, { max: e.target.value })}
                    disabled={!r.maxOn}
                    placeholder="e.g. 1000"
                    className="w-full bg-input border border-border rounded-md px-2 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-40"
                  />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <ResultBox label="%" value={pct.toFixed(3)} unit="%" />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <ResultBox label="Amount" value={part.toFixed(4)} unit={unit} accent />
                {overMax && <div className="text-[10px] text-warning mt-1">exceeds max</div>}
              </div>
              <div className="col-span-1">
                <button onClick={() => remove(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
        <button onClick={add} className="w-full py-2 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs">
          <Plus className="w-3 h-3" /> Add Component
        </button>
      </div>
    </div>
  );
}

/* ============ Serial Dilution ============ */
function SerialDilution() {
  const [c0, setC0] = useState('1');
  const [unit, setUnit] = useState('M');
  const [factor, setFactor] = useState('10');
  const [steps, setSteps] = useState('6');
  const [vTransfer, setVTransfer] = useState('1');
  const [vDiluent, setVDiluent] = useState('9');
  const [vUnit, setVUnit] = useState('mL');

  const f = num(factor);
  const n = Math.max(1, Math.min(50, Math.floor(num(steps))));
  const tubes = Array.from({ length: n }, (_, i) => ({
    tube: i + 1,
    conc: num(c0) / Math.pow(f, i + 1),
  }));

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Serial Dilution Scheme</h3>
      <p className="text-xs text-muted-foreground">Each step transfers a fixed volume into a new tube containing diluent. Final concentration = C₀ / (factor)<sup>n</sup>.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumInput label="Stock Conc. C₀" value={c0} onChange={setC0} unit={unit} />
        <NumInput label="Dilution Factor" value={factor} onChange={setFactor} unit="×" />
        <NumInput label="Number of Steps" value={steps} onChange={setSteps} />
        <NumInput label="Transfer Vol" value={vTransfer} onChange={setVTransfer} unit={vUnit} />
        <NumInput label="Diluent Vol" value={vDiluent} onChange={setVDiluent} unit={vUnit} />
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Conc. Unit</label>
          <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm">
            {['M', 'mM', 'µM', 'nM', 'g/L', 'mg/mL', 'mg/L', 'ppm', 'ppb', '%'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Vol. Unit</label>
          <select value={vUnit} onChange={e => setVUnit(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm">
            {['µL', 'mL', 'L'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-secondary/50">
            <tr><th className="px-2 py-1 text-left">Tube</th><th className="px-2 py-1 text-left">Transfer</th><th className="px-2 py-1 text-left">Diluent</th><th className="px-2 py-1 text-left">Conc.</th><th className="px-2 py-1 text-left">Dilution</th></tr>
          </thead>
          <tbody>
            {tubes.map(t => (
              <tr key={t.tube} className="border-b border-border">
                <td className="px-2 py-1 font-mono">#{t.tube}</td>
                <td className="px-2 py-1 font-mono">{vTransfer} {vUnit} from {t.tube === 1 ? 'stock' : `tube ${t.tube - 1}`}</td>
                <td className="px-2 py-1 font-mono">{vDiluent} {vUnit}</td>
                <td className="px-2 py-1 font-mono text-primary">{t.conc.toPrecision(4)} {unit}</td>
                <td className="px-2 py-1 font-mono">1 : {Math.pow(f, t.tube).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ Percent Solution (w/w, w/v, v/v) ============ */
function PercentSolution() {
  const [mode, setMode] = useState<'w/v' | 'w/w' | 'v/v'>('w/v');
  const [pct, setPct] = useState('10');
  const [finalAmt, setFinalAmt] = useState('100');
  const [density, setDensity] = useState('1.0');

  const p = num(pct) / 100;
  const total = num(finalAmt);
  const d = num(density) || 1;

  let solute = 0, solvent = 0, sUnit = 'g', vUnit = 'mL';
  if (mode === 'w/v') { solute = p * total; solvent = total - solute / d; sUnit = 'g'; vUnit = 'mL'; }
  else if (mode === 'w/w') { solute = p * total; solvent = total - solute; sUnit = 'g'; vUnit = 'g'; }
  else { solute = p * total; solvent = total - solute; sUnit = 'mL'; vUnit = 'mL'; }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Percent Solution Maker</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mode</label>
          <select value={mode} onChange={e => setMode(e.target.value as any)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm">
            <option value="w/v">% w/v (g per 100 mL)</option>
            <option value="w/w">% w/w (g per 100 g)</option>
            <option value="v/v">% v/v (mL per 100 mL)</option>
          </select>
        </div>
        <NumInput label="Target %" value={pct} onChange={setPct} unit="%" />
        <NumInput label="Final Amount" value={finalAmt} onChange={setFinalAmt} unit={mode === 'w/w' ? 'g' : 'mL'} />
        {mode === 'w/v' && <NumInput label="Solute Density" value={density} onChange={setDensity} unit="g/mL" />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ResultBox label="Solute Needed" value={solute.toFixed(4)} unit={sUnit} accent />
        <ResultBox label={mode === 'w/v' ? 'Solvent (approx)' : 'Solvent'} value={solvent.toFixed(4)} unit={vUnit} />
      </div>
      <p className="text-[11px] text-muted-foreground">w/v assumes final volume = total. For exact w/v, dissolve solute then top up to mark. w/w uses mass-mass. v/v uses volume-volume (assumes additive volumes).</p>
    </div>
  );
}

/* ============ PPM / PPB / mg-L Converter ============ */
function PpmConverter() {
  const [value, setValue] = useState('1000');
  const [from, setFrom] = useState('ppm');
  const [solnDensity, setSolnDensity] = useState('1.0');
  const UNITS = ['ppm', 'ppb', 'mg/L', 'µg/mL', 'mg/kg', 'µg/g', 'g/L', '%', 'g/100g'];

  const v = num(value);
  const d = num(solnDensity) || 1;
  // base in mg/kg (≈ ppm by mass)
  const toMgPerKg = (val: number, u: string): number => {
    switch (u) {
      case 'ppm': case 'mg/kg': case 'µg/g': return val;
      case 'ppb': return val / 1000;
      case 'mg/L': case 'µg/mL': return val / d;
      case 'g/L': return (val * 1000) / d;
      case '%': case 'g/100g': return val * 10000;
      default: return val;
    }
  };
  const fromMgPerKg = (mgkg: number, u: string): number => {
    switch (u) {
      case 'ppm': case 'mg/kg': case 'µg/g': return mgkg;
      case 'ppb': return mgkg * 1000;
      case 'mg/L': case 'µg/mL': return mgkg * d;
      case 'g/L': return (mgkg * d) / 1000;
      case '%': case 'g/100g': return mgkg / 10000;
      default: return mgkg;
    }
  };
  const base = toMgPerKg(v, from);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Concentration Unit Converter</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NumInput label="Value" value={value} onChange={setValue} />
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">From Unit</label>
          <select value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm">
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <NumInput label="Solution Density" value={solnDensity} onChange={setSolnDensity} unit="g/mL" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {UNITS.map(u => (
          <ResultBox key={u} label={u} value={fromMgPerKg(base, u).toPrecision(5)} accent={u === from} />
        ))}
      </div>
    </div>
  );
}

/* ============ Reagent Scale-Up ============ */
function ReagentScaleUp() {
  const [rows, setRows] = useState<{ name: string; amount: string; unit: string }[]>([
    { name: 'NaOH', amount: '4.0', unit: 'g' },
    { name: 'Water', amount: '100', unit: 'mL' },
  ]);
  const [refIdx, setRefIdx] = useState(0);
  const [targetAmt, setTargetAmt] = useState('250');

  const factor = num(rows[refIdx]?.amount) > 0 ? num(targetAmt) / num(rows[refIdx].amount) : 0;

  const update = (i: number, k: 'name' | 'amount' | 'unit', v: string) => {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Recipe / Reagent Scale-Up</h3>
      <p className="text-xs text-muted-foreground">Enter the original recipe, choose a reference ingredient, and specify its new amount. Every other ingredient is scaled by the same factor.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Reference Ingredient</label>
          <select value={refIdx} onChange={e => setRefIdx(parseInt(e.target.value))} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm">
            {rows.map((r, i) => <option key={i} value={i}>{r.name || `#${i + 1}`}</option>)}
          </select>
        </div>
        <NumInput label="New Amount of Reference" value={targetAmt} onChange={setTargetAmt} unit={rows[refIdx]?.unit || ''} />
      </div>
      <ResultBox label="Scale Factor" value={factor.toFixed(4)} unit="×" accent />
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end p-2 rounded border border-border bg-secondary/20">
            <div className="col-span-12 sm:col-span-4"><TextInput label="Ingredient" value={r.name} onChange={v => update(i, 'name', v)} /></div>
            <div className="col-span-4 sm:col-span-2"><NumInput label="Original" value={r.amount} onChange={v => update(i, 'amount', v)} /></div>
            <div className="col-span-3 sm:col-span-2">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Unit</label>
              <select value={r.unit} onChange={e => update(i, 'unit', e.target.value)} className="w-full bg-input border border-border rounded-md px-2 py-2 text-xs">
                {['g', 'kg', 'mg', 'mL', 'L', 'µL', 'mol', 'mmol'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-4 sm:col-span-3"><ResultBox label="Scaled" value={(num(r.amount) * factor).toFixed(4)} unit={r.unit} accent /></div>
            <div className="col-span-1"><button onClick={() => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)} className="p-2 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button></div>
          </div>
        ))}
        <button onClick={() => setRows(rs => [...rs, { name: '', amount: '0', unit: 'g' }])} className="w-full py-2 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs">
          <Plus className="w-3 h-3" /> Add Ingredient
        </button>
      </div>
    </div>
  );
}

/* ============ Molarity ⇄ Mass quick tool ============ */
function MolarityMass() {
  const [formula, setFormula] = useState('NaCl');
  const [mass, setMass] = useState('5.844');
  const [vol, setVol] = useState('100');
  const [molarity, setMolarity] = useState('');
  const [solveFor, setSolveFor] = useState<'mass' | 'molarity' | 'volume'>('molarity');

  const mw = calcMolarMass(formula)?.total || 0;
  const m = num(mass);
  const v = num(vol) / 1000; // L
  const M = num(molarity);

  let out: { mass?: number; molarity?: number; vol?: number; mol?: number } = {};
  if (mw > 0) {
    if (solveFor === 'molarity') {
      const mol = m / mw;
      out = { mol, molarity: v > 0 ? mol / v : 0 };
    } else if (solveFor === 'mass') {
      const mol = M * v;
      out = { mol, mass: mol * mw };
    } else {
      const mol = m / mw;
      out = { mol, vol: M > 0 ? (mol / M) * 1000 : 0 };
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Molarity ⇄ Mass ⇄ Volume</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TextInput label="Formula" value={formula} onChange={setFormula} placeholder="NaCl" />
        <ResultBox label="MW" value={mw.toFixed(4)} unit="g/mol" />
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Solve For</label>
          <select value={solveFor} onChange={e => setSolveFor(e.target.value as any)} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm">
            <option value="molarity">Molarity</option>
            <option value="mass">Mass needed</option>
            <option value="volume">Volume</option>
          </select>
        </div>
        {(solveFor !== 'mass') && <NumInput label="Mass" value={mass} onChange={setMass} unit="g" />}
        {(solveFor !== 'volume') && <NumInput label="Volume" value={vol} onChange={setVol} unit="mL" />}
        {(solveFor !== 'molarity') && <NumInput label="Molarity" value={molarity} onChange={setMolarity} unit="M" />}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {out.molarity !== undefined && <ResultBox label="Molarity" value={out.molarity.toPrecision(5)} unit="M" accent />}
        {out.mass !== undefined && <ResultBox label="Mass" value={out.mass.toFixed(4)} unit="g" accent />}
        {out.vol !== undefined && <ResultBox label="Volume" value={out.vol.toFixed(2)} unit="mL" accent />}
        {out.mol !== undefined && <ResultBox label="Moles" value={out.mol.toPrecision(5)} unit="mol" />}
      </div>
    </div>
  );
}
