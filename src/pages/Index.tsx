import { useState } from 'react';
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
import { Wifi, WifiOff } from 'lucide-react';

const Index = () => {
  const [activeSection, setActiveSection] = useState('molarity');
  const [customSections, setCustomSections] = useState<{ id: string; name: string }[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [elementMw, setElementMw] = useState<number | null>(null);
  const isOnline = navigator.onLine;

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
    report: 'Reports & Certificate of Analysis',
    standards: 'Standards Matching',
    assistant: 'Chemistry Assistant',
    inventory: 'Chemical Inventory',
    'periodic-table': 'Periodic Table',
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'molarity': return <MolarityCalculator initialMw={elementMw} />;
      case 'normality': return <NormalityCalculator initialMw={elementMw} />;
      case 'formality': return <FormalityCalculator initialMw={elementMw} />;
      case 'conversion': return <ConversionCalculator />;
      case 'solution': return <SolutionPrepCalculator initialMw={elementMw} />;
      case 'dilution': return <DilutionCalculator initialMw={elementMw} />;
      case 'analytical': return <AnalyticalTestSection />;
      case 'report': return <ReportSection />;
      case 'standards': return <StandardsSection />;
      case 'assistant': return <ChemistryAssistant />;
      case 'inventory': return <InventoryManager />;
      case 'periodic-table': return <PeriodicTable onUseInCalculator={handleUseInCalculator} />;
      default: {
        const custom = customSections.find(s => s.id === activeSection);
        return custom ? <CustomCalculatorSection name={custom.name} /> : null;
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={(id) => { setElementMw(null); setActiveSection(id); }}
        customSections={customSections}
        onAddSection={() => setShowAddDialog(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {sectionTitles[activeSection] || customSections.find(s => s.id === activeSection)?.name || 'Calculator'}
            </h1>
            <p className="text-xs text-muted-foreground">Analytical Chemistry Toolkit</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={`mx-auto ${activeSection === 'periodic-table' ? 'max-w-6xl' : 'max-w-4xl'}`}>
            {renderSection()}
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
