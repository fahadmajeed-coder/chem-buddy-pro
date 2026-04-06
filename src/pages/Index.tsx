import { useState } from 'react';
import { Sun, Moon, Shield, LogOut, Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAdminMode } from '@/hooks/useAdminMode';
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
import { DataSyncManager } from '@/components/calculators/DataSyncManager';
import { FeedFormulation } from '@/components/calculators/FeedFormulation';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const Index = () => {
  const [activeSection, setActiveSection] = useState('solution');
  const [customSections, setCustomSections] = useState<{ id: string; name: string }[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [elementMw, setElementMw] = useState<number | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cloudMode, setCloudMode] = useState(false);
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, login, logout } = useAdminMode();

  const handleUseInCalculator = (target: 'molarity' | 'normality' | 'formality' | 'solution', mw: number, _name: string) => {
    setElementMw(mw);
    setActiveSection(target);
  };

  const addCustomSection = (name: string) => {
    setCustomSections(prev => [...prev, { id: `custom-${Date.now()}`, name }]);
  };

  const handleAdminLogin = () => {
    if (login(adminPassword)) {
      toast.success('Admin mode activated');
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      toast.error('Incorrect password');
    }
  };

  // Regular users cannot access AI Assistant
  const handleSectionChange = (id: string) => {
    if (id === 'assistant' && !isAdmin) {
      toast.error('AI Assistant is only available in Admin mode');
      return;
    }
    setElementMw(null);
    setActiveSection(id);
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
    standards: 'Raw Material Standards',
    assistant: 'Chemistry Assistant',
    inventory: 'Chemical Inventory',
    'periodic-table': 'Periodic Table',
    formulas: 'Custom Formulas',
    calibration: 'Calibration Curve',
    'standards-inventory': 'Standards Inventory',
    sop: 'SOPs',
    indicators: 'Indicators Inventory',
    'cv-percent': 'CV% Calculator',
    'data-sync': 'Data Transfer',
    'feed-formulation': 'Feed Formulation',
  };

  const sections: Record<string, React.ReactNode> = {
    molarity: <MolarityCalculator initialMw={elementMw} isAdmin={isAdmin} />,
    normality: <NormalityCalculator initialMw={elementMw} isAdmin={isAdmin} />,
    formality: <FormalityCalculator initialMw={elementMw} isAdmin={isAdmin} />,
    conversion: <ConversionCalculator isAdmin={isAdmin} />,
    solution: <SolutionPrepCalculator initialMw={elementMw} isAdmin={isAdmin} />,
    dilution: <DilutionCalculator initialMw={elementMw} isAdmin={isAdmin} />,
    analytical: <AnalyticalTestSection isAdmin={isAdmin} />,
    report: <ReportSection isAdmin={isAdmin} />,
    standards: <StandardsSection />,
    assistant: <ChemistryAssistant />,
    inventory: <InventoryManager isAdmin={isAdmin} />,
    'periodic-table': <PeriodicTable onUseInCalculator={handleUseInCalculator} />,
    formulas: <FormulaBuilder isAdmin={isAdmin} />,
    calibration: <CalibrationCurveSection isAdmin={isAdmin} />,
    'standards-inventory': <StandardsInventory />,
    sop: <SOPSection />,
    indicators: <IndicatorsInventory isAdmin={isAdmin} />,
    'cv-percent': <CVPercentCalculator isAdmin={isAdmin} />,
    'data-sync': <DataSyncManager isAdmin={isAdmin} />,
    'feed-formulation': <FeedFormulation isAdmin={isAdmin} />,
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
        onSectionChange={handleSectionChange}
        customSections={customSections}
        onAddSection={() => setShowAddDialog(true)}
        isAdmin={isAdmin}
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
            {/* Admin mode toggle */}
            {isAdmin ? (
              <button
                onClick={logout}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title="Logout from Admin"
              >
                <Shield className="w-3 h-3" />
                {!isMobile && 'Admin'}
                <LogOut className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Admin Login"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAdmin && (
              <button
                onClick={() => setCloudMode(c => !c)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  cloudMode ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
                title={cloudMode ? 'Cloud sync ON — click to go offline' : 'Offline — click to enable cloud sync'}
              >
                {cloudMode ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
                {!isMobile && (cloudMode ? 'Cloud' : 'Local')}
              </button>
            )}
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

      {/* Admin Login Dialog */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowAdminLogin(false)}>
          <div className="bg-card border border-border rounded-lg p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Admin Login</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Enter admin password to enable editing, formula management, and AI Assistant.</p>
            <input
              type="password"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              placeholder="Enter password"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdminLogin}
                className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => { setShowAdminLogin(false); setAdminPassword(''); }}
                className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
