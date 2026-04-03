import { useState, useRef } from 'react';
import { FileText, Download, Plus, Trash2, CheckCircle2, Clock, AlertCircle, Upload, Building2, Shield, Settings2, FlaskConical, Save, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import type { AnalyticalResult } from './AnalyticalTestSection';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SectionCloudSync } from './SectionCloudSync';
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

interface CustomColumn {
  id: string;
  header: string;
  formula: string; // formula expression e.g. "{result} * 0.5" or empty for manual
}

interface ReportTemplate {
  id: string;
  name: string;
  customColumns: CustomColumn[];
  showDeduction: boolean;
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
  included: boolean;
  deduction: string;
  customValues: Record<string, string>;
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

/** Auto-calculate deduction based on how far a result is outside the good range */
const computeDeduction = (result: string, greenRange: string): string => {
  const res = parseFloat(result);
  if (isNaN(res)) return '';
  const match = greenRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
  if (!match) return '';
  const gMin = parseFloat(match[1]);
  const gMax = parseFloat(match[2]);
  if (res >= gMin && res <= gMax) return '0';
  // How far outside the range
  if (res < gMin) return (gMin - res).toFixed(4);
  if (res > gMax) return (res - gMax).toFixed(4);
  return '';
};

const makeEntry = (overrides?: Partial<ReportEntry>): ReportEntry => ({
  id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  parameter: '',
  method: '',
  result: '',
  unit: '',
  greenRange: '',
  yellowRange: '',
  status: 'pending',
  included: true,
  deduction: '',
  customValues: {},
  ...overrides,
});

/** Evaluate a simple formula for a custom column.
 *  Tokens: {result}, {deduction}, {greenMin}, {greenMax}
 *  Supports basic math: +, -, *, /, (, )
 */
const evalColumnFormula = (formula: string, entry: ReportEntry): string => {
  if (!formula.trim()) return '';
  try {
    const greenMatch = entry.greenRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    let expr = formula
      .replace(/\{result\}/gi, entry.result || '0')
      .replace(/\{deduction\}/gi, entry.deduction || '0')
      .replace(/\{greenMin\}/gi, greenMatch ? greenMatch[1] : '0')
      .replace(/\{greenMax\}/gi, greenMatch ? greenMatch[2] : '0');
    // Only allow digits, operators, parentheses, dots
    if (/^[\d\s+\-*/().]+$/.test(expr)) {
      const result = Function('"use strict"; return (' + expr + ')')();
      return typeof result === 'number' && !isNaN(result) ? result.toFixed(4) : '';
    }
  } catch { /* ignore */ }
  return '';
};

export function ReportSection({ isAdmin = false }: { isAdmin?: boolean }) {
  const [savedStandards] = useLocalStorage<SavedStandard[]>('chemanalyst-standards', []);
  const [selectedStandardId, setSelectedStandardId] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useLocalStorage<ReportTemplate[]>('chemanalyst-report-templates', []);
  const [templateName, setTemplateName] = useState('');

  const [showDeduction, setShowDeduction] = useState(true);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);

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
  const [entries, setEntries] = useState<ReportEntry[]>([makeEntry()]);

  const normalizeParam = (name: string) => name.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();

  const loadStandard = (standardId: string) => {
    const std = savedStandards.find(s => s.id === standardId);
    if (!std) return;
    setSelectedStandardId(standardId);
    const existingByParam = new Map<string, ReportEntry>();
    for (const e of entries) {
      if (e.parameter.trim()) {
        existingByParam.set(normalizeParam(e.parameter), e);
      }
    }
    const usedExistingIds = new Set<string>();
    const stdEntries = std.parameters.map(p => {
      const greenRange = formatRangeStr(p.normalMin, p.normalMax, p.normal);
      const yellowRange = formatRangeStr(p.withDeductionMin, p.withDeductionMax, p.withDeduction);
      const paramKey = normalizeParam(p.analysis);
      const existing = existingByParam.get(paramKey);
      if (existing) usedExistingIds.add(existing.id);
      const resultVal = existing?.result || '';
      return makeEntry({
        parameter: p.analysis,
        method: existing?.method || '',
        result: resultVal,
        unit: existing?.unit || '',
        greenRange,
        yellowRange,
        status: resultVal ? computeStatus(resultVal, greenRange, yellowRange) : 'pending',
        included: existing?.included ?? true,
        deduction: resultVal ? computeDeduction(resultVal, greenRange) : '',
        customValues: existing?.customValues || {},
      });
    });
    const extras = entries.filter(e => e.parameter.trim() && !usedExistingIds.has(e.id));
    setEntries([...stdEntries, ...extras]);
  };

  const clearStandard = () => {
    setSelectedStandardId(null);
    setEntries([makeEntry()]);
  };

  const addEntry = () => {
    setEntries(prev => [...prev, makeEntry()]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) setEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof ReportEntry, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const updated = { ...e, [field]: value };
      if (field === 'result' || field === 'greenRange' || field === 'yellowRange') {
        updated.status = computeStatus(updated.result, updated.greenRange, updated.yellowRange);
        // Auto-calculate deduction unless user manually edited it
        if (field !== 'greenRange' || !e.deduction) {
          updated.deduction = computeDeduction(updated.result, updated.greenRange);
        }
      }
      return updated;
    }));
  };

  const updateCustomValue = (entryId: string, colId: string, value: string) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, customValues: { ...e.customValues, [colId]: value } } : e));
  };

  const setStatus = (id: string, status: EntryStatus) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const addCustomColumn = () => {
    setCustomColumns(prev => [...prev, { id: `col-${Date.now()}`, header: `Column ${prev.length + 1}`, formula: '' }]);
  };

  const updateColumnHeader = (colId: string, header: string) => {
    setCustomColumns(prev => prev.map(c => c.id === colId ? { ...c, header } : c));
  };

  const updateColumnFormula = (colId: string, formula: string) => {
    setCustomColumns(prev => prev.map(c => c.id === colId ? { ...c, formula } : c));
  };

  const removeCustomColumn = (colId: string) => {
    setCustomColumns(prev => prev.filter(c => c.id !== colId));
  };

  const resetLoadedResults = () => {
    setEntries([makeEntry()]);
    setSelectedStandardId(null);
    toast.success('All loaded results cleared');
  };

  const saveTemplate = () => {
    const name = templateName.trim() || `Template ${savedTemplates.length + 1}`;
    const template: ReportTemplate = {
      id: `tmpl-${Date.now()}`,
      name,
      customColumns: [...customColumns],
      showDeduction,
      createdAt: Date.now(),
    };
    setSavedTemplates(prev => [...prev, template]);
    setTemplateName('');
    toast.success(`Template "${name}" saved`);
  };

  const loadTemplate = (tmpl: ReportTemplate) => {
    setCustomColumns(tmpl.customColumns.map(c => ({ ...c })));
    setShowDeduction(tmpl.showDeduction);
    toast.success(`Template "${tmpl.name}" loaded`);
  };

  const deleteTemplate = (id: string) => {
    setSavedTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
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
    const exportEntries = entries.filter(e => e.included);
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
      { key: 'parameter', header: 'Parameter', getValue: (e) => e.parameter || '—' },
      { key: 'method', header: 'Method', getValue: (e) => e.method || '—' },
      { key: 'result', header: 'Result', getValue: (e) => `${e.result || '—'} ${e.unit}`.trim() },
      { key: 'greenRange', header: 'Good Range (Normal)', getValue: (e) => e.greenRange || '—' },
      { key: 'yellowRange', header: 'Fair Range (With Ded.)', getValue: (e) => e.yellowRange || '—' },
      { key: 'status', header: 'Status', getValue: (e) => e.status === 'good' ? 'GOOD' : e.status === 'fair' ? 'FAIR' : e.status === 'reject' ? 'REJECT' : 'Pending' },
    ];
    let finalCols = allCols.filter(c => exportColumns[c.key]);

    // Add deduction column if visible
    if (showDeduction) {
      const statusIdx = finalCols.findIndex(c => c.key === 'status');
      const dedCol = { key: 'status' as ColKey, header: 'Deduction', getValue: (e: ReportEntry) => e.deduction || '—' };
      if (statusIdx >= 0) finalCols.splice(statusIdx + 1, 0, dedCol);
      else finalCols.push(dedCol);
    }

    // Add custom columns
    for (const cc of customColumns) {
      finalCols.push({ key: 'status' as ColKey, header: cc.header, getValue: (e) => e.customValues[cc.id] || '—' });
    }

    const useTranspose = finalCols.length === 2 && finalCols.some(c => c.header === 'Parameter') && exportEntries.length > 1;

    if (useTranspose) {
      const valueCol = finalCols.find(c => c.header !== 'Parameter')!;
      autoTable(doc, {
        startY: yPos + 10,
        head: [['', ...exportEntries.map(e => e.parameter || '—')]],
        body: [[valueCol.header, ...exportEntries.map(e => valueCol.getValue(e))]],
        theme: 'grid',
        headStyles: { fillColor: [0, 160, 145], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
      });
    } else {
      const statusColIndex = finalCols.findIndex(c => c.header === 'Status');
      autoTable(doc, {
        startY: yPos + 10,
        head: [finalCols.map(c => c.header)],
        body: exportEntries.map(e => finalCols.map(c => c.getValue(e))),
        theme: 'grid',
        headStyles: { fillColor: [0, 160, 145], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        ...(statusColIndex >= 0 ? { columnStyles: { [statusColIndex]: { fontStyle: 'bold', halign: 'center' as const } } } : {}),
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

  const loadFromAnalyticalTests = () => {
    try {
      const raw = localStorage.getItem('chemanalyst-analytical-results');
      if (!raw) return;
      const results: AnalyticalResult[] = JSON.parse(raw);
      if (!results.length) return;

      const analyticalMap = new Map<string, AnalyticalResult>();
      for (const r of results) {
        analyticalMap.set(normalizeParam(r.formulaName), r);
      }

      const hasExistingParams = entries.some(e => e.parameter.trim());
      
      if (hasExistingParams) {
        const updatedEntries = entries.map(e => {
          const paramKey = normalizeParam(e.parameter);
          const match = analyticalMap.get(paramKey);
          if (match) {
            analyticalMap.delete(paramKey);
            const result = match.result.toFixed(4);
            return {
              ...e,
              result,
              status: computeStatus(result, e.greenRange, e.yellowRange),
              deduction: computeDeduction(result, e.greenRange),
            };
          }
          return e;
        });
        const extraEntries: ReportEntry[] = [];
        for (const [, r] of analyticalMap) {
          extraEntries.push(makeEntry({
            parameter: r.formulaName + (r.sampleId ? ` (${r.sampleId})` : ''),
            result: r.result.toFixed(4),
          }));
        }
        setEntries([...updatedEntries, ...extraEntries]);
      } else {
        setEntries(results.map(r => makeEntry({
          parameter: r.formulaName + (r.sampleId ? ` (${r.sampleId})` : ''),
          result: r.result.toFixed(4),
        })));
      }
      toast.success(`Analytical results loaded and merged.`);
    } catch { /* ignore */ }
  };

  const hasAnalyticalResults = (() => {
    try {
      const raw = localStorage.getItem('chemanalyst-analytical-results');
      return raw ? JSON.parse(raw).length > 0 : false;
    } catch { return false; }
  })();

  return (
    <div className="space-y-4">
      {/* Data Sources Panel */}
      {(savedStandards.length > 0 || hasAnalyticalResults) && (
        <div className="glass-panel rounded-lg p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Data Sources</h3>
            <span className="text-[10px] text-muted-foreground ml-auto">Load from Standards and/or Analytical Tests in any order</span>
          </div>

          {savedStandards.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                ① Standard Template <span className="normal-case font-normal">— fills parameters &amp; ranges</span>
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
                <button
                  onClick={resetLoadedResults}
                  className="px-3 py-2 rounded-md text-xs font-medium border border-warning/30 text-warning hover:bg-warning/10 transition-colors"
                >
                  Reset All Results
                </button>
              </div>
            </div>
          )}

          {hasAnalyticalResults && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                ② Analytical Test Results <span className="normal-case font-normal">— fills result values (merges by parameter name)</span>
              </p>
              <button
                onClick={loadFromAnalyticalTests}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 border border-primary/20 transition-colors"
              >
                <FlaskConical className="w-3.5 h-3.5" /> Load Analytical Results
              </button>
            </div>
          )}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const date = new Date().toISOString().split('T')[0];
                const metaRows: string[][] = [];
                if (companyName) metaRows.push(['Company', companyName]);
                metaRows.push(['Report Title', title || 'Certificate of Analysis']);
                if (batchNo) metaRows.push(['Batch No', batchNo]);
                metaRows.push(['Date', date]);
                metaRows.push([]);
                const headers = ['Parameter', 'Method', 'Result', 'Unit', 'Good Range', 'Fair Range', 'Status'];
                if (showDeduction) headers.push('Deduction');
                customColumns.forEach(cc => headers.push(cc.header));
                const csvEntries = entries.filter(e => e.included);
                const rows = csvEntries.map(e => {
                  const row = [
                    e.parameter, e.method, e.result, e.unit, e.greenRange, e.yellowRange,
                    e.status === 'good' ? 'GOOD' : e.status === 'fair' ? 'FAIR' : e.status === 'reject' ? 'REJECT' : 'Pending'
                  ];
                  if (showDeduction) row.push(e.deduction || '');
                  customColumns.forEach(cc => row.push(e.customValues[cc.id] || ''));
                  return row;
                });
                const csv = [...metaRows, headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `COA_${batchNo || 'report'}_${date}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('CSV exported');
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 border border-border transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
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

      {/* Export Column Toggles + Deduction Toggle + Custom Columns */}
      <div className="glass-panel rounded-lg p-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Column Settings</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">Toggle columns, add custom columns, save templates</span>
        </div>

        {/* Standard column toggles */}
        <div className="flex flex-wrap gap-3 mb-3">
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
          {/* Deduction toggle */}
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDeduction}
              onChange={() => setShowDeduction(!showDeduction)}
              className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
            />
            <span className={`text-xs font-medium ${showDeduction ? 'text-warning' : 'text-muted-foreground line-through'}`}>
              Deduction
            </span>
          </label>
        </div>

        {/* Custom columns */}
        {customColumns.length > 0 && (
          <div className="space-y-2 mb-3">
            {customColumns.map(cc => (
              <div key={cc.id} className="flex items-center gap-2 bg-secondary/50 border border-border rounded-md px-2 py-1.5">
                <input
                  type="text"
                  value={cc.header}
                  onChange={(e) => updateColumnHeader(cc.id, e.target.value)}
                  className="bg-transparent text-xs font-medium text-foreground w-24 focus:outline-none focus:ring-0 border-none"
                  placeholder="Header name"
                />
                {isAdmin && (
                  <input
                    type="text"
                    value={cc.formula}
                    onChange={(e) => updateColumnFormula(cc.id, e.target.value)}
                    className="bg-input border border-border rounded px-2 py-0.5 text-[10px] font-mono text-primary w-40 focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Formula: {result}*0.5"
                    title="Use {result}, {deduction}, {greenMin}, {greenMax}"
                  />
                )}
                {cc.formula && !isAdmin && (
                  <span className="text-[10px] text-muted-foreground font-mono">ƒ auto</span>
                )}
                <button onClick={() => removeCustomColumn(cc.id)} className="text-destructive hover:text-destructive/80 p-0.5 ml-auto">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={addCustomColumn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Column
          </button>

          {/* Save / Load Templates */}
          <div className="flex items-center gap-1.5 ml-auto">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="bg-input border border-border rounded-md px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary w-28"
            />
            <button
              onClick={saveTemplate}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
            >
              <Save className="w-3 h-3" /> Save
            </button>
          </div>
        </div>

        {/* Saved templates */}
        {savedTemplates.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Saved Templates</p>
            <div className="flex flex-wrap gap-2">
              {savedTemplates.map(tmpl => (
                <div key={tmpl.id} className="flex items-center gap-1">
                  <button
                    onClick={() => loadTemplate(tmpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary/50 text-foreground border border-border hover:border-primary/50 transition-colors"
                  >
                    <FolderOpen className="w-3 h-3" /> {tmpl.name}
                  </button>
                  <button onClick={() => deleteTemplate(tmpl.id)} className="p-1 text-destructive/60 hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entries Table */}
      <div className="glass-panel rounded-lg overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="py-2.5 px-2 text-center">
                  <input
                    type="checkbox"
                    checked={entries.every(e => e.included)}
                    onChange={(e) => setEntries(prev => prev.map(en => ({ ...en, included: e.target.checked })))}
                    className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                    title="Select/Deselect all for export"
                  />
                </th>
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
                {showDeduction && (
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-warning uppercase tracking-wider">Deduction</th>
                )}
                {customColumns.map(cc => (
                  <th key={cc.id} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {cc.header}
                  </th>
                ))}
                <th className="py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className={`border-b border-border/50 transition-colors ${entry.included ? 'hover:bg-secondary/20' : 'opacity-40'}`}>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={entry.included}
                      onChange={(e) => setEntries(prev => prev.map(en => en.id === entry.id ? { ...en, included: e.target.checked } : en))}
                      className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                    />
                  </td>
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
                  {showDeduction && (
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={entry.deduction}
                        onChange={(e) => setEntries(prev => prev.map(en => en.id === entry.id ? { ...en, deduction: e.target.value } : en))}
                        placeholder="Auto"
                        className="w-20 bg-transparent border border-transparent hover:border-border focus:border-warning/60 rounded px-2 py-1 text-xs font-mono text-warning focus:ring-0 focus:outline-none transition-colors"
                      />
                    </td>
                  )}
                  {customColumns.map(cc => {
                    const formulaVal = cc.formula ? evalColumnFormula(cc.formula, entry) : '';
                    const displayVal = cc.formula ? (entry.customValues[cc.id] || formulaVal) : (entry.customValues[cc.id] || '');
                    return (
                      <td key={cc.id} className="py-2 px-2">
                        {cc.formula ? (
                          <span className="text-xs font-mono text-foreground px-2 py-1">{formulaVal || '—'}</span>
                        ) : (
                          <input
                            type="text"
                            value={displayVal}
                            onChange={(e) => updateCustomValue(entry.id, cc.id, e.target.value)}
                            placeholder="—"
                            className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-0 focus:outline-none transition-colors"
                          />
                        )}
                      </td>
                    );
                  })}
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
