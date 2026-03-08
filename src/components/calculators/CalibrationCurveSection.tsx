import { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, Download, RotateCcw } from 'lucide-react';
import { InputField } from './InputField';

interface StandardPoint {
  id: string;
  concentration: string;
  absorbance: string;
}

interface SampleRow {
  id: string;
  name: string;
  absorbance: string;
}

function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = points.reduce((s, p) => s + p.y * p.y, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R²
  const meanY = sumY / n;
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

export function CalibrationCurveSection() {
  const [standards, setStandards] = useState<StandardPoint[]>([
    { id: '1', concentration: '0.02', absorbance: '0.00114' },
    { id: '2', concentration: '0.04', absorbance: '0.002279' },
    { id: '3', concentration: '0.06', absorbance: '0.003419' },
    { id: '4', concentration: '0.081', absorbance: '0.004558' },
    { id: '5', concentration: '0.101', absorbance: '0.005698' },
  ]);

  const [samples, setSamples] = useState<SampleRow[]>([
    { id: '1', name: 'Sample 1', absorbance: '0.056' },
    { id: '2', name: 'Sample 2', absorbance: '0.055' },
    { id: '3', name: 'Sample 3', absorbance: '0.055' },
    { id: '4', name: 'Sample 4', absorbance: '0.052' },
  ]);

  const [dilutionFactor, setDilutionFactor] = useState('1');

  const regression = useMemo(() => {
    const pts = standards
      .map(s => ({ x: parseFloat(s.concentration), y: parseFloat(s.absorbance) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y));
    return linearRegression(pts);
  }, [standards]);

  const sampleResults = useMemo(() => {
    if (!regression) return [];
    const df = parseFloat(dilutionFactor) || 1;
    return samples.map(s => {
      const abs = parseFloat(s.absorbance);
      if (isNaN(abs)) return { ...s, concentration: null, corrected: null };
      const conc = (abs - regression.intercept) / regression.slope;
      return { ...s, concentration: conc, corrected: conc * df };
    });
  }, [samples, regression, dilutionFactor]);

  const addStandard = () => {
    setStandards(prev => [...prev, { id: Date.now().toString(), concentration: '', absorbance: '' }]);
  };

  const removeStandard = (id: string) => {
    setStandards(prev => prev.filter(s => s.id !== id));
  };

  const updateStandard = (id: string, field: 'concentration' | 'absorbance', value: string) => {
    setStandards(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSample = () => {
    setSamples(prev => [...prev, { id: Date.now().toString(), name: `Sample ${prev.length + 1}`, absorbance: '' }]);
  };

  const removeSample = (id: string) => {
    setSamples(prev => prev.filter(s => s.id !== id));
  };

  const updateSample = (id: string, field: 'name' | 'absorbance', value: string) => {
    setSamples(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleReset = () => {
    setStandards([{ id: '1', concentration: '', absorbance: '' }, { id: '2', concentration: '', absorbance: '' }]);
    setSamples([{ id: '1', name: 'Sample 1', absorbance: '' }]);
    setDilutionFactor('1');
  };

  // Simple SVG chart
  const chartData = useMemo(() => {
    const pts = standards
      .map(s => ({ x: parseFloat(s.concentration), y: parseFloat(s.absorbance) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y))
      .sort((a, b) => a.x - b.x);
    if (pts.length === 0) return null;

    const xMin = 0;
    const xMax = Math.max(...pts.map(p => p.x)) * 1.15;
    const yMin = 0;
    const yMax = Math.max(...pts.map(p => p.y)) * 1.15;

    const w = 400, h = 220, pad = 45;
    const toSvgX = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (w - pad * 2);
    const toSvgY = (y: number) => h - pad - ((y - yMin) / (yMax - yMin)) * (h - pad * 2);

    const svgPoints = pts.map(p => ({ sx: toSvgX(p.x), sy: toSvgY(p.y), ...p }));

    let lineStart = null, lineEnd = null;
    if (regression) {
      lineStart = { sx: toSvgX(xMin), sy: toSvgY(regression.slope * xMin + regression.intercept) };
      lineEnd = { sx: toSvgX(xMax), sy: toSvgY(regression.slope * xMax + regression.intercept) };
    }

    // Axis ticks
    const xTicks = Array.from({ length: 5 }, (_, i) => xMin + (i / 4) * (xMax - xMin));
    const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (i / 4) * (yMax - yMin));

    return { svgPoints, lineStart, lineEnd, w, h, pad, xTicks, yTicks, toSvgX, toSvgY };
  }, [standards, regression]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Calibration Curve Calculator
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Build a calibration curve from standards and determine unknown sample concentrations
          </p>
        </div>
        <button onClick={handleReset} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Reset All">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Standards Table */}
      <div className="glass-panel rounded-lg">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Standard Solutions</h3>
          <button onClick={addStandard} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Standard
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 mb-2 px-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">#</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Concentration</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Absorbance</span>
            <span />
          </div>
          {standards.map((std, i) => (
            <div key={std.id} className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center mb-1.5">
              <span className="text-xs text-muted-foreground font-mono text-center">{i + 1}</span>
              <input
                type="number"
                value={std.concentration}
                onChange={(e) => updateStandard(std.id, 'concentration', e.target.value)}
                placeholder="0.00"
                className="bg-input border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="number"
                value={std.absorbance}
                onChange={(e) => updateStandard(std.id, 'absorbance', e.target.value)}
                placeholder="0.000"
                className="bg-input border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={() => removeStandard(std.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" disabled={standards.length <= 2}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Regression Results & Chart */}
      {regression && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Regression Stats */}
          <div className="glass-panel rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Regression Results</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Equation</span>
                <span className="text-sm font-mono font-bold text-primary">
                  y = {regression.slope.toFixed(6)}x {regression.intercept >= 0 ? '+' : ''} {regression.intercept.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Slope</span>
                <span className="text-sm font-mono text-foreground">{regression.slope.toFixed(6)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Intercept</span>
                <span className="text-sm font-mono text-foreground">{regression.intercept.toFixed(6)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">R²</span>
                <span className={`text-sm font-mono font-bold ${regression.r2 >= 0.99 ? 'text-success' : regression.r2 >= 0.95 ? 'text-warning' : 'text-destructive'}`}>
                  {regression.r2.toFixed(6)}
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData && (
            <div className="glass-panel rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Calibration Plot</h3>
              <svg viewBox={`0 0 ${chartData.w} ${chartData.h}`} className="w-full" style={{ maxHeight: 220 }}>
                {/* Grid lines */}
                {chartData.yTicks.map((t, i) => (
                  <line key={`yg${i}`} x1={chartData.pad} x2={chartData.w - chartData.pad} y1={chartData.toSvgY(t)} y2={chartData.toSvgY(t)} className="stroke-border" strokeWidth="0.5" strokeDasharray="3,3" />
                ))}
                {chartData.xTicks.map((t, i) => (
                  <line key={`xg${i}`} x1={chartData.toSvgX(t)} x2={chartData.toSvgX(t)} y1={chartData.pad} y2={chartData.h - chartData.pad} className="stroke-border" strokeWidth="0.5" strokeDasharray="3,3" />
                ))}

                {/* Axes */}
                <line x1={chartData.pad} x2={chartData.w - chartData.pad} y1={chartData.h - chartData.pad} y2={chartData.h - chartData.pad} className="stroke-foreground" strokeWidth="1" />
                <line x1={chartData.pad} x2={chartData.pad} y1={chartData.pad} y2={chartData.h - chartData.pad} className="stroke-foreground" strokeWidth="1" />

                {/* Axis labels */}
                {chartData.xTicks.map((t, i) => (
                  <text key={`xt${i}`} x={chartData.toSvgX(t)} y={chartData.h - chartData.pad + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="8" fontFamily="monospace">{t.toFixed(3)}</text>
                ))}
                {chartData.yTicks.map((t, i) => (
                  <text key={`yt${i}`} x={chartData.pad - 5} y={chartData.toSvgY(t) + 3} textAnchor="end" className="fill-muted-foreground" fontSize="8" fontFamily="monospace">{t.toFixed(4)}</text>
                ))}

                {/* Best fit line */}
                {chartData.lineStart && chartData.lineEnd && (
                  <line x1={chartData.lineStart.sx} y1={chartData.lineStart.sy} x2={chartData.lineEnd.sx} y2={chartData.lineEnd.sy} className="stroke-primary" strokeWidth="1.5" opacity="0.7" />
                )}

                {/* Data points */}
                {chartData.svgPoints.map((p, i) => (
                  <circle key={i} cx={p.sx} cy={p.sy} r="4" className="fill-primary stroke-primary-foreground" strokeWidth="1.5" />
                ))}

                {/* Axis titles */}
                <text x={chartData.w / 2} y={chartData.h - 5} textAnchor="middle" className="fill-muted-foreground" fontSize="9">Concentration</text>
                <text x={12} y={chartData.h / 2} textAnchor="middle" className="fill-muted-foreground" fontSize="9" transform={`rotate(-90,12,${chartData.h / 2})`}>Absorbance</text>
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Samples */}
      <div className="glass-panel rounded-lg">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Unknown Samples</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Dilution Factor</span>
              <input
                type="number"
                value={dilutionFactor}
                onChange={(e) => setDilutionFactor(e.target.value)}
                className="w-16 bg-input border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button onClick={addSample} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Sample
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_2rem] gap-2 mb-2 px-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">#</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Name</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Absorbance</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Concentration</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Corrected (×DF)</span>
            <span />
          </div>
          {sampleResults.map((s, i) => (
            <div key={s.id} className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_2rem] gap-2 items-center mb-1.5">
              <span className="text-xs text-muted-foreground font-mono text-center">{i + 1}</span>
              <input
                type="text"
                value={s.name}
                onChange={(e) => updateSample(s.id, 'name', e.target.value)}
                className="bg-input border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="number"
                value={samples.find(x => x.id === s.id)?.absorbance || ''}
                onChange={(e) => updateSample(s.id, 'absorbance', e.target.value)}
                placeholder="0.000"
                className="bg-input border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs font-mono font-bold text-primary px-2">
                {s.concentration !== null ? s.concentration.toFixed(6) : '—'}
              </span>
              <span className="text-xs font-mono font-bold text-accent-foreground px-2">
                {s.corrected !== null ? s.corrected.toFixed(6) : '—'}
              </span>
              <button onClick={() => removeSample(s.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" disabled={samples.length <= 1}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
