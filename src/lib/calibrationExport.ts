import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CalibrationCurveData } from '@/components/calculators/CalibrationCurveCard';

function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function evaluateFormula(formula: string, vars: Record<string, number>): number | null {
  try {
    let expr = formula;
    const sorted = Object.keys(vars).sort((a, b) => b.length - a.length);
    for (const key of sorted) {
      expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), `(${vars[key]})`);
    }
    if (!/^[\d+\-*/().e\s]+$/.test(expr)) return null;
    const result = new Function(`"use strict"; return (${expr})`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function computeResults(data: CalibrationCurveData) {
  const pts = data.standards
    .map(s => ({ x: parseFloat(s.concentration), y: parseFloat(s.absorbance) }))
    .filter(p => !isNaN(p.x) && !isNaN(p.y));
  const reg = linearRegression(pts);
  if (!reg) return { regression: null, results: [] };

  const df = parseFloat(data.dilutionFactor) || 1;
  const sw = parseFloat(data.sampleWeight) || 1;
  const vol = parseFloat(data.finalVolume) || 1;
  const formula = data.formula || '(Abs * m + b) / W * 100';

  const results = data.samples.map(s => {
    const abs = parseFloat(s.absorbance);
    if (isNaN(abs)) return { name: s.name, absorbance: s.absorbance, result: '—' };
    const conc = (abs - reg.intercept) / reg.slope;
    const finalConc = evaluateFormula(formula, { Abs: abs, C: conc, DF: df, Vol: vol, W: sw, m: reg.slope, b: reg.intercept });
    return { name: s.name, absorbance: s.absorbance, result: finalConc !== null ? finalConc.toFixed(6) : '—' };
  });

  return { regression: reg, results };
}

export function exportCalibrationPDF(data: CalibrationCurveData) {
  const { regression, results } = computeResults(data);
  const doc = new jsPDF();
  const now = new Date().toLocaleString();

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, 14, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${now}`, 14, 27);

  // Regression info
  let y = 35;
  if (regression) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Regression Results', 14, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Equation: y = ${regression.slope.toFixed(6)}x + ${regression.intercept.toFixed(6)}`, 14, y); y += 5;
    doc.text(`Slope: ${regression.slope.toFixed(6)}`, 14, y); y += 5;
    doc.text(`Intercept: ${regression.intercept.toFixed(6)}`, 14, y); y += 5;
    doc.text(`R²: ${regression.r2.toFixed(6)}`, 14, y); y += 5;
    if (regression.r2 < 0.9) {
      doc.setTextColor(200, 0, 0);
      doc.text('⚠ Poor Linearity (R² < 0.9) — Standards need improvement', 14, y);
      doc.setTextColor(0, 0, 0);
      y += 5;
    }
    y += 3;
  }

  // Standards table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Standard Solutions', 14, y);
  y += 2;
  autoTable(doc, {
    startY: y,
    head: [['#', 'Concentration', 'Absorbance']],
    body: data.standards.map((s, i) => [String(i + 1), s.concentration, s.absorbance]),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Parameters
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Sample Parameters', 14, y);
  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sample Weight: ${data.sampleWeight} g`, 14, y); y += 5;
  doc.text(`Dilution Factor: ${data.dilutionFactor}`, 14, y); y += 5;
  doc.text(`Final Volume: ${data.finalVolume} mL`, 14, y); y += 5;
  doc.text(`Formula: Final Conc = ${data.formula}`, 14, y); y += 8;

  // Sample results table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Sample Results', 14, y);
  y += 2;
  autoTable(doc, {
    startY: y,
    head: [['#', 'Name', 'Absorbance', 'Result']],
    body: results.map((r, i) => [String(i + 1), r.name, r.absorbance, r.result]),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14 },
  });

  doc.save(`${data.title.replace(/\s+/g, '_')}.pdf`);
}

export function exportCalibrationCSV(data: CalibrationCurveData) {
  const { regression, results } = computeResults(data);
  const lines: string[] = [];

  lines.push(`"${data.title}"`);
  lines.push(`"Generated","${new Date().toLocaleString()}"`);
  lines.push('');

  if (regression) {
    lines.push('"Regression Results"');
    lines.push(`"Equation","y = ${regression.slope.toFixed(6)}x + ${regression.intercept.toFixed(6)}"`);
    lines.push(`"Slope","${regression.slope.toFixed(6)}"`);
    lines.push(`"Intercept","${regression.intercept.toFixed(6)}"`);
    lines.push(`"R²","${regression.r2.toFixed(6)}"`);
    lines.push('');
  }

  lines.push('"Standard Solutions"');
  lines.push('"#","Concentration","Absorbance"');
  data.standards.forEach((s, i) => lines.push(`"${i + 1}","${s.concentration}","${s.absorbance}"`));
  lines.push('');

  lines.push('"Sample Parameters"');
  lines.push(`"Sample Weight (g)","${data.sampleWeight}"`);
  lines.push(`"Dilution Factor","${data.dilutionFactor}"`);
  lines.push(`"Final Volume (mL)","${data.finalVolume}"`);
  lines.push(`"Formula","${data.formula}"`);
  lines.push('');

  lines.push('"Sample Results"');
  lines.push('"#","Name","Absorbance","Result"');
  results.forEach((r, i) => lines.push(`"${i + 1}","${r.name}","${r.absorbance}","${r.result}"`));

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.title.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
