import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MolarityCalculator } from '@/components/calculators/MolarityCalculator';
import { NormalityCalculator } from '@/components/calculators/NormalityCalculator';
import { FormalityCalculator } from '@/components/calculators/FormalityCalculator';
import { ConversionCalculator } from '@/components/calculators/ConversionCalculator';
import { SolutionPrepCalculator } from '@/components/calculators/SolutionPrepCalculator';
import { DilutionCalculator } from '@/components/calculators/DilutionCalculator';
import { AnalyticalTestSection } from '@/components/calculators/AnalyticalTestSection';
import { ReportSection } from '@/components/calculators/ReportSection';
import { StandardsSection } from '@/components/calculators/StandardsSection';
import { CustomCalculatorSection } from '@/components/calculators/CustomCalculatorSection';
import { AddSectionDialog } from '@/components/AddSectionDialog';
import { ChemistryAssistant } from '@/components/calculators/ChemistryAssistant';
import { InventoryManager } from '@/components/calculators/InventoryManager';
import { PeriodicTable } from '@/components/calculators/PeriodicTable';
import { FormulaBuilder } from '@/components/calculators/FormulaBuilder';
import { CalibrationCurveSection } from '@/components/calculators/CalibrationCurveSection';
import { StandardsInventory } from '@/components/calculators/StandardsInventory';
import { SOPSection } from '@/components/calculators/SOPSection';
import { IndicatorsInventory } from '@/components/calculators/IndicatorsInventory';
import { CVPercentCalculator } from '@/components/calculators/CVPercentCalculator';
import { Wifi, WifiOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [activeSection, setActiveSection] = useState('molarity');
  const [customSections, setCustomSections] = useState<{ id: string; name: string }[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [elementMw, setElementMw] = useState<number | null>(null);
  const isOnline = navigator.onLine;
  const isMobile = useIsMobile();

  const handleUseInCalculator = (target: 'molarity' | 'normality' | 'formality' | 'solution', mw: number, _name: string) => {
    setElementMw(mw);
    setActiveSection(target);
  };

  const addCustomSection = (name: string) => {
    setCustomSections(prev => [...prev, { id: `custom-${Date.now()}`, name }]);
  };

  const sectionTitles: Record<string, string> = {
    molarity: 'Molarity Calculator',
    normality: 'Normality Calculator',
    formality: 'Formality Calculator',
    conversion: 'Unit Conversions',
    solution: 'Solution Preparation',
    dilution: 'Dilution Calculator',
    analytical: 'Analytical Testing',
    report: 'Reports & COA',
    standards: 'Standards Matching',
    assistant: 'Chemistry Assistant',
    inventory: 'Chemical Inventory',
    'periodic-table': 'Periodic Table',
    formulas: 'Custom Formulas',
    calibration: 'Calibration Curve',
    'standards-inventory': 'Standards Inventory',
    sop: 'SOPs',
    indicators: 'Indicators Inventory',
    'cv-percent': 'CV% Calculator',
  };

  const sections: Record<string, React.ReactNode> = {
    molarity: <MolarityCalculator initialMw={elementMw} />,
    normality: <NormalityCalculator initialMw={elementMw} />,
    formality: <FormalityCalculator initialMw={elementMw} />,
    conversion: <ConversionCalculator />,
    solution: <SolutionPrepCalculator initialMw={elementMw} />,
    dilution: <DilutionCalculator initialMw={elementMw} />,
    analytical: <AnalyticalTestSection />,
    report: <ReportSection />,
    standards: <StandardsSection />,
    assistant: <ChemistryAssistant />,
    inventory: <InventoryManager />,
    'periodic-table': <PeriodicTable onUseInCalculator={handleUseInCalculator} />,
    formulas: <FormulaBuilder />,
    calibration: <CalibrationCurveSection />,
    'standards-inventory': <StandardsInventory />,
    sop: <SOPSection />,
    indicators: <IndicatorsInventory />,
    'cv-percent': <CVPercentCalculator />,
  };

  const renderSections = () => {
    const allSections = [
      ...Object.entries(sections),
      ...customSections.map(s => [s.id, <CustomCalculatorSection key={s.id} name={s.name} />] as const),
    ];
    return allSections.map(([id, component]) => (
      <div key={id} style={{ display: activeSection === id ? 'block' : 'none' }}>
        {component}
      </div>
    ));
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={(id) => { setElementMw(null); setActiveSection(id); }}
        customSections={customSections}
        onAddSection={() => setShowAddDialog(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className={`flex items-center justify-between border-b border-border bg-card/50 shrink-0 ${
          isMobile ? 'px-14 py-2' : 'px-6 py-3'
        }`}>
          <div className="min-w-0">
            <h1 className={`font-semibold text-foreground truncate ${isMobile ? 'text-sm' : 'text-lg'}`}>
              {sectionTitles[activeSection] || customSections.find(s => s.id === activeSection)?.name || 'Calculator'}
            </h1>
            {!isMobile && <p className="text-xs text-muted-foreground">Analytical Chemistry Toolkit</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {!isMobile && (isOnline ? 'Online' : 'Offline')}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className={`mx-auto ${
            activeSection === 'periodic-table' ? 'max-w-6xl' : 'max-w-4xl'
          } ${isMobile ? 'p-3' : 'p-6'}`}>
            {renderSections()}
          </div>
        </div>
      </main>

      <AddSectionDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={addCustomSection}
      />
    </div>
  );
};

export default Index;
