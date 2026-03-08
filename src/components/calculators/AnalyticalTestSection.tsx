import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Trash2, FlaskConical, Search, X, Lock, Unlock, ChevronDown, ChevronRight, Send, Download, BookOpen, Pencil, Check, PlusCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SOP_FORMULAS, sopFormulaToSavedFormula } from '@/lib/sopFormulas';

export interface AnalyticalResult {
  formulaName: string;
  sampleId: string;
  result: number;
  isAverage: boolean;
}

interface FormulaVariable {
  id: string;
  name: string;
  description: string;
  defaultValue: string;
  testValue: string;
}

interface SavedFormula {
  id: string;
  name: string;
  description: string;
  expression: string;
  variables: FormulaVariable[];
  createdAt: number;
}

interface SampleRow {
  id: string;
  sampleId: string;
  values: Record<string, string>;
}

interface FormulaBlock {
  formulaId: string;
  rows: SampleRow[];
}

// Same toJavaScript mapper from FormulaBuilder (minimal version for evaluation)
function toJavaScript(expr: string): string {
  let js = expr;
  // constants
  js = js.replace(/\bPI\b/g, 'Math.PI').replace(/\bEULER\b/g, 'Math.E');
  js = js.replace(/\bAVOGADRO\b/g, '6.02214076e23').replace(/\bPLANCK\b/g, '6.62607015e-34');
  js = js.replace(/\bBOLTZMANN\b/g, '1.380649e-23').replace(/\bGAS_R\b/g, '8.314462618');
  js = js.replace(/\bFARADAY\b/g, '96485.33212').replace(/\bSPEED_LIGHT\b/g, '299792458');
  js = js.replace(/\bATM_PA\b/g, '101325').replace(/\bWATER_Kw\b/g, '1e-14');
  // basic math
  js = js.replace(/√\(/g, 'Math.sqrt(');
  js = js.replace(/∛\(/g, 'Math.cbrt(');
  js = js.replace(/xⁿ/g, '**');
  js = js.replace(/\|([^|]+)\|/g, 'Math.abs($1)');
  js = js.replace(/\bln\(/g, 'Math.log(');
  js = js.replace(/\blog10\(/g, 'Math.log10(');
  js = js.replace(/\blog2\(/g, 'Math.log2(');
  js = js.replace(/\bexp\(/g, 'Math.exp(');
  js = js.replace(/\bfloor\(/g, 'Math.floor(');
  js = js.replace(/\bceil\(/g, 'Math.ceil(');
  js = js.replace(/\bround\(/g, 'Math.round(');
  js = js.replace(/\bmin\(/g, 'Math.min(');
  js = js.replace(/\bmax\(/g, 'Math.max(');
  // trig
  js = js.replace(/\bsin\(/g, 'Math.sin(');
  js = js.replace(/\bcos\(/g, 'Math.cos(');
  js = js.replace(/\btan\(/g, 'Math.tan(');
  js = js.replace(/\basin\(/g, 'Math.asin(');
  js = js.replace(/\bacos\(/g, 'Math.acos(');
  js = js.replace(/\batan\(/g, 'Math.atan(');
  // statistical helpers (multi-arg)
  const arrayFns: Record<string, string> = {
    'sum': '((...a)=>a.reduce((s,v)=>s+v,0))',
    'average': '((...a)=>a.reduce((s,v)=>s+v,0)/a.length)',
    'count': '((...a)=>a.length)',
    'median': '((...a)=>{a.sort((x,y)=>x-y);const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2})',
    'geoMean': '((...a)=>Math.pow(a.reduce((p,v)=>p*v,1),1/a.length))',
    'harmMean': '((...a)=>a.length/a.reduce((s,v)=>s+1/v,0))',
    'range': '((...a)=>Math.max(...a)-Math.min(...a))',
    'variance': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1)})',
    'stdDev': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))})',
    'popStdDev': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length)})',
    'cv': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return(Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))/m)*100})',
    'stdError': '((...a)=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))/Math.sqrt(a.length)})',
    'sumSq': '((...a)=>a.reduce((s,v)=>s+v*v,0))',
    'rss': '((...a)=>a.reduce((s,v)=>s+v*v,0))',
  };
  for (const [fn, impl] of Object.entries(arrayFns)) {
    const re = new RegExp(`\\b${fn}\\(`, 'g');
    js = js.replace(re, `${impl}(`);
  }
  // two-arg helpers
  js = js.replace(/\broundTo\(/g, '((v,p)=>+(Math.round(+(v+"e+"+p))+"e-"+p))(');
  js = js.replace(/\bclamp\(/g, '((v,lo,hi)=>Math.min(Math.max(v,lo),hi))(');
  js = js.replace(/\bpercentYield\(/g, '((a,t)=>(a/t)*100)(');
  js = js.replace(/\bpercentPurity\(/g, '((p,t)=>(p/t)*100)(');
  js = js.replace(/\bpercentError\(/g, '((exp,theo)=>Math.abs((exp-theo)/theo)*100)(');
  js = js.replace(/\bpercentDiff\(/g, '((a,b)=>Math.abs(a-b)/((a+b)/2)*100)(');
  js = js.replace(/\bpercentRecovery\(/g, '((f,i)=>(f/i)*100)(');
  js = js.replace(/\bmolarity\(/g, '((mol,L)=>mol/L)(');
  js = js.replace(/\bnormality\(/g, '((mol,L,n)=>(mol*n)/L)(');
  js = js.replace(/\bdilution\(/g, '((c1,v1,v2)=>(c1*v1)/v2)(');
  js = js.replace(/\bpH\(/g, '((h)=>-Math.log10(h))(');
  js = js.replace(/\bpOH\(/g, '((oh)=>-Math.log10(oh))(');
  return js;
}

function evaluateFormula(expression: string, variables: FormulaVariable[], values: Record<string, string>): number | null {
  try {
    let jsExpr = toJavaScript(expression);
    for (const v of variables) {
      const val = parseFloat(values[v.name] || v.defaultValue || '0');
      if (isNaN(val)) return null;
      jsExpr = jsExpr.replace(new RegExp(`\\b${v.name}\\b`, 'g'), val.toString());
    }
    const result = new Function(`"use strict"; return (${jsExpr});`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function makeDefaultValues(formula: SavedFormula): Record<string, string> {
  const vals: Record<string, string> = {};
  formula.variables.forEach(v => { if (v.defaultValue) vals[v.name] = v.defaultValue; });
  return vals;
}

function FormulaBlockCard({
  formula,
  block,
  onUpdateRow,
  onUpdateSampleId,
  onAddRow,
  onRemoveRow,
  onRemoveBlock,
  onResultsChange,
  onUpdateFormula,
}: {
  formula: SavedFormula;
  block: FormulaBlock;
  onUpdateRow: (rowId: string, field: string, value: string) => void;
  onUpdateSampleId: (rowId: string, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onRemoveBlock: () => void;
  onResultsChange: (results: AnalyticalResult[]) => void;
  onUpdateFormula: (updated: SavedFormula) => void;
}) {
  const [cardLocked, setCardLocked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showAverages, setShowAverages] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(formula.name);
  const [editDesc, setEditDesc] = useState(formula.description);
  const [editExpr, setEditExpr] = useState(formula.expression);
  const [editVars, setEditVars] = useState<FormulaVariable[]>(formula.variables.map(v => ({ ...v })));
  const cardResultsRef = React.useRef<AnalyticalResult[]>([]);

  // Compute results for all rows
  const rowResults = useMemo(() => {
    return block.rows.map(row => ({
      ...row,
      result: evaluateFormula(formula.expression, formula.variables, row.values),
    }));
  }, [block.rows, formula]);

  // Group by sampleId and compute averages
  const sampleAverages = useMemo(() => {
    if (!showAverages) return new Map<string, number>();
    const groups = new Map<string, number[]>();
    for (const row of rowResults) {
      const id = row.sampleId.trim();
      if (!id || row.result === null) continue;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id)!.push(row.result);
    }
    const avgs = new Map<string, number>();
    for (const [id, vals] of groups) {
      if (vals.length > 1) {
        avgs.set(id, vals.reduce((s, v) => s + v, 0) / vals.length);
      }
    }
    return avgs;
  }, [showAverages, rowResults]);

  // Report exportable results to parent
  useEffect(() => {
    const results: AnalyticalResult[] = [];
    if (showAverages && sampleAverages.size > 0) {
      // Use averages for grouped samples
      for (const [id, avg] of sampleAverages) {
        results.push({ formulaName: formula.name, sampleId: id, result: avg, isAverage: true });
      }
      // Also include ungrouped (single-occurrence) sample results
      const groupedIds = new Set(sampleAverages.keys());
      for (const row of rowResults) {
        if (row.sampleId.trim() && !groupedIds.has(row.sampleId.trim()) && row.result !== null) {
          results.push({ formulaName: formula.name, sampleId: row.sampleId.trim(), result: row.result, isAverage: false });
        }
      }
    } else {
      for (const row of rowResults) {
        if (row.result !== null) {
          results.push({ formulaName: formula.name, sampleId: row.sampleId.trim(), result: row.result, isAverage: false });
        }
      }
    }
    cardResultsRef.current = results;
    onResultsChange(results);
  }, [rowResults, showAverages, sampleAverages, formula.name, onResultsChange]);

  // Track which sampleIds we've already rendered an average row for
  const renderedAverages = useMemo(() => new Set<string>(), [block.rows]);

  return (
    <div className={`glass-panel rounded-lg animate-fade-in ${cardLocked ? 'glow-border' : ''}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <button onClick={() => setCollapsed(c => !c)} className="flex items-center gap-2 min-w-0">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <FlaskConical className="w-3.5 h-3.5 text-primary shrink-0" />
          <h3 className="text-sm font-semibold text-foreground truncate">{formula.name}</h3>
        </button>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={() => {
              const results = cardResultsRef.current;
              if (results.length === 0) {
                toast.error('No results to send.');
                return;
              }
              // Merge with existing COA results
              try {
                const existing: AnalyticalResult[] = JSON.parse(localStorage.getItem('chemanalyst-analytical-results') || '[]');
                const filtered = existing.filter(r => r.formulaName !== formula.name);
                localStorage.setItem('chemanalyst-analytical-results', JSON.stringify([...filtered, ...results]));
              } catch {
                localStorage.setItem('chemanalyst-analytical-results', JSON.stringify(results));
              }
              toast.success(`${results.length} result(s) from "${formula.name}" sent to COA.`);
            }}
            className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors"
            title="Send this test to COA"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          {!cardLocked && !editing && (
            <button
              onClick={onRemoveBlock}
              className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
              title="Remove this formula"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {!cardLocked && !editing && (
            <button
              onClick={() => {
                setEditName(formula.name);
                setEditDesc(formula.description);
                setEditExpr(formula.expression);
                setEditVars(formula.variables.map(v => ({ ...v })));
                setEditing(true);
                setCollapsed(false);
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Edit formula"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {editing && (
            <>
              <button
                onClick={() => {
                  if (!editName.trim() || !editExpr.trim()) {
                    toast.error('Name and expression are required.');
                    return;
                  }
                  onUpdateFormula({
                    ...formula,
                    name: editName.trim(),
                    description: editDesc.trim(),
                    expression: editExpr.trim(),
                    variables: editVars.filter(v => v.name.trim()),
                  });
                  setEditing(false);
                  toast.success('Formula updated.');
                }}
                className="p-1.5 rounded-md text-success hover:bg-success/10 transition-colors"
                title="Save changes"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Cancel editing"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => setCardLocked(l => !l)}
            className={`p-1.5 rounded-md transition-colors ${cardLocked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            title={cardLocked ? 'Unlock' : 'Lock'}
          >
            {cardLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!collapsed && editing && (
        <div className="p-5 space-y-3 border-b border-border bg-muted/20">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mt-1 bg-input border border-border rounded px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full mt-1 bg-input border border-border rounded px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Expression</label>
            <input
              value={editExpr}
              onChange={(e) => setEditExpr(e.target.value)}
              className="w-full mt-1 bg-input border border-border rounded px-3 py-1.5 text-sm font-mono text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Variables</label>
              <button
                onClick={() => setEditVars(prev => [...prev, { id: `v-${Date.now()}`, name: '', description: '', defaultValue: '', testValue: '' }])}
                className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                title="Add variable"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {editVars.map((v, i) => (
                <div key={v.id} className="flex items-center gap-2">
                  <input
                    value={v.name}
                    onChange={(e) => { const next = [...editVars]; next[i] = { ...next[i], name: e.target.value }; setEditVars(next); }}
                    placeholder="Name"
                    className="w-24 bg-input border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                  />
                  <input
                    value={v.description}
                    onChange={(e) => { const next = [...editVars]; next[i] = { ...next[i], description: e.target.value }; setEditVars(next); }}
                    placeholder="Description"
                    className="flex-1 bg-input border border-border rounded px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                  <input
                    value={v.defaultValue}
                    onChange={(e) => { const next = [...editVars]; next[i] = { ...next[i], defaultValue: e.target.value }; setEditVars(next); }}
                    placeholder="Default"
                    className="w-16 bg-input border border-border rounded px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => setEditVars(prev => prev.filter((_, j) => j !== i))}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!collapsed && !editing && (
        <div className="p-5 space-y-4">
          {formula.description && (
            <p className="text-xs text-muted-foreground">{formula.description}</p>
          )}
          <div className="p-2.5 rounded-md bg-muted/50 border border-border">
            <code className="text-xs font-mono text-primary">{formula.expression}</code>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sample</th>
                  {formula.variables.map(v => (
                    <th key={v.id} className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider" title={v.description}>
                      {v.name}
                    </th>
                  ))}
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, idx) => {
                  const result = evaluateFormula(formula.expression, formula.variables, row.values);
                  const sampleId = row.sampleId.trim();
                  // Check if next row has a different sampleId (or is the last row) to render average
                  const isLastOfGroup = showAverages && sampleId && sampleAverages.has(sampleId) &&
                    (idx === block.rows.length - 1 || block.rows[idx + 1].sampleId.trim() !== sampleId);

                  return (
                    <React.Fragment key={row.id}>
                      <tr className="border-b border-border/50">
                        <td className="py-2 px-1">
                          <input
                            type="text"
                            value={row.sampleId}
                            onChange={(e) => onUpdateSampleId(row.id, e.target.value)}
                            disabled={cardLocked}
                            placeholder="ID"
                            className="w-20 bg-input border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        {formula.variables.map(v => (
                          <td key={v.id} className="py-2 px-1">
                            <input
                              type="number"
                              value={row.values[v.name] || ''}
                              onChange={(e) => onUpdateRow(row.id, v.name, e.target.value)}
                              disabled={cardLocked}
                              placeholder={v.defaultValue || '0'}
                              className="w-20 bg-input border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                            />
                          </td>
                        ))}
                        <td className="py-2 px-2">
                          <span className="font-mono text-sm font-bold text-primary">
                            {result !== null ? result.toFixed(4) : '—'}
                          </span>
                        </td>
                        <td className="py-2 px-1">
                          {block.rows.length > 1 && !cardLocked && (
                            <button onClick={() => onRemoveRow(row.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                      {isLastOfGroup && (
                        <tr key={`avg-${sampleId}`} className="border-b border-primary/20 bg-primary/5">
                          <td className="py-1.5 px-2">
                            <span className="text-xs font-semibold text-primary">Avg: {sampleId}</span>
                          </td>
                          {formula.variables.map(v => (
                            <td key={v.id} className="py-1.5 px-1"></td>
                          ))}
                          <td className="py-1.5 px-2">
                            <span className="font-mono text-sm font-bold text-primary">
                              {sampleAverages.get(sampleId)!.toFixed(4)}
                            </span>
                          </td>
                          <td className="py-1.5 px-1"></td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Average checkbox & Export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`avg-${formula.id}`}
                checked={showAverages}
                onCheckedChange={(checked) => setShowAverages(checked === true)}
              />
              <label htmlFor={`avg-${formula.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                Show average for same Sample ID
              </label>
            </div>
            <button
              onClick={() => {
                const date = new Date().toISOString().split('T')[0];
                const doc = new jsPDF();
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30);
                doc.text(`${formula.name} — Test Report`, 14, 20);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100);
                doc.text(`Formula: ${formula.expression}`, 14, 28);
                doc.text(`Date: ${date}`, 196, 28, { align: 'right' });

                const head = ['Sample ID', ...formula.variables.map(v => v.name), 'Result'];
                const body: string[][] = [];
                const renderedAvgIds = new Set<string>();

                for (let i = 0; i < rowResults.length; i++) {
                  const row = rowResults[i];
                  body.push([
                    row.sampleId || '—',
                    ...formula.variables.map(v => row.values[v.name] || '—'),
                    row.result !== null ? row.result.toFixed(4) : '—',
                  ]);
                  // Add average row after last of group
                  const sid = row.sampleId.trim();
                  if (showAverages && sid && sampleAverages.has(sid) && !renderedAvgIds.has(sid)) {
                    const isLast = i === rowResults.length - 1 || rowResults[i + 1].sampleId.trim() !== sid;
                    if (isLast) {
                      renderedAvgIds.add(sid);
                      body.push([
                        `Avg: ${sid}`,
                        ...formula.variables.map(() => ''),
                        sampleAverages.get(sid)!.toFixed(4),
                      ]);
                    }
                  }
                }

                autoTable(doc, {
                  startY: 34,
                  head: [head],
                  body,
                  theme: 'grid',
                  headStyles: { fillColor: [0, 160, 145], textColor: 255, fontStyle: 'bold', fontSize: 9 },
                  styles: { fontSize: 9, cellPadding: 3 },
                  didParseCell: (data) => {
                    if (data.section === 'body') {
                      const raw = data.cell.raw as string;
                      if (raw && raw.startsWith('Avg:')) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [230, 245, 243];
                      }
                    }
                  },
                });

                doc.save(`${formula.name}_Report_${date}.pdf`);
                toast.success(`Exported ${formula.name} report`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 border border-border transition-colors"
              title="Export this test as PDF"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>

          {!cardLocked && (
            <button
              onClick={onAddRow}
              className="w-full py-2 rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 text-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AnalyticalTestSection() {
  const [savedFormulas, setSavedFormulas] = useLocalStorage<SavedFormula[]>('chem-formulas-v2', []);
  const [blocks, setBlocks] = useState<FormulaBlock[]>([]);
  const [blockResults, setBlockResults] = useState<Record<string, AnalyticalResult[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [blockSearchQuery, setBlockSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [globalLocked, setGlobalLocked] = useState(false);

  const handleResultsChange = useCallback((formulaId: string, results: AnalyticalResult[]) => {
    setBlockResults(prev => ({ ...prev, [formulaId]: results }));
  }, []);

  const allResults = useMemo(() => {
    return Object.values(blockResults).flat();
  }, [blockResults]);

  const sendToCOA = () => {
    if (allResults.length === 0) {
      toast.error('No results to send. Add formulas and enter sample data first.');
      return;
    }
    localStorage.setItem('chemanalyst-analytical-results', JSON.stringify(allResults));
    toast.success(`${allResults.length} result(s) sent to COA Report section.`);
  };

  const filteredFormulas = useMemo(() => {
    if (!searchQuery.trim()) return savedFormulas;
    const q = searchQuery.toLowerCase();
    return savedFormulas.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.expression.toLowerCase().includes(q)
    );
  }, [savedFormulas, searchQuery]);

  const usedFormulaIds = useMemo(() => new Set(blocks.map(b => b.formulaId)), [blocks]);

  // Filter active blocks by search
  const filteredBlocks = useMemo(() => {
    if (!blockSearchQuery.trim()) return blocks;
    const q = blockSearchQuery.toLowerCase();
    return blocks.filter(b => {
      const f = savedFormulas.find(sf => sf.id === b.formulaId);
      if (!f) return false;
      return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.expression.toLowerCase().includes(q);
    });
  }, [blocks, blockSearchQuery, savedFormulas]);

  const addFormulaBlock = (formulaId: string) => {
    const formula = savedFormulas.find(f => f.id === formulaId);
    if (!formula) return;
    setBlocks(prev => [...prev, {
      formulaId,
      rows: [{ id: Date.now().toString(), sampleId: '', values: makeDefaultValues(formula) }],
    }]);
    setSearchQuery('');
  };

  const removeBlock = (formulaId: string) => {
    setBlocks(prev => prev.filter(b => b.formulaId !== formulaId));
  };

  const addRowToBlock = (formulaId: string) => {
    const formula = savedFormulas.find(f => f.id === formulaId);
    if (!formula) return;
    setBlocks(prev => prev.map(b =>
      b.formulaId === formulaId
        ? { ...b, rows: [...b.rows, { id: Date.now().toString(), sampleId: '', values: makeDefaultValues(formula) }] }
        : b
    ));
  };

  const removeRowFromBlock = (formulaId: string, rowId: string) => {
    setBlocks(prev => prev.map(b =>
      b.formulaId === formulaId && b.rows.length > 1
        ? { ...b, rows: b.rows.filter(r => r.id !== rowId) }
        : b
    ));
  };

  const updateRowInBlock = (formulaId: string, rowId: string, field: string, value: string) => {
    setBlocks(prev => prev.map(b =>
      b.formulaId === formulaId
        ? { ...b, rows: b.rows.map(r => r.id === rowId ? { ...r, values: { ...r.values, [field]: value } } : r) }
        : b
    ));
  };

  const updateSampleIdInBlock = (formulaId: string, rowId: string, value: string) => {
    setBlocks(prev => prev.map(b =>
      b.formulaId === formulaId
        ? { ...b, rows: b.rows.map(r => r.id === rowId ? { ...r, sampleId: value } : r) }
        : b
    ));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Analytical Testing</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Add formulas and enter sample data</p>
          </div>
          <div className="flex items-center gap-1">
            {allResults.length > 0 && (
              <button
                onClick={sendToCOA}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors mr-1"
                title="Send results to COA Report"
              >
                <Send className="w-3.5 h-3.5" /> Send to COA
              </button>
            )}
            {blocks.length > 0 && !globalLocked && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                title="Remove All"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setGlobalLocked(l => !l)}
              className={`p-1.5 rounded-md transition-colors ${globalLocked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
              title={globalLocked ? 'Unlock All' : 'Lock All'}
            >
              {globalLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {/* Unified search bar with auto-dropdown */}
          {savedFormulas.length > 0 && (
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border border-border rounded-lg">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search & add formulas..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); }} className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {blocks.length > 0 && (
                  <>
                    <div className="w-px h-5 bg-border" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{filteredBlocks.length}/{blocks.length} active</span>
                  </>
                )}
              </div>

              {/* Auto-dropdown for formula library */}
              {showDropdown && (
                <div className="absolute z-20 left-0 right-0 mt-1 border border-border rounded-lg bg-card shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Formula Library</span>
                    <button onClick={() => setShowDropdown(false)} className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {filteredFormulas.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No formulas match.</p>
                    ) : (
                      filteredFormulas.map(f => {
                        const alreadyUsed = usedFormulaIds.has(f.id);
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              if (!alreadyUsed) {
                                addFormulaBlock(f.id);
                                setShowDropdown(false);
                              }
                            }}
                            disabled={alreadyUsed}
                            className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b border-border/50 last:border-b-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center gap-2">
                              <FlaskConical className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="text-sm font-medium text-foreground">{f.name}</span>
                              {alreadyUsed && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Added</span>}
                            </div>
                            {f.description && <p className="text-xs text-muted-foreground mt-0.5 ml-5.5 truncate">{f.description}</p>}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {savedFormulas.length === 0 ? (
            <div className="py-4 space-y-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" />
                No formulas saved yet. Go to <span className="font-semibold text-primary">Formulas</span> to create one, or load SOP formulas below.
              </p>
              <button
                onClick={() => {
                  const existing: SavedFormula[] = JSON.parse(localStorage.getItem('chem-formulas-v2') || '[]');
                  const existingIds = new Set(existing.map(f => f.id));
                  let added = 0;
                  for (const def of SOP_FORMULAS) {
                    const sf = sopFormulaToSavedFormula(def);
                    if (!existingIds.has(sf.id)) {
                      existing.push(sf as SavedFormula);
                      added++;
                    }
                  }
                  if (added > 0) {
                    localStorage.setItem('chem-formulas-v2', JSON.stringify(existing));
                    window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: 'chem-formulas-v2' } }));
                    toast.success(`${added} SOP formulas loaded!`);
                  } else {
                    toast.info('All SOP formulas are already loaded.');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" /> Load All SOP Formulas ({SOP_FORMULAS.length})
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Clear All confirmation */}
      {showClearConfirm && (
        <div className="glass-panel rounded-lg p-5 border border-destructive/30 animate-fade-in">
          <p className="text-sm text-foreground font-medium mb-1">Remove all formulas?</p>
          <p className="text-xs text-muted-foreground mb-4">This will remove all formula blocks and their sample data from this page.</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBlocks([]); setShowClearConfirm(false); }}
              className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              Yes, Clear All
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Render each formula block */}
      {filteredBlocks.map(block => {
        const formula = savedFormulas.find(f => f.id === block.formulaId);
        if (!formula) return null;
        return (
          <FormulaBlockCard
            key={block.formulaId}
            formula={formula}
            block={block}
            onUpdateRow={(rowId, field, value) => updateRowInBlock(block.formulaId, rowId, field, value)}
            onUpdateSampleId={(rowId, value) => updateSampleIdInBlock(block.formulaId, rowId, value)}
            onAddRow={() => addRowToBlock(block.formulaId)}
            onRemoveRow={(rowId) => removeRowFromBlock(block.formulaId, rowId)}
            onRemoveBlock={() => removeBlock(block.formulaId)}
            onResultsChange={(results) => handleResultsChange(block.formulaId, results)}
            onUpdateFormula={(updated) => {
              setSavedFormulas(prev => prev.map(f => f.id === updated.id ? updated : f));
            }}
          />
        );
      })}
    </div>
  );
}
