import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Copy, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const NUM_ROWS = 10;

export function CVPercentCalculator() {
  const isMobile = useIsMobile();
  const [observations, setObservations] = useState<string[]>(Array(NUM_ROWS).fill(''));

  const updateObs = (index: number, value: string) => {
    setObservations(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const stats = useMemo(() => {
    const values = observations.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (values.length < 2) return null;

    const n = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;

    return { n, sum, mean, stdDev, cv };
  }, [observations]);

  const reset = () => {
    setObservations(Array(NUM_ROWS).fill(''));
    toast.success('Cleared all observations');
  };

  const copyResults = () => {
    if (!stats) return;
    const text = `Mean: ${stats.mean.toFixed(6)}\nStd Dev: ${stats.stdDev.toFixed(6)}\nCV%: ${stats.cv.toFixed(4)}%\nN: ${stats.n}`;
    navigator.clipboard.writeText(text);
    toast.success('Results copied');
  };

  return (
    <div className="space-y-4">
      {/* Formula reference */}
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

      {/* Input card */}
      <Card>
        <CardHeader className={`flex flex-row items-center justify-between ${isMobile ? 'p-3 pb-2' : 'p-4 pb-3'}`}>
          <CardTitle className={isMobile ? 'text-sm' : 'text-base'}>Observations</CardTitle>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyResults} disabled={!stats}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? 'px-3 pb-3' : 'px-4 pb-4'}>
          <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-5'}`}>
            {observations.map((val, i) => (
              <div key={i} className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  X{i + 1}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={val}
                  onChange={(e) => updateObs(i, e.target.value)}
                  placeholder="0"
                  className="w-full bg-input border border-border rounded-md px-2.5 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results card */}
      <Card className={stats ? 'border-primary/30' : ''}>
        <CardHeader className={isMobile ? 'p-3 pb-2' : 'p-4 pb-3'}>
          <CardTitle className={isMobile ? 'text-sm' : 'text-base'}>Results</CardTitle>
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
                highlight={stats.cv > 5}
                status={stats.cv <= 2 ? 'excellent' : stats.cv <= 5 ? 'acceptable' : 'high'}
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

function ResultBox({ label, value, highlight, status }: { label: string; value: string; highlight?: boolean; status?: 'excellent' | 'acceptable' | 'high' }) {
  const statusColor = status === 'excellent' ? 'text-success' : status === 'acceptable' ? 'text-warning' : status === 'high' ? 'text-destructive' : 'text-foreground';
  const statusLabel = status === 'excellent' ? '✓ Excellent' : status === 'acceptable' ? '~ Acceptable' : status === 'high' ? '⚠ High variability' : '';

  return (
    <div className={`rounded-lg border p-3 text-center ${highlight ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30'}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-mono font-bold ${status ? statusColor : 'text-foreground'}`}>{value}</p>
      {statusLabel && <p className={`text-[10px] mt-1 ${statusColor}`}>{statusLabel}</p>}
    </div>
  );
}
