import { useState, useRef } from 'react';
import { FileText, Download, Plus, Trash2, CheckCircle2, Clock, AlertCircle, Upload, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type EntryStatus = 'good' | 'fair' | 'reject' | 'pending';

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

export function ReportSection() {
  const [title, setTitle] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<ReportEntry[]>([
    { id: '1', parameter: '', method: '', result: '', unit: '', greenRange: '', yellowRange: '', status: 'pending' }
  ]);

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
      if (field === 'result' || field === 'greenRange' || field === 'yellowRange') {
        const res = parseFloat(updated.result);
        const greenMatch = updated.greenRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
        const yellowMatch = updated.yellowRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
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
          updated.status = status;
        } else {
          updated.status = 'pending';
        }
      }
      return updated;
    }));
  };

  const statusIcon = (status: EntryStatus) => {
    switch (status) {
      case 'good': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'fair': return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'reject': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
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

    // Logo
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, 'PNG', 14, yPos, 24, 24); } catch { /* skip */ }
    }

    // Company name & title
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

    doc.setDrawColor(0, 200, 180);
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 4, 196, yPos + 4);

    // Table
    autoTable(doc, {
      startY: yPos + 10,
      head: [['Parameter', 'Method', 'Result', 'Specification', 'Status']],
      body: entries.map(e => [
        e.parameter || '—',
        e.method || '—',
        `${e.result || '—'} ${e.unit}`.trim(),
        e.specification || '—',
        e.status === 'good' ? '✓ Good' : e.status === 'fair' ? '⚠ Fair' : e.status === 'reject' ? '✗ Reject' : 'Pending',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 160, 145], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        4: { fontStyle: 'bold', halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = data.cell.raw as string;
          if (val.startsWith('✓')) data.cell.styles.textColor = [0, 160, 80];
          else if (val.startsWith('⚠')) data.cell.styles.textColor = [200, 160, 0];
          else if (val.startsWith('✗')) data.cell.styles.textColor = [200, 50, 50];
        }
      },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Generated by ChemAnalyst', 14, pageHeight - 10);
    doc.text(`Page 1 of 1`, 196, pageHeight - 10, { align: 'right' });

    doc.save(`COA_${batchNo || 'report'}_${date}.pdf`);
  };

  return (
    <div className="space-y-4">
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
