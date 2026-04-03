import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Copy, Info, FileDown, FileSpreadsheet, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SectionCloudSync } from './SectionCloudSync';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const NUM_ROWS = 10;

interface Observation {
  name: string;
  value: string;
}

interface CVLimits {
  excellent: number;
  acceptable: number;
}

const DEFAULT_LIMITS: CVLimits = { excellent: 2, acceptable: 5 };

export function CVPercentCalculator({ isAdmin = false }: { isAdmin?: boolean } = {}) {
  const isMobile = useIsMobile();
  const [sampleName, setSampleName] = useState('');
  const [observations, setObservations] = useState<Observation[]>(
    Array.from({ length: NUM_ROWS }, (_, i) => ({ name: `Sample ${i + 1}`, value: '' }))
  );
  const [limits, setLimits] = useLocalStorage<CVLimits>('chemanalyst-cv-limits', DEFAULT_LIMITS);
  const [showLimitSettings, setShowLimitSettings] = useState(false);

  const nameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const valueRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateObs = (index: number, field: 'name' | 'value', val: string) => {
    setObservations(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: 'name' | 'value') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow < NUM_ROWS) {
        const refs = field === 'name' ? nameRefs : valueRefs;
        refs.current[nextRow]?.focus();
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      if (field === 'name') {
        e.preventDefault();
        valueRefs.current[rowIndex]?.focus();
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      if (field === 'value') {
        e.preventDefault();
        nameRefs.current[rowIndex]?.focus();
      }
    }
  }, []);

  const stats = useMemo(() => {
    const entries = observations
      .map(o => ({ name: o.name, num: parseFloat(o.value) }))
      .filter(e => !isNaN(e.num));
    if (entries.length < 2) return null;

    const values = entries.map(e => e.num);
    const n = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;

    return { n, sum, mean, stdDev, cv, entries };
  }, [observations]);

  const getStatus = (cv: number): 'excellent' | 'acceptable' | 'high' => {
    if (cv <= limits.excellent) return 'excellent';
    if (cv <= limits.acceptable) return 'acceptable';
    return 'high';
  };

  const getStatusLabel = (status: 'excellent' | 'acceptable' | 'high') => {
    if (status === 'excellent') return `✓ Excellent (≤${limits.excellent}%)`;
    if (status === 'acceptable') return `~ Acceptable (≤${limits.acceptable}%)`;
    return `⚠ High variability (>${limits.acceptable}%)`;
  };

  const reset = () => {
    setSampleName('');
    setObservations(Array.from({ length: NUM_ROWS }, (_, i) => ({ name: `Sample ${i + 1}`, value: '' })));
    toast.success('Cleared all observations');
  };

  const copyResults = () => {
    if (!stats) return;
    const text = `Sample: ${sampleName || 'Untitled'}\nMean: ${stats.mean.toFixed(6)}\nStd Dev: ${stats.stdDev.toFixed(6)}\nCV%: ${stats.cv.toFixed(4)}%\nN: ${stats.n}`;
    navigator.clipboard.writeText(text);
    toast.success('Results copied');
  };

  const exportPDF = () => {
    if (!stats) return;
    const doc = new jsPDF();
    const title = sampleName || 'CV% Report';
    const now = new Date().toLocaleString();
    const status = getStatus(stats.cv);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${now}`, 14, 27);

    let y = 35;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Observations', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['#', 'Name', 'Value']],
      body: observations
        .map((o, i) => [String(i + 1), o.name, o.value || '—'])
        .filter((_, i) => observations[i].value !== ''),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistical Results', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Parameter', 'Value']],
      body: [
        ['N (observations)', String(stats.n)],
        ['Sum', stats.sum.toFixed(6)],
        ['Mean (μ)', stats.mean.toFixed(6)],
        ['Std Dev (σ)', stats.stdDev.toFixed(6)],
        ['CV%', `${stats.cv.toFixed(4)}%`],
        ['Assessment', getStatusLabel(status)],
        ['Limits', `Excellent: ≤${limits.excellent}% | Acceptable: ≤${limits.acceptable}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Formulas: Mean = Σ Obs / N  |  Std Dev = √(Σ(Xi−μ)²/(N−1))  |  CV% = (σ/μ)×100', 14, y);

    doc.save(`${title.replace(/\s+/g, '_')}_CV.pdf`);
    toast.success('PDF exported');
  };

  const exportExcel = () => {
    if (!stats) return;
    const title = sampleName || 'CV% Report';
    const status = getStatus(stats.cv);
    const lines: string[] = [];

    lines.push(`"${title}"`);
    lines.push(`"Generated","${new Date().toLocaleString()}"`);
    lines.push('');
    lines.push('"Observations"');
    lines.push('"#","Name","Value"');
    observations.forEach((o, i) => {
      if (o.value) lines.push(`"${i + 1}","${o.name}","${o.value}"`);
    });
    lines.push('');
    lines.push('"Statistical Results"');
    lines.push('"Parameter","Value"');
    lines.push(`"N","${stats.n}"`);
    lines.push(`"Sum","${stats.sum.toFixed(6)}"`);
    lines.push(`"Mean","${stats.mean.toFixed(6)}"`);
    lines.push(`"Std Dev","${stats.stdDev.toFixed(6)}"`);
    lines.push(`"CV%","${stats.cv.toFixed(4)}%"`);
    lines.push(`"Assessment","${getStatusLabel(status)}"`);

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_CV.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-4">
      {/* Formula reference — admin only */}
      {isAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className={isMobile ? 'p-3' : 'p-4'}>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1 text-xs text-muted-foreground font-mono">
                <p><span className="text-foreground font-semibold">Mean</span> = Σ Observations / N</p>
                <p><span className="text-foreground font-semibold">Std Dev</span> = √( Σ(Xᵢ − μ)² / (N−1) )</p>
                <p><span className="text-foreground font-semibold">CV%</span> = (Std Dev / Mean) × 100</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CV Limits Settings — admin only */}
      {isAdmin && (
        <Card>
          <CardContent className={isMobile ? 'p-3' : 'p-4'}>
            <button
              onClick={() => setShowLimitSettings(!showLimitSettings)}
              className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              CV% Acceptance Limits
              {showLimitSettings ? ' ▲' : ' ▼'}
            </button>
            {showLimitSettings && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Excellent (≤%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={limits.excellent}
                    onChange={e => setLimits({ ...limits, excellent: parseFloat(e.target.value) || 2 })}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[9px] text-success">✓ Excellent quality</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Acceptable (≤%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={limits.acceptable}
                    onChange={e => setLimits({ ...limits, acceptable: parseFloat(e.target.value) || 5 })}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[9px] text-warning">~ Acceptable quality</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current limits display for non-admin */}
      {!isAdmin && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-md bg-secondary/30 border border-border text-[10px] text-muted-foreground">
          <span>Limits: <span className="text-success font-medium">Excellent ≤{limits.excellent}%</span></span>
          <span className="text-border">|</span>
          <span><span className="text-warning font-medium">Acceptable ≤{limits.acceptable}%</span></span>
          <span className="text-border">|</span>
          <span><span className="text-destructive font-medium">High &gt;{limits.acceptable}%</span></span>
        </div>
      )}

      {/* Sample name */}
      <Card>
        <CardContent className={isMobile ? 'p-3' : 'p-4'}>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sample / Test Name</label>
          <input
            type="text"
            value={sampleName}
            onChange={(e) => setSampleName(e.target.value)}
            placeholder="e.g. Iron content in sample A"
            className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader className={`flex flex-row items-center justify-between ${isMobile ? 'p-3 pb-2' : 'p-4 pb-3'}`}>
          <CardTitle className={isMobile ? 'text-sm' : 'text-base'}>Observations</CardTitle>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset} title="Reset">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyResults} disabled={!stats} title="Copy">
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={exportPDF} disabled={!stats} title="Export PDF">
              <FileDown className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={exportExcel} disabled={!stats} title="Export CSV">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? 'px-3 pb-3' : 'px-4 pb-4'}>
          <div className="space-y-2">
            {observations.map((obs, i) => (
              <div key={i} className={`grid gap-2 ${isMobile ? 'grid-cols-[1fr_80px]' : 'grid-cols-[40px_1fr_120px]'} items-end`}>
                {!isMobile && (
                  <span className="text-[10px] font-mono text-muted-foreground pb-2">#{i + 1}</span>
                )}
                <div className="space-y-1">
                  {i === 0 && <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Name</label>}
                  <input
                    ref={el => { nameRefs.current[i] = el; }}
                    type="text"
                    value={obs.name}
                    onChange={(e) => updateObs(i, 'name', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, i, 'name')}
                    placeholder={`Sample ${i + 1}`}
                    className="w-full bg-input border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  {i === 0 && <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Value</label>}
                  <input
                    ref={el => { valueRefs.current[i] = el; }}
                    type="number"
                    inputMode="decimal"
                    value={obs.value}
                    onChange={(e) => updateObs(i, 'value', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, i, 'value')}
                    placeholder="0"
                    className="w-full bg-input border border-border rounded-md px-2.5 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className={stats ? 'border-primary/30' : ''}>
        <CardHeader className={isMobile ? 'p-3 pb-2' : 'p-4 pb-3'}>
          <CardTitle className={isMobile ? 'text-sm' : 'text-base'}>Results{sampleName ? ` — ${sampleName}` : ''}</CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'px-3 pb-3' : 'px-4 pb-4'}>
          {!stats ? (
            <p className="text-xs text-muted-foreground text-center py-4">Enter at least 2 observations to calculate</p>
          ) : (
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <ResultBox label="Mean (μ)" value={stats.mean.toFixed(6)} />
              <ResultBox label="Std Dev (σ)" value={stats.stdDev.toFixed(6)} />
              <ResultBox
                label="CV%"
                value={`${stats.cv.toFixed(4)}%`}
                highlight={stats.cv > limits.acceptable}
                status={getStatus(stats.cv)}
                statusLabel={getStatusLabel(getStatus(stats.cv))}
              />
            </div>
          )}
          {stats && (
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              Based on {stats.n} observation{stats.n > 1 ? 's' : ''} • Sum = {stats.sum.toFixed(4)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultBox({ label, value, highlight, status, statusLabel }: { label: string; value: string; highlight?: boolean; status?: 'excellent' | 'acceptable' | 'high'; statusLabel?: string }) {
  const statusColor = status === 'excellent' ? 'text-success' : status === 'acceptable' ? 'text-warning' : status === 'high' ? 'text-destructive' : 'text-foreground';

  return (
    <div className={`rounded-lg border p-3 text-center ${highlight ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30'}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-mono font-bold ${status ? statusColor : 'text-foreground'}`}>{value}</p>
      {statusLabel && <p className={`text-[10px] mt-1 ${statusColor}`}>{statusLabel}</p>}
    </div>
  );
}
