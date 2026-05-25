import { useState, lazy, Suspense, useEffect, useMemo } from 'react';
import { Sun, Moon, Shield, LogOut, Wifi, WifiOff, Cloud, CloudOff, Command } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAdminMode } from '@/hooks/useAdminMode';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AddSectionDialog } from '@/components/AddSectionDialog';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { CommandPalette, type PaletteCommand } from '@/components/CommandPalette';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

// Lazy-load every calculator section so the initial bundle stays small
// and the PWA installs fast. Each chunk loads on first navigation.
const MolarityCalculator = lazy(() => import('@/components/calculators/MolarityCalculator').then(m => ({ default: m.MolarityCalculator })));
const NormalityCalculator = lazy(() => import('@/components/calculators/NormalityCalculator').then(m => ({ default: m.NormalityCalculator })));
const FormalityCalculator = lazy(() => import('@/components/calculators/FormalityCalculator').then(m => ({ default: m.FormalityCalculator })));
const ConversionCalculator = lazy(() => import('@/components/calculators/ConversionCalculator').then(m => ({ default: m.ConversionCalculator })));
const SolutionPrepCalculator = lazy(() => import('@/components/calculators/SolutionPrepCalculator').then(m => ({ default: m.SolutionPrepCalculator })));
const DilutionCalculator = lazy(() => import('@/components/calculators/DilutionCalculator').then(m => ({ default: m.DilutionCalculator })));
const AnalyticalTestSection = lazy(() => import('@/components/calculators/AnalyticalTestSection').then(m => ({ default: m.AnalyticalTestSection })));
const ReportSection = lazy(() => import('@/components/calculators/ReportSection').then(m => ({ default: m.ReportSection })));
const StandardsSection = lazy(() => import('@/components/calculators/StandardsSection').then(m => ({ default: m.StandardsSection })));
const CustomCalculatorSection = lazy(() => import('@/components/calculators/CustomCalculatorSection').then(m => ({ default: m.CustomCalculatorSection })));
const ChemistryAssistant = lazy(() => import('@/components/calculators/ChemistryAssistant').then(m => ({ default: m.ChemistryAssistant })));
const InventoryManager = lazy(() => import('@/components/calculators/InventoryManager').then(m => ({ default: m.InventoryManager })));
const PeriodicTable = lazy(() => import('@/components/calculators/PeriodicTable').then(m => ({ default: m.PeriodicTable })));
const FormulaBuilder = lazy(() => import('@/components/calculators/FormulaBuilder').then(m => ({ default: m.FormulaBuilder })));
const CalibrationCurveSection = lazy(() => import('@/components/calculators/CalibrationCurveSection').then(m => ({ default: m.CalibrationCurveSection })));
const StandardsInventory = lazy(() => import('@/components/calculators/StandardsInventory').then(m => ({ default: m.StandardsInventory })));
const SOPSection = lazy(() => import('@/components/calculators/SOPSection').then(m => ({ default: m.SOPSection })));
const IndicatorsInventory = lazy(() => import('@/components/calculators/IndicatorsInventory').then(m => ({ default: m.IndicatorsInventory })));
const CVPercentCalculator = lazy(() => import('@/components/calculators/CVPercentCalculator').then(m => ({ default: m.CVPercentCalculator })));
const DataSyncManager = lazy(() => import('@/components/calculators/DataSyncManager').then(m => ({ default: m.DataSyncManager })));
const FeedFormulationTabs = lazy(() => import('@/components/calculators/FeedFormulationTabs').then(m => ({ default: m.FeedFormulationTabs })));
const CalculationSuite = lazy(() => import('@/components/calculators/CalculationSuite').then(m => ({ default: m.CalculationSuite })));

const SectionFallback = () => (
  <div className="flex items-center justify-center py-16 text-xs text-muted-foreground">
    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
    Loading…
  </div>
);

const Index = () => {
  const [activeSection, setActiveSection] = useState('solution');
  const [customSections, setCustomSections] = useState<{ id: string; name: string }[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [elementMw, setElementMw] = useState<number | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cloudMode, setCloudMode] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, login, logout } = useAdminMode();

  // Online/offline indicator
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Global Ctrl/Cmd-K to open command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    'calc-suite': 'Calculation Suite',
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
    'feed-formulation': <FeedFormulationTabs isAdmin={isAdmin} />,
    'calc-suite': <CalculationSuite />,
  };

  // Only mount the active section's component — lazy chunks load on demand
  // and inactive sections never run, cutting memory and CPU.
  const activeNode = sections[activeSection] ?? (
    customSections.find(s => s.id === activeSection)
      ? <CustomCalculatorSection name={customSections.find(s => s.id === activeSection)!.name} />
      : null
  );

  // Build command palette entries from the section titles.
  const paletteCommands: PaletteCommand[] = useMemo(() => {
    const base: PaletteCommand[] = Object.entries(sectionTitles).map(([id, label]) => ({
      id,
      label,
      hint: 'Section',
      action: () => handleSectionChange(id),
    }));
    const custom = customSections.map(s => ({
      id: s.id,
      label: s.name,
      hint: 'Custom section',
      action: () => handleSectionChange(s.id),
    }));
    const actions: PaletteCommand[] = [
      { id: 'toggle-theme', label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', hint: 'Action', action: toggleTheme },
      { id: 'admin', label: isAdmin ? 'Logout admin' : 'Login as admin', hint: 'Action', action: () => isAdmin ? logout() : setShowAdminLogin(true) },
      { id: 'add-section', label: 'Add custom section', hint: 'Action', action: () => setShowAddDialog(true) },
    ];
    return [...base, ...custom, ...actions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customSections, theme, isAdmin]);

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
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Command palette (Ctrl/Cmd-K)"
            >
              <Command className="w-3.5 h-3.5" />
              {!isMobile && <kbd className="text-[10px] font-mono">⌘K</kbd>}
            </button>
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

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className={`mx-auto ${
            activeSection === 'periodic-table' ? 'max-w-6xl' : 'max-w-4xl'
          } ${isMobile ? 'p-3' : 'p-6'}`}>
            <SectionErrorBoundary sectionName={sectionTitles[activeSection]}>
              <Suspense fallback={<SectionFallback />}>{activeNode}</Suspense>
            </SectionErrorBoundary>
          </div>
        </div>
      </main>

      <AddSectionDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={addCustomSection}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={paletteCommands}
      />

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
