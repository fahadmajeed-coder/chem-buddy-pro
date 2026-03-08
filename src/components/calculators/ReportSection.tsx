import { useState } from 'react';
import { FileText, Download, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ReportEntry {
  id: string;
  parameter: string;
  method: string;
  result: string;
  unit: string;
  specification: string;
  status: 'pass' | 'fail' | 'pending';
}

export function ReportSection() {
  const [title, setTitle] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [entries, setEntries] = useState<ReportEntry[]>([
    { id: '1', parameter: '', method: '', result: '', unit: '', specification: '', status: 'pending' }
  ]);

  const addEntry = () => {
    setEntries(prev => [...prev, {
      id: Date.now().toString(), parameter: '', method: '', result: '', unit: '', specification: '', status: 'pending'
    }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) setEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof ReportEntry, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, [field]: value };
      // Auto-evaluate status
      if (field === 'result' || field === 'specification') {
        const spec = updated.specification;
        const res = parseFloat(updated.result);
        if (spec && !isNaN(res)) {
          const match = spec.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
          if (match) {
            const min = parseFloat(match[1]);
            const max = parseFloat(match[2]);
            updated.status = (res >= min && res <= max) ? 'pass' : 'fail';
          }
        }
      }
      return updated;
    }));
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'fail': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const exportReport = () => {
    const report = {
      title: title || 'Certificate of Analysis',
      batchNo,
      date: new Date().toISOString().split('T')[0],
      entries: entries.map(({ parameter, method, result, unit, specification, status }) => ({
        parameter, method, result: `${result} ${unit}`, specification, status
      }))
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `COA_${batchNo || 'report'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <div className="glass-panel rounded-lg p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Certificate of Analysis</h3>
          </div>
          <button onClick={exportReport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export COA
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Report Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Certificate of Analysis"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Batch Number</label>
            <input type="text" value={batchNo} onChange={(e) => setBatchNo(e.target.value)} placeholder="BATCH-001"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="glass-panel rounded-lg overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Parameter</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Specification</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  {(['parameter', 'method', 'result', 'unit', 'specification'] as const).map((field) => (
                    <td key={field} className="py-2 px-2">
                      <input type="text" value={entry[field]} onChange={(e) => updateEntry(entry.id, field, e.target.value)}
                        placeholder={field === 'specification' ? 'e.g. 98.0-102.0' : field.charAt(0).toUpperCase() + field.slice(1)}
                        className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                  ))}
                  <td className="py-2 px-3 text-center">{statusIcon(entry.status)}</td>
                  <td className="py-2 px-2">
                    {entries.length > 1 && (
                      <button onClick={() => removeEntry(entry.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button onClick={addEntry}
        className="w-full py-3 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-sm transition-all">
        <Plus className="w-4 h-4" /> Add Parameter
      </button>
    </div>
  );
}
