import { useState } from 'react';
import { Search, Shield, Download } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  // Legacy compat
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

const formatRange = (min?: string, max?: string, legacy?: string) => {
  const a = min || '';
  const b = max || '';
  if (a && b) return `${a}–${b}`;
  if (a) return `≥${a}`;
  if (b) return `≤${b}`;
  return legacy || '—';
};

export function StandardsInventory() {
  const [savedStandards] = useLocalStorage<SavedStandard[]>('chemanalyst-standards', []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = search
    ? savedStandards.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.parameters.some(p => p.analysis.toLowerCase().includes(search.toLowerCase()))
      )
    : savedStandards;

  const selected = savedStandards.find(s => s.id === selectedId);

  const exportPDF = () => {
    if (!selected) return;
    const doc = new jsPDF({ orientation: 'landscape' });
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
      head: [['Analysis', 'Normal Range', 'Min', 'Max', 'Standard', 'With Ded. Range', 'Outlier Range', 'Reason']],
      body: selected.parameters.map(p => [
        p.analysis,
        formatRange(p.normalMin, p.normalMax, p.normal),
        p.min || '—',
        p.max || '—',
        p.standard || '—',
        formatRange(p.withDeductionMin, p.withDeductionMax, p.withDeduction),
        formatRange(p.outlierMin, p.outlierMax, p.outlier),
        p.reason || '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 160, 145], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      didParseCell: (data) => {
        if (data.section === 'body') {
          // Color the With Ded. column
          if (data.column.index === 5) {
            data.cell.styles.textColor = [200, 160, 0];
          }
          // Color the Outlier column
          if (data.column.index === 6) {
            data.cell.styles.textColor = [200, 50, 50];
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
                  onClick={() => setSelectedId(s.id)}
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

      {/* Selected Standard — View Sheet */}
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

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Analysis</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Normal Range</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Min</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Max</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Standard</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-warning uppercase tracking-wider">With Ded. Range</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-destructive uppercase tracking-wider">Outlier Range</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody>
                {selected.parameters.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="py-2 px-3 text-xs font-medium text-foreground">{p.analysis}</td>
                    <td className="py-2 px-3 text-xs font-mono text-muted-foreground">{formatRange(p.normalMin, p.normalMax, p.normal)}</td>
                    <td className="py-2 px-3 text-xs font-mono text-muted-foreground">{p.min || '—'}</td>
                    <td className="py-2 px-3 text-xs font-mono text-muted-foreground">{p.max || '—'}</td>
                    <td className="py-2 px-3 text-xs font-mono text-primary">{p.standard || '—'}</td>
                    <td className="py-2 px-3 text-xs font-mono text-warning">{formatRange(p.withDeductionMin, p.withDeductionMax, p.withDeduction)}</td>
                    <td className="py-2 px-3 text-xs font-mono text-destructive">{formatRange(p.outlierMin, p.outlierMax, p.outlier)}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{p.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
