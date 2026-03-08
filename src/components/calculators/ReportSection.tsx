import { useState, useRef } from 'react';
import { FileText, Download, Plus, Trash2, CheckCircle2, Clock, AlertCircle, Upload, Building2, Shield, Settings2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type EntryStatus = 'good' | 'fair' | 'reject' | 'pending';

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

interface ReportEntry {
  id: string;
  parameter: string;
  method: string;
  result: string;
  unit: string;
  greenRange: string;
  yellowRange: string;
  status: EntryStatus;
}

const formatRangeStr = (min?: string, max?: string, legacy?: string) => {
  const a = min || '';
  const b = max || '';
  if (a && b) return `${a}–${b}`;
  if (a) return `≥${a}`;
  if (b) return `≤${b}`;
  return legacy || '';
};

const computeStatus = (result: string, greenRange: string, yellowRange: string): EntryStatus => {
  const res = parseFloat(result);
  const greenMatch = greenRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
  const yellowMatch = yellowRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
  if (!isNaN(res) && (greenMatch || yellowMatch)) {
    let status: EntryStatus = 'reject';
    if (greenMatch) {
      const gMin = parseFloat(greenMatch[1]);
      const gMax = parseFloat(greenMatch[2]);
      if (res >= gMin && res <= gMax) status = 'good';
    }
    if (status !== 'good' && yellowMatch) {
      const yMin = parseFloat(yellowMatch[1]);
      const yMax = parseFloat(yellowMatch[2]);
      if (res >= yMin && res <= yMax) status = 'fair';
    }
    return status;
  }
  return 'pending';
};

export function ReportSection() {
  const [savedStandards] = useLocalStorage<SavedStandard[]>('chemanalyst-standards', []);
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);

  const [exportColumns, setExportColumns] = useState({
    parameter: true,
    method: true,
    result: true,
    unit: true,
    greenRange: true,
    yellowRange: true,
    status: true,
  });

  const [title, setTitle] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<ReportEntry[]>([
    { id: '1', parameter: '', method: '', result: '', unit: '', greenRange: '', yellowRange: '', status: 'pending' }
  ]);

  const loadStandard = (standardId: string) => {
    const std = savedStandards.find(s => s.id === standardId);
    if (!std) return;
    setSelectedStandardId(standardId);
    setEntries(std.parameters.map(p => {
      const greenRange = formatRangeStr(p.normalMin, p.normalMax, p.normal);
      const yellowRange = formatRangeStr(p.withDeductionMin, p.withDeductionMax, p.withDeduction);
      return {
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        parameter: p.analysis,
        method: '',
        result: '',
        unit: '',
        greenRange,
        yellowRange,
        status: 'pending' as EntryStatus,
      };
    }));
  };

  const clearStandard = () => {
    setSelectedStandardId(null);
    setEntries([{ id: '1', parameter: '', method: '', result: '', unit: '', greenRange: '', yellowRange: '', status: 'pending' }]);
  };

  const addEntry = () => {
    setEntries(prev => [...prev, {
      id: Date.now().toString(), parameter: '', method: '', result: '', unit: '', greenRange: '', yellowRange: '', status: 'pending'
    }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) setEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof ReportEntry, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, [field]: value };
      // Only auto-compute status if not manually overridden via dropdown
      if (field === 'result' || field === 'greenRange' || field === 'yellowRange') {
        updated.status = computeStatus(updated.result, updated.greenRange, updated.yellowRange);
      }
      return updated;
    }));
  };

  const setStatus = (id: string, status: EntryStatus) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const statusIcon = (status: EntryStatus) => {
    switch (status) {
      case 'good': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'fair': return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'reject': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const toggleColumn = (col: keyof typeof exportColumns) => {
    setExportColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const columnLabels: Record<keyof typeof exportColumns, string> = {
    parameter: 'Parameter',
    method: 'Method',
    result: 'Result',
    unit: 'Unit',
    greenRange: 'Good Range',
    yellowRange: 'Fair Range',
    status: 'Status',
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const exportPDF = () => {
    const reportTitle = title || 'Certificate of Analysis';
    const date = new Date().toISOString().split('T')[0];
    const doc = new jsPDF();

    let yPos = 14;

    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, 'PNG', 14, yPos, 24, 24); } catch { /* skip */ }
    }

    const textX = logoDataUrl ? 42 : 14;
    if (companyName) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 160, 145);
      doc.text(companyName, textX, yPos + 8);
    }
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30);
    doc.text(reportTitle, textX, yPos + (companyName ? 18 : 10));

    yPos = 44;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text(`Batch No: ${batchNo || '—'}`, 14, yPos);
    doc.text(`Date: ${date}`, 196, yPos, { align: 'right' });

    const selectedStd = savedStandards.find(s => s.id === selectedStandardId);
    if (selectedStd) {
      doc.text(`Standard: ${selectedStd.name}`, 14, yPos + 6);
      yPos += 6;
    }

    doc.setDrawColor(0, 200, 180);
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 4, 196, yPos + 4);

    type ColKey = keyof typeof exportColumns;
    const allCols: { key: ColKey; header: string; getValue: (e: ReportEntry) => string }[] = [
      { key: 'parameter' as ColKey, header: 'Parameter', getValue: (e: ReportEntry) => e.parameter || '—' },
      { key: 'method' as ColKey, header: 'Method', getValue: (e: ReportEntry) => e.method || '—' },
      { key: 'result' as ColKey, header: 'Result', getValue: (e: ReportEntry) => `${e.result || '—'} ${e.unit}`.trim() },
      { key: 'greenRange' as ColKey, header: 'Good Range (Normal)', getValue: (e: ReportEntry) => e.greenRange || '—' },
      { key: 'yellowRange' as ColKey, header: 'Fair Range (With Ded.)', getValue: (e: ReportEntry) => e.yellowRange || '—' },
      { key: 'status' as ColKey, header: 'Status', getValue: (e: ReportEntry) => e.status === 'good' ? 'GOOD' : e.status === 'fair' ? 'FAIR' : e.status === 'reject' ? 'REJECT' : 'Pending' },
    ];
    const finalCols = allCols.filter(c => exportColumns[c.key]);

    // Transpose mode: when ≤2 column types selected, pivot so parameters become columns
    const useTranspose = finalCols.length === 2 && finalCols.some(c => c.key === 'parameter') && entries.length > 1;

    if (useTranspose) {
      const valueCol = finalCols.find(c => c.key !== 'parameter')!;
      // Head: first cell is the value label, then each parameter name
      const head = [valueCol.header, ...entries.map(e => e.parameter || '—')];
      // Body: single row with each parameter's value
      const body = [entries.map(e => valueCol.getValue(e))];
      // Prepend the row label
      body[0].unshift(valueCol.header);

      autoTable(doc, {
        startY: yPos + 10,
        head: [['', ...entries.map(e => e.parameter || '—')]],
        body: [[valueCol.header, ...entries.map(e => valueCol.getValue(e))]],
        theme: 'grid',
        headStyles: { fillColor: [0, 160, 145], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        didParseCell: (data) => {
          if (data.section === 'body' && valueCol.key === 'status') {
            const val = data.cell.raw as string;
            if (val === 'GOOD') { data.cell.styles.textColor = [255, 255, 255]; data.cell.styles.fillColor = [0, 160, 80]; }
            else if (val === 'FAIR') { data.cell.styles.textColor = [40, 40, 40]; data.cell.styles.fillColor = [255, 200, 50]; }
            else if (val === 'REJECT') { data.cell.styles.textColor = [255, 255, 255]; data.cell.styles.fillColor = [200, 50, 50]; }
          }
        },
      });
    } else {
      const statusColIndex = finalCols.findIndex(c => c.key === 'status');

      autoTable(doc, {
        startY: yPos + 10,
        head: [finalCols.map(c => c.header)],
        body: entries.map(e => finalCols.map(c => c.getValue(e))),
        theme: 'grid',
        headStyles: { fillColor: [0, 160, 145], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        ...(statusColIndex >= 0 ? { columnStyles: { [statusColIndex]: { fontStyle: 'bold', halign: 'center' } } } : {}),
        didParseCell: (data) => {
          if (data.section === 'body' && statusColIndex >= 0 && data.column.index === statusColIndex) {
            const val = data.cell.raw as string;
            if (val === 'GOOD') { data.cell.styles.textColor = [255, 255, 255]; data.cell.styles.fillColor = [0, 160, 80]; }
            else if (val === 'FAIR') { data.cell.styles.textColor = [40, 40, 40]; data.cell.styles.fillColor = [255, 200, 50]; }
            else if (val === 'REJECT') { data.cell.styles.textColor = [255, 255, 255]; data.cell.styles.fillColor = [200, 50, 50]; }
          }
        },
      });
    }

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Generated by ChemAnalyst', 14, pageHeight - 10);
    doc.text(`Page 1 of 1`, 196, pageHeight - 10, { align: 'right' });

    doc.save(`COA_${batchNo || 'report'}_${date}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Standard Template Selector */}
      {savedStandards.length > 0 && (
        <div className="glass-panel rounded-lg p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Load from Standard Template</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Select a saved standard to auto-fill parameters. Normal range → Good, With Deduction range → Fair, outside both → Reject.
          </p>
          <div className="flex flex-wrap gap-2">
            {savedStandards.map(s => (
              <button
                key={s.id}
                onClick={() => loadStandard(s.id)}
                className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                  selectedStandardId === s.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/50 text-foreground border-border hover:border-primary/50 hover:bg-secondary'
                }`}
              >
                {s.name}
                <span className="ml-1.5 text-[10px] opacity-70">({s.parameters.length})</span>
              </button>
            ))}
            {selectedStandardId && (
              <button
                onClick={clearStandard}
                className="px-3 py-2 rounded-md text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
              >
                Clear Template
              </button>
            )}
          </div>
        </div>
      )}

      {/* Branding */}
      <div className="glass-panel rounded-lg p-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Company Branding</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company Name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Laboratories"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company Logo</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-input border border-border rounded-md px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {logoDataUrl ? 'Change Logo' : 'Upload Logo'}
            </button>
          </div>
          {logoDataUrl && (
            <div className="flex items-center gap-2">
              <img src={logoDataUrl} alt="Logo" className="w-10 h-10 rounded border border-border object-contain bg-white" />
              <button onClick={() => setLogoDataUrl(null)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Header */}
      <div className="glass-panel rounded-lg p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Certificate of Analysis</h3>
          </div>
          <button onClick={exportPDF}
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

      {/* Export Column Toggles */}
      <div className="glass-panel rounded-lg p-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Export Columns</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">Toggle columns to include in PDF</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(exportColumns) as (keyof typeof exportColumns)[]).map(col => (
            <label key={col} className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={exportColumns[col]}
                onChange={() => toggleColumn(col)}
                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span className={`text-xs font-medium ${exportColumns[col] ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                {columnLabels[col]}
              </span>
            </label>
          ))}
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
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block"></span> Good Range</span>
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block"></span> Fair Range</span>
                </th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  {(['parameter', 'method', 'result', 'unit'] as const).map((field) => (
                    <td key={field} className="py-2 px-2">
                      <input type="text" value={entry[field]} onChange={(e) => updateEntry(entry.id, field, e.target.value)}
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                        className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                    </td>
                  ))}
                  <td className="py-2 px-2">
                    <input type="text" value={entry.greenRange} onChange={(e) => updateEntry(entry.id, 'greenRange', e.target.value)}
                      placeholder="e.g. 90-95"
                      className="w-full bg-transparent border border-transparent hover:border-border focus:border-success/60 rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={entry.yellowRange} onChange={(e) => updateEntry(entry.id, 'yellowRange', e.target.value)}
                      placeholder="e.g. 95-100"
                      className="w-full bg-transparent border border-transparent hover:border-border focus:border-warning/60 rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors" />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      {statusIcon(entry.status)}
                      <select
                        value={entry.status}
                        onChange={(e) => setStatus(entry.id, e.target.value as EntryStatus)}
                        className="bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-1 py-0.5 text-[10px] font-medium text-foreground focus:ring-0 focus:outline-none transition-colors cursor-pointer appearance-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="reject">Reject</option>
                      </select>
                    </div>
                  </td>
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
