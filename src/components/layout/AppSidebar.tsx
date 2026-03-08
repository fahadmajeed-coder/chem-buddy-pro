import { useState } from 'react';
import { Beaker, FlaskConical, ArrowRightLeft, TestTubes, FileText, Shield, Plus, Menu, X, Atom, Sparkles, Package, Grid3X3, Droplets, FunctionSquare } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
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
];

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
  customSections: { id: string; name: string }[];
  onAddSection: () => void;
}

export function AppSidebar({ activeSection, onSectionChange, customSections, onAddSection }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 shrink-0`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <button onClick={() => setCollapsed(!collapsed)} className="text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Atom className="w-6 h-6 text-primary" />
            <span className="font-semibold text-foreground text-sm tracking-wide">ChemAnalyst</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <div className={`${collapsed ? 'hidden' : ''} px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground`}>
          Calculators
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200
              ${activeSection === item.id
                ? 'bg-sidebar-accent text-sidebar-primary glow-border'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}

        {customSections.length > 0 && (
          <>
            <div className={`${collapsed ? 'hidden' : ''} px-3 py-2 mt-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground`}>
              Custom
            </div>
            {customSections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200
                  ${activeSection === section.id
                    ? 'bg-sidebar-accent text-sidebar-primary glow-border'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
              >
                <Beaker className="w-4 h-4" />
                {!collapsed && <span>{section.name}</span>}
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
          {!collapsed && <span>Add Section</span>}
        </button>
      </div>
    </aside>
  );
}
