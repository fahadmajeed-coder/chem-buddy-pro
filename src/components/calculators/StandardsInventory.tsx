import { useState } from 'react';
import { Search, Shield, CheckCircle2, AlertCircle, XCircle, Clock, Download } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalysisParam {
  id: string;
  analysis: string;
  normal: string;
  min: string;
  max: string;
  standard: string;
  withDeduction: string;
  outlier: string;
  reason: string;
}

interface SavedStandard {
  id: string;
  name: string;
  description: string;
  parameters: AnalysisParam[];
  createdAt: number;
}

type ResultStatus = 'good' | 'fair' | 'reject' | 'pending';

export function StandardsInventory() {
  const [savedStandards] = useLocalStorage<SavedStandard[]>('chemanalyst-standards', []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [readings, setReadings] = useState<Record<string, string>>({});

  const filtered = search
    ? savedStandards.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.parameters.some(p => p.analysis.toLowerCase().includes(search.toLowerCase()))
      )
    : savedStandards;

  const selected = savedStandards.find(s => s.id === selectedId);

  const updateReading = (paramId: string, value: string) => {
    setReadings(prev => ({ ...prev, [paramId]: value }));
  };

  const getStatus = (param: AnalysisParam): ResultStatus => {
    const reading = parseFloat(readings[param.id] || '');
    if (isNaN(reading)) return 'pending';

    const min = parseFloat(param.min);
    const max = parseFloat(param.max);
    const std = parseFloat(param.standard);
    const ded = parseFloat(param.withDeduction);
    const out = parseFloat(param.outlier);

    // Check outlier first (reject)
    if (!isNaN(out) && reading >= out) return 'reject';

    // Check standard range (good)
    if (!isNaN(min) && !isNaN(max)) {
      if (reading >= min && reading <= max) {
        // Within min-max, check if within standard
        if (!isNaN(std)) {
          if (!isNaN(ded)) {
            // Standard and deduction defined: within std = good, within ded = fair
            if (reading <= std) return 'good';
            if (reading <= ded) return 'fair';
            return 'reject';
          }
          if (reading <= std) return 'good';
          return 'fair';
        }
        return 'good';
      }
      return 'reject';
    }

    // Only standard defined
    if (!isNaN(std)) {
      if (!isNaN(ded)) {
        if (reading <= std) return 'good';
        if (reading <= ded) return 'fair';
        return 'reject';
      }
      if (reading <= std) return 'good';
      return 'fair';
    }

    return 'pending';
  };

  const statusIcon = (status: ResultStatus) => {
    switch (status) {
      case 'good': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'fair': return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'reject': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const exportPDF = () => {
    if (!selected) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30);
    doc.text(`${selected.name} — Lab Test Report`, 14, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, 14, 28);

    autoTable(doc, {
      startY: 34,
      head: [['Analysis', 'Normal', 'Min', 'Max', 'Standard', 'With Ded.', 'Outlier', 'Status']],
      body: selected.parameters.map(p => {
        const status = getStatus(p);
        return [
          p.analysis, p.normal || '—', p.min || '—', p.max || '—',
          p.standard || '—', p.withDeduction || '—', p.outlier || '—',
          status === 'good' ? 'GOOD' : status === 'fair' ? 'FAIR' : status === 'reject' ? 'REJECT' : 'PENDING',
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [0, 160, 145], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) {
          const val = (data.cell.raw as string || '').toUpperCase();
          if (val === 'GOOD') {
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fillColor = [0, 160, 80];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'FAIR') {
            data.cell.styles.textColor = [60, 40, 0];
            data.cell.styles.fillColor = [255, 200, 50];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'REJECT') {
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fillColor = [200, 50, 50];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    doc.save(`${selected.name}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search & Select */}
      <div className="glass-panel rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Standards Inventory</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">{savedStandards.length} templates</span>
        </div>

        {savedStandards.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No standard templates found. Go to the <strong>Standards</strong> section to create templates first.
          </p>
        ) : (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search standards by name or parameter..."
                className="w-full bg-input border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedId(s.id); setReadings({}); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all border ${
                    selectedId === s.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {s.name}
                  <span className="ml-1.5 text-[10px] opacity-70">({s.parameters.length})</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Selected Standard — Test Sheet */}
      {selected && (
        <div className="glass-panel rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{selected.name}</h3>
              {selected.description && <p className="text-xs text-muted-foreground">{selected.description}</p>}
            </div>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>

          {/* Summary */}
          <div className="px-5 py-3 border-b border-border bg-secondary/20">
            <div className="grid grid-cols-4 gap-3 text-center">
              {(['good', 'fair', 'reject', 'pending'] as ResultStatus[]).map(status => {
                const count = selected.parameters.filter(p => getStatus(p) === status).length;
                const colors: Record<ResultStatus, string> = {
                  good: 'text-success', fair: 'text-warning', reject: 'text-destructive', pending: 'text-muted-foreground',
                };
                const labels: Record<ResultStatus, string> = { good: 'Good', fair: 'Fair', reject: 'Reject', pending: 'Pending' };
                return (
                  <div key={status}>
                    <div className={`font-mono text-xl font-bold ${colors[status]}`}>{count}</div>
                    <div className="text-[10px] text-muted-foreground">{labels[status]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Analysis</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Normal</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Min</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Max</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Standard</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">With Ded.</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Outlier</th>
                  <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {selected.parameters.map(p => {
                  const status = getStatus(p);
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="py-2 px-3 text-xs font-medium text-foreground">{p.analysis}</td>
                      <td className="py-2 px-3 text-xs font-mono text-muted-foreground">{p.normal || '—'}</td>
                      <td className="py-2 px-3 text-xs font-mono text-muted-foreground">{p.min || '—'}</td>
                      <td className="py-2 px-3 text-xs font-mono text-muted-foreground">{p.max || '—'}</td>
                      <td className="py-2 px-3 text-xs font-mono text-primary">{p.standard || '—'}</td>
                      <td className="py-2 px-3 text-xs font-mono text-warning">{p.withDeduction || '—'}</td>
                      <td className="py-2 px-3 text-xs font-mono text-destructive">{p.outlier || '—'}</td>
                      <td className="py-2 px-3 text-center">{statusIcon(status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
