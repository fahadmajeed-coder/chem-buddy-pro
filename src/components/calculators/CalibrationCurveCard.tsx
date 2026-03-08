import { useState, useMemo } from 'react';
import { Plus, Trash2, Lock, Unlock, Copy, RotateCcw, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { exportCalibrationPDF, exportCalibrationCSV } from '@/lib/calibrationExport';

export interface StandardPoint {
  id: string;
  concentration: string;
  absorbance: string;
}

export interface SampleRow {
  id: string;
  name: string;
  absorbance: string;
}

export interface CalibrationCurveData {
  id: string;
  title: string;
  standards: StandardPoint[];
  samples: SampleRow[];
  dilutionFactor: string;
  sampleWeight: string;
  finalVolume: string;
  formula: string;
  locked: boolean;
  createdAt: number;
}

export const DEFAULT_TEMPLATE: Omit<CalibrationCurveData, 'id' | 'createdAt'> = {
  title: 'Calibration Curve',
  standards: [
    { id: '1', concentration: '0.02', absorbance: '0.00114' },
    { id: '2', concentration: '0.04', absorbance: '0.002279' },
    { id: '3', concentration: '0.06', absorbance: '0.003419' },
    { id: '4', concentration: '0.081', absorbance: '0.004558' },
    { id: '5', concentration: '0.101', absorbance: '0.005698' },
  ],
  samples: [
    { id: '1', name: 'Sample 1', absorbance: '0.056' },
    { id: '2', name: 'Sample 2', absorbance: '0.055' },
    { id: '3', name: 'Sample 3', absorbance: '0.055' },
    { id: '4', name: 'Sample 4', absorbance: '0.052' },
  ],
  dilutionFactor: '1',
  sampleWeight: '0.5',
  finalVolume: '1',
  formula: '(Abs * m + b) / W * 100',
  locked: false,
};

const FORMULA_VARIABLES = [
  { key: 'Abs', label: 'Absorbance (sample)' },
  { key: 'C', label: 'Concentration from curve' },
  { key: 'DF', label: 'Dilution Factor' },
  { key: 'Vol', label: 'Final Volume (mL)' },
  { key: 'W', label: 'Sample Weight (g)' },
  { key: 'm', label: 'Slope' },
  { key: 'b', label: 'Intercept' },
];

function evaluateFormula(formula: string, vars: Record<string, number>): number | null {
  try {
    // Replace variable names with values, longest first to avoid partial matches
    let expr = formula;
    const sorted = Object.keys(vars).sort((a, b) => b.length - a.length);
    for (const key of sorted) {
      expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), `(${vars[key]})`);
    }
    // Only allow safe characters: digits, operators, parentheses, dots, spaces
    if (!/^[\d+\-*/().e\s]+$/.test(expr)) return null;
    const result = new Function(`"use strict"; return (${expr})`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

interface Props {
  data: CalibrationCurveData;
  onUpdate: (data: CalibrationCurveData) => void;
  onDuplicate: (data: CalibrationCurveData) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

export function CalibrationCurveCard({ data, onUpdate, onDuplicate, onDelete, canDelete }: Props) {
  const { standards, samples, dilutionFactor, sampleWeight, finalVolume, formula = '(Abs * m + b) / W * 100', locked, title } = data;
  const [editingTitle, setEditingTitle] = useState(false);

  const regression = useMemo(() => {
    const pts = standards
      .map(s => ({ x: parseFloat(s.concentration), y: parseFloat(s.absorbance) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y));
    return linearRegression(pts);
  }, [standards]);

  const sampleResults = useMemo(() => {
    if (!regression) return [];
    const df = parseFloat(dilutionFactor) || 1;
    const sw = parseFloat(sampleWeight) || 1;
    const vol = parseFloat(finalVolume) || 1;
    return samples.map(s => {
      const abs = parseFloat(s.absorbance);
      if (isNaN(abs)) return { ...s, concentration: null, corrected: null, finalConc: null };
      const conc = (abs - regression.intercept) / regression.slope;
      const corrected = conc * df;
      const finalConc = evaluateFormula(formula, { Abs: abs, C: conc, DF: df, Vol: vol, W: sw, m: regression.slope, b: regression.intercept });
      return { ...s, concentration: conc, corrected, finalConc };
    });
  }, [samples, regression, dilutionFactor, sampleWeight, finalVolume, formula]);

  const chartData = useMemo(() => {
    const pts = standards
      .map(s => ({ x: parseFloat(s.concentration), y: parseFloat(s.absorbance) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y))
      .sort((a, b) => a.x - b.x);
    if (pts.length === 0) return null;
    const xMin = 0, xMax = Math.max(...pts.map(p => p.x)) * 1.15;
    const yMin = 0, yMax = Math.max(...pts.map(p => p.y)) * 1.15;
    const w = 400, h = 220, pad = 45;
    const toSvgX = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (w - pad * 2);
    const toSvgY = (y: number) => h - pad - ((y - yMin) / (yMax - yMin)) * (h - pad * 2);
    const svgPoints = pts.map(p => ({ sx: toSvgX(p.x), sy: toSvgY(p.y), ...p }));
    let lineStart = null, lineEnd = null;
    if (regression) {
      lineStart = { sx: toSvgX(xMin), sy: toSvgY(regression.slope * xMin + regression.intercept) };
      lineEnd = { sx: toSvgX(xMax), sy: toSvgY(regression.slope * xMax + regression.intercept) };
    }
    const xTicks = Array.from({ length: 5 }, (_, i) => xMin + (i / 4) * (xMax - xMin));
    const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (i / 4) * (yMax - yMin));
    return { svgPoints, lineStart, lineEnd, w, h, pad, xTicks, yTicks, toSvgX, toSvgY };
  }, [standards, regression]);

  const update = (partial: Partial<CalibrationCurveData>) => {
    if (locked) return;
    onUpdate({ ...data, ...partial });
  };

  const updateStandard = (id: string, field: 'concentration' | 'absorbance', value: string) => {
    update({ standards: standards.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };

  const updateSample = (id: string, field: 'name' | 'absorbance', value: string) => {
    update({ samples: samples.map(s => s.id === id ? { ...s, [field]: value } : s) });
  };

  const handleReset = () => {
    if (locked) return;
    update({
      standards: [{ id: '1', concentration: '', absorbance: '' }, { id: '2', concentration: '', absorbance: '' }],
      samples: [{ id: '1', name: 'Sample 1', absorbance: '' }],
      dilutionFactor: '1',
      sampleWeight: '0.5',
      finalVolume: '1',
      formula: '(Abs * m + b) / W * 100',
    });
  };

  return (
    <div className={`glass-panel rounded-lg animate-fade-in ${locked ? 'glow-border' : ''}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex-1 min-w-0">
          {editingTitle && !locked ? (
            <input
              autoFocus
              value={title}
              onChange={e => update({ title: e.target.value })}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              className="bg-input border border-border rounded px-2 py-0.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-xs"
            />
          ) : (
            <h3
              className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors truncate"
              onClick={() => !locked && setEditingTitle(true)}
              title="Click to rename"
            >
              {title}
            </h3>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {locked ? '🔒 Locked template' : 'Editable — lock to save as template'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => exportCalibrationPDF(data)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Export as PDF">
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => exportCalibrationCSV(data)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Export as CSV (Excel)">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button onClick={handleReset} disabled={locked} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30" title="Reset">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDuplicate(data)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Duplicate (create a working copy)">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onUpdate({ ...data, locked: !locked })}
            className={`p-1.5 rounded-md transition-colors ${locked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            title={locked ? 'Unlock' : 'Lock as template'}
          >
            {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          {canDelete && (
            <button onClick={() => onDelete(data.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Standards Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Standard Solutions</span>
            {!locked && (
              <button onClick={() => update({ standards: [...standards, { id: Date.now().toString(), concentration: '', absorbance: '' }] })} className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
          <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 mb-1.5 px-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">#</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Concentration</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Absorbance</span>
            <span />
          </div>
          {standards.map((std, i) => (
            <div key={std.id} className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center mb-1.5">
              <span className="text-xs text-muted-foreground font-mono text-center">{i + 1}</span>
              <input type="number" value={std.concentration} onChange={e => updateStandard(std.id, 'concentration', e.target.value)} disabled={locked} placeholder="0.00" className="bg-input border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50" />
              <input type="number" value={std.absorbance} onChange={e => updateStandard(std.id, 'absorbance', e.target.value)} disabled={locked} placeholder="0.000" className="bg-input border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50" />
              <button onClick={() => update({ standards: standards.filter(s => s.id !== std.id) })} disabled={locked || standards.length <= 2} className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Regression Results & Chart */}
        {regression && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
              <span className="text-xs font-semibold text-foreground">Regression Results</span>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Equation</span><span className="text-xs font-mono font-bold text-primary">y = {regression.slope.toFixed(6)}x {regression.intercept >= 0 ? '+' : ''} {regression.intercept.toFixed(6)}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Slope</span><span className="text-xs font-mono text-foreground">{regression.slope.toFixed(6)}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Intercept</span><span className="text-xs font-mono text-foreground">{regression.intercept.toFixed(6)}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">R²</span><span className={`text-xs font-mono font-bold ${regression.r2 >= 0.99 ? 'text-success' : regression.r2 >= 0.95 ? 'text-warning' : 'text-destructive'}`}>{regression.r2.toFixed(6)}</span></div>
              </div>
              {regression.r2 < 0.9 && (
                <div className="mt-2 flex items-start gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/30">
                  <span className="text-destructive text-sm mt-0.5">⚠</span>
                  <div>
                    <span className="text-[11px] font-semibold text-destructive">Poor Linearity (R² &lt; 0.9)</span>
                    <p className="text-[10px] text-destructive/80 mt-0.5">Standards need improvement. Check for outliers, preparation errors, or contamination. Re-prepare standards with fresh solutions and ensure proper dilution technique.</p>
                  </div>
                </div>
              )}
            </div>

            {chartData && (
              <div className="bg-secondary/30 rounded-lg p-4">
                <span className="text-xs font-semibold text-foreground mb-2 block">Calibration Plot</span>
                <svg viewBox={`0 0 ${chartData.w} ${chartData.h}`} className="w-full" style={{ maxHeight: 200 }}>
                  {chartData.yTicks.map((t, i) => <line key={`yg${i}`} x1={chartData.pad} x2={chartData.w - chartData.pad} y1={chartData.toSvgY(t)} y2={chartData.toSvgY(t)} className="stroke-border" strokeWidth="0.5" strokeDasharray="3,3" />)}
                  {chartData.xTicks.map((t, i) => <line key={`xg${i}`} x1={chartData.toSvgX(t)} x2={chartData.toSvgX(t)} y1={chartData.pad} y2={chartData.h - chartData.pad} className="stroke-border" strokeWidth="0.5" strokeDasharray="3,3" />)}
                  <line x1={chartData.pad} x2={chartData.w - chartData.pad} y1={chartData.h - chartData.pad} y2={chartData.h - chartData.pad} className="stroke-foreground" strokeWidth="1" />
                  <line x1={chartData.pad} x2={chartData.pad} y1={chartData.pad} y2={chartData.h - chartData.pad} className="stroke-foreground" strokeWidth="1" />
                  {chartData.xTicks.map((t, i) => <text key={`xt${i}`} x={chartData.toSvgX(t)} y={chartData.h - chartData.pad + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="8" fontFamily="monospace">{t.toFixed(3)}</text>)}
                  {chartData.yTicks.map((t, i) => <text key={`yt${i}`} x={chartData.pad - 5} y={chartData.toSvgY(t) + 3} textAnchor="end" className="fill-muted-foreground" fontSize="8" fontFamily="monospace">{t.toFixed(4)}</text>)}
                  {chartData.lineStart && chartData.lineEnd && <line x1={chartData.lineStart.sx} y1={chartData.lineStart.sy} x2={chartData.lineEnd.sx} y2={chartData.lineEnd.sy} className="stroke-primary" strokeWidth="1.5" opacity="0.7" />}
                  {chartData.svgPoints.map((p, i) => <circle key={i} cx={p.sx} cy={p.sy} r="4" className="fill-primary stroke-primary-foreground" strokeWidth="1.5" />)}
                  <text x={chartData.w / 2} y={chartData.h - 5} textAnchor="middle" className="fill-muted-foreground" fontSize="9">Concentration</text>
                  <text x={12} y={chartData.h / 2} textAnchor="middle" className="fill-muted-foreground" fontSize="9" transform={`rotate(-90,12,${chartData.h / 2})`}>Absorbance</text>
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Samples */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Unknown Samples</span>
            {!locked && (
              <button onClick={() => update({ samples: [...samples, { id: Date.now().toString(), name: `Sample ${samples.length + 1}`, absorbance: '' }] })} className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3 h-3" /> Add Sample
              </button>
            )}
          </div>

          {/* Sample Parameters */}
          <div className="grid grid-cols-3 gap-3 mb-3 p-3 bg-secondary/30 rounded-lg">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Sample Weight (g)</span>
              <input type="number" value={sampleWeight} onChange={e => update({ sampleWeight: e.target.value })} disabled={locked} placeholder="0.5" className="bg-input border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Dilution Factor</span>
              <input type="number" value={dilutionFactor} onChange={e => update({ dilutionFactor: e.target.value })} disabled={locked} className="bg-input border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Final Volume (mL)</span>
              <input type="number" value={finalVolume} onChange={e => update({ finalVolume: e.target.value })} disabled={locked} placeholder="1" className="bg-input border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50" />
            </div>
          </div>

          {/* Editable Formula */}
          <div className="mb-3 p-3 bg-secondary/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Result Formula</span>
              {!locked && (
                <button
                  onClick={() => update({ formula: '(Abs * m + b) / W * 100' })}
                  className="text-[10px] text-primary hover:text-primary/80 transition-colors"
                >
                  Reset to default
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">Final Conc =</span>
              <input
                type="text"
                value={formula}
                onChange={e => update({ formula: e.target.value })}
                disabled={locked}
                placeholder="(Abs * m + b) / W * 100"
                className="flex-1 bg-input border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {FORMULA_VARIABLES.map(v => (
                <span key={v.key} className="text-[10px] text-muted-foreground">
                  <span className="font-mono font-bold text-primary">{v.key}</span> = {v.label}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[2.5rem_minmax(80px,1.5fr)_minmax(80px,1fr)_minmax(80px,1fr)_2rem] bg-secondary/50">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-2 text-center border-r border-border">#</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-2 border-r border-border">Name</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-2 border-r border-border">Absorbance</span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-2 border-r border-border">Result</span>
              <span className="py-2" />
            </div>
            {/* Data rows */}
            {sampleResults.map((s, i) => (
              <div key={s.id} className="grid grid-cols-[2.5rem_minmax(80px,1.5fr)_minmax(80px,1fr)_minmax(80px,1fr)_2rem] items-center border-t border-border">
                <span className="text-xs text-muted-foreground font-mono text-center py-2 border-r border-border">{i + 1}</span>
                <div className="px-1 py-1 border-r border-border">
                  <input type="text" value={s.name} onChange={e => updateSample(s.id, 'name', e.target.value)} disabled={locked} className="w-full bg-input border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50" />
                </div>
                <div className="px-1 py-1 border-r border-border">
                  <input type="number" value={samples.find(x => x.id === s.id)?.absorbance || ''} onChange={e => updateSample(s.id, 'absorbance', e.target.value)} disabled={locked} placeholder="0.000" className="w-full bg-input border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50" />
                </div>
                <span className="text-xs font-mono font-bold text-primary px-2 py-2 border-r border-border">{s.finalConc !== null ? s.finalConc.toFixed(6) : '—'}</span>
                <div className="flex justify-center">
                  <button onClick={() => update({ samples: samples.filter(x => x.id !== s.id) })} disabled={locked || samples.length <= 1} className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
