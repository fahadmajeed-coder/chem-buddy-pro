import { ReactNode, useState } from 'react';
import { Lock, Unlock, RotateCcw, Copy, Check } from 'lucide-react';

interface CalculatorCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  locked: boolean;
  onToggleLock: () => void;
  onReset: () => void;
  result?: { value: string; unit: string } | null;
  resultUnitSelector?: ReactNode;
}

export function CalculatorCard({ title, subtitle, children, locked, onToggleLock, onReset, result, resultUnitSelector }: CalculatorCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(`${result.value} ${result.unit}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className={`glass-panel rounded-lg animate-fade-in ${locked ? 'glow-border' : ''}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onReset}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleLock}
            className={`p-1.5 rounded-md transition-colors ${locked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            title={locked ? 'Unlock' : 'Lock for reuse'}
          >
            {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {children}
      </div>

      {result && (
        <div className="px-5 py-3 border-t border-border bg-primary/5 rounded-b-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground mr-2">Result:</span>
            <span className="font-mono text-lg font-bold text-primary">{result.value}</span>
            <span className="text-sm text-muted-foreground ml-1">{result.unit}</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
