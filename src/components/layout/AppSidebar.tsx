import { useState, useRef, useEffect } from 'react';
import { Beaker, FlaskConical, ArrowRightLeft, TestTubes, FileText, Shield, Plus, Menu, X, Atom, Sparkles, Package, Grid3X3, Droplets, FunctionSquare, TrendingUp, ClipboardList, GripVertical, BookOpen, Palette, Percent, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'molarity', label: 'Molarity (M)', icon: <Beaker className="w-4 h-4" /> },
  { id: 'normality', label: 'Normality (N)', icon: <FlaskConical className="w-4 h-4" /> },
  { id: 'formality', label: 'Formality (F)', icon: <TestTubes className="w-4 h-4" /> },
  { id: 'conversion', label: 'Conversions', icon: <ArrowRightLeft className="w-4 h-4" /> },
  { id: 'solution', label: 'Solution Prep', icon: <FlaskConical className="w-4 h-4" /> },
  { id: 'dilution', label: 'Dilution (C₁V₁)', icon: <Droplets className="w-4 h-4" /> },
  { id: 'analytical', label: 'Analytical Test', icon: <TestTubes className="w-4 h-4" /> },
  { id: 'report', label: 'Reports & COA', icon: <FileText className="w-4 h-4" /> },
  { id: 'standards', label: 'Standards', icon: <Shield className="w-4 h-4" /> },
  { id: 'assistant', label: 'AI Assistant', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
  { id: 'periodic-table', label: 'Periodic Table', icon: <Grid3X3 className="w-4 h-4" /> },
  { id: 'formulas', label: 'Formulas', icon: <FunctionSquare className="w-4 h-4" /> },
  { id: 'calibration', label: 'Calibration Curve', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'standards-inventory', label: 'Std. Inventory', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'sop', label: 'SOPs', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'indicators', label: 'Indicators', icon: <Palette className="w-4 h-4" /> },
  { id: 'cv-percent', label: 'CV%', icon: <Percent className="w-4 h-4" /> },
  { id: 'data-sync', label: 'Data Transfer', icon: <RefreshCw className="w-4 h-4" /> },
];

const ICON_MAP: Record<string, React.ReactNode> = {};
DEFAULT_NAV_ITEMS.forEach(i => { ICON_MAP[i.id] = i.icon; });
const LABEL_MAP: Record<string, string> = {};
DEFAULT_NAV_ITEMS.forEach(i => { LABEL_MAP[i.id] = i.label; });

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
  customSections: { id: string; name: string }[];
  onAddSection: () => void;
  isAdmin?: boolean;
}

export function AppSidebar({ activeSection, onSectionChange, customSections, onAddSection, isAdmin = false }: AppSidebarProps) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [order, setOrder] = useLocalStorage<string[]>('chemanalyst-sidebar-order', DEFAULT_NAV_ITEMS.map(i => i.id));
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Close mobile menu on section change
  const handleSectionChange = (id: string) => {
    onSectionChange(id);
    if (isMobile) setMobileOpen(false);
  };

  // Close mobile menu on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Ensure all default items are in order
  const allIds = DEFAULT_NAV_ITEMS.map(i => i.id);
  const orderedIds = [
    ...order.filter(id => allIds.includes(id)),
    ...allIds.filter(id => !order.includes(id)),
  ];

  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; setDragOverIdx(idx); };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newOrder = [...orderedIds];
      const [removed] = newOrder.splice(dragItem.current, 1);
      newOrder.splice(dragOverItem.current, 0, removed);
      setOrder(newOrder);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragOverIdx(null);
  };

  // Mobile: hamburger button is rendered by parent (Index.tsx)
  // This component exposes toggle via mobileOpen state

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground hover:text-sidebar-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)} className="text-sidebar-foreground hover:text-sidebar-primary transition-colors">
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        )}
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-2">
            <Atom className="w-6 h-6 text-primary" />
            <span className="font-semibold text-foreground text-sm tracking-wide">ChemAnalyst</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between px-3 py-2">
          <span className={`${collapsed && !isMobile ? 'hidden' : ''} text-[10px] font-semibold uppercase tracking-widest text-muted-foreground`}>
            Calculators
          </span>
        </div>
        {orderedIds.map((id, idx) => (
          <div
            key={id}
            draggable={!isMobile}
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`${dragOverIdx === idx ? 'border-t-2 border-primary' : 'border-t-2 border-transparent'} flex items-center`}
          >
            <button
              onClick={() => handleSectionChange(id)}
              className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-all duration-200
                ${activeSection === id
                  ? 'bg-sidebar-accent text-sidebar-primary glow-border'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              title={collapsed && !isMobile ? LABEL_MAP[id] : undefined}
            >
              {!collapsed && !isMobile && <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0 cursor-grab" />}
              {ICON_MAP[id]}
              {(!collapsed || isMobile) && (
                <span className="flex items-center gap-1">
                  {LABEL_MAP[id]}
                  {id === 'assistant' && !isAdmin && <span className="text-[9px] text-muted-foreground">🔒</span>}
                </span>
              )}
            </button>
            {isMobile && (
              <div className="flex flex-col mr-1">
                <button
                  onClick={(e) => { e.stopPropagation(); if (idx > 0) { const n = [...orderedIds]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; setOrder(n); } }}
                  disabled={idx === 0}
                  className="p-0.5 text-muted-foreground/40 hover:text-primary disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (idx < orderedIds.length - 1) { const n = [...orderedIds]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; setOrder(n); } }}
                  disabled={idx === orderedIds.length - 1}
                  className="p-0.5 text-muted-foreground/40 hover:text-primary disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}

        {customSections.length > 0 && (
          <>
            <div className={`${collapsed && !isMobile ? 'hidden' : ''} px-3 py-2 mt-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground`}>
              Custom
            </div>
            {customSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200
                  ${activeSection === section.id
                    ? 'bg-sidebar-accent text-sidebar-primary glow-border'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
              >
                <Beaker className="w-4 h-4" />
                {(!collapsed || isMobile) && <span>{section.name}</span>}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Add Section */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={onAddSection}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-all"
        >
          <Plus className="w-4 h-4" />
          {(!collapsed || isMobile) && <span>Add Section</span>}
        </button>
      </div>
    </>
  );

  // Mobile: slide-over drawer
  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-card border border-border text-foreground shadow-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Drawer */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  // Desktop: fixed sidebar
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 shrink-0`}>
      {sidebarContent}
    </aside>
  );
}
