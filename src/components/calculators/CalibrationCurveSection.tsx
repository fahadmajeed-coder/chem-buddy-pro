import { TrendingUp, Plus } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CalibrationCurveCard, CalibrationCurveData, DEFAULT_TEMPLATE } from './CalibrationCurveCard';

function createCurve(overrides?: Partial<CalibrationCurveData>): CalibrationCurveData {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    createdAt: Date.now(),
    title: DEFAULT_TEMPLATE.title,
    standards: DEFAULT_TEMPLATE.standards.map(s => ({ ...s })),
    samples: DEFAULT_TEMPLATE.samples.map(s => ({ ...s })),
    dilutionFactor: DEFAULT_TEMPLATE.dilutionFactor,
    locked: false,
    ...overrides,
  };
}

export function CalibrationCurveSection() {
  const [curves, setCurves] = useLocalStorage<CalibrationCurveData[]>('calibration-curves', [
    createCurve({ locked: true, title: 'Default Template' }),
  ]);

  const handleUpdate = (updated: CalibrationCurveData) => {
    setCurves(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDuplicate = (source: CalibrationCurveData) => {
    const copy = createCurve({
      title: `${source.title} (Copy)`,
      standards: source.standards.map(s => ({ ...s, id: Date.now().toString() + s.id })),
      samples: source.samples.map(s => ({ ...s, id: Date.now().toString() + s.id })),
      dilutionFactor: source.dilutionFactor,
      locked: false,
    });
    setCurves(prev => [...prev, copy]);
  };

  const handleDelete = (id: string) => {
    setCurves(prev => prev.filter(c => c.id !== id));
  };

  const handleAddNew = () => {
    setCurves(prev => [...prev, createCurve({ title: `Curve ${prev.length + 1}` })]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Calibration Curve Calculator
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lock curves as templates, then duplicate to create working copies
          </p>
        </div>
        <button onClick={handleAddNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Curve
        </button>
      </div>

      {curves.map(curve => (
        <CalibrationCurveCard
          key={curve.id}
          data={curve}
          onUpdate={handleUpdate}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          canDelete={curves.length > 1}
        />
      ))}
    </div>
  );
}
