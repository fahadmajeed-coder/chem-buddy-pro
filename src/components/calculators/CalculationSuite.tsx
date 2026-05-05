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
  | 'hydrate';

interface ToolDef {
  id: ToolId;
  name: string;
  icon: React.ReactNode;
  desc: string;
}

const TOOLS: ToolDef[] = [
  { id: 'fertilizer-solver', name: 'Fertilizer Solver', icon: <Target className="w-4 h-4" />, desc: 'NPK formulation solver: target N/P₂O₅/K₂O → optimal blend & cost' },
  { id: 'percent-composition', name: '% Composition', icon: <Percent className="w-4 h-4" />, desc: 'Element % in any compound (supports ·5H₂O hydrates)' },
  { id: 'mixture-designer', name: 'Mixture Designer', icon: <Layers className="w-4 h-4" />, desc: 'Solve mass fractions for target element % from multiple salts' },
  { id: 'hydrate', name: 'Hydrate / Anhydrous', icon: <Beaker className="w-4 h-4" />, desc: 'Convert between hydrated & anhydrous mass (e.g. CuSO₄·5H₂O ↔ CuSO₄)' },
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
  const [active, setActive] = useState<ToolId>('fertilizer-solver');

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

/* ============ TOOL 10: pH / Buffer ============ */
function PHBuffer() {
  const [mode, setMode] = useState<'ph' | 'buffer'>('ph');
  const [hConc, setHConc] = useState('0.001');
  const [pKa, setPKa] = useState('4.75');
  const [acid, setAcid] = useState('0.1');
  const [base, setBase] = useState('0.1');

  const phRes = useMemo(() => {
    const c = num(hConc);
    if (!c || c <= 0) return null;
    const pH = -Math.log10(c);
    const pOH = 14 - pH;
    const oh = Math.pow(10, -pOH);
    return { pH, pOH, oh };
  }, [hConc]);

  const bufRes = useMemo(() => {
    const a = num(acid), b = num(base), pk = num(pKa);
    if (!a || !b) return null;
    const pH = pk + Math.log10(b / a);
    return { pH, pOH: 14 - pH };
  }, [acid, base, pKa]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><FlaskConical className="w-4 h-4 text-primary" /> pH / Buffer</h3>
      <div className="flex gap-2">
        <button onClick={() => setMode('ph')} className={`px-3 py-1.5 rounded text-xs ${mode === 'ph' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>Strong acid/base pH</button>
        <button onClick={() => setMode('buffer')} className={`px-3 py-1.5 rounded text-xs ${mode === 'buffer' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>Buffer (H-H)</button>
      </div>
      {mode === 'ph' && (
        <>
          <NumInput label="[H⁺]" value={hConc} onChange={setHConc} unit="M" />
          {phRes && (
            <div className="grid grid-cols-3 gap-2">
              <ResultBox label="pH" value={phRes.pH.toFixed(3)} accent />
              <ResultBox label="pOH" value={phRes.pOH.toFixed(3)} />
              <ResultBox label="[OH⁻]" value={phRes.oh.toExponential(3)} unit="M" />
            </div>
          )}
        </>
      )}
      {mode === 'buffer' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <NumInput label="pKa" value={pKa} onChange={setPKa} />
            <NumInput label="[Acid]" value={acid} onChange={setAcid} unit="M" />
            <NumInput label="[Conjugate Base]" value={base} onChange={setBase} unit="M" />
          </div>
          {bufRes && (
            <div className="grid grid-cols-2 gap-2">
              <ResultBox label="Buffer pH" value={bufRes.pH.toFixed(3)} accent />
              <ResultBox label="Buffer pOH" value={bufRes.pOH.toFixed(3)} />
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">pH = pKa + log([A⁻]/[HA])</p>
        </>
      )}
    </div>
  );
}
