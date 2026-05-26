import { X } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: 'Ctrl/⌘ + K', desc: 'Open command palette' },
  { keys: 'Ctrl/⌘ + H', desc: 'Open calculation history' },
  { keys: 'Ctrl/⌘ + /', desc: 'Toggle this shortcuts panel' },
  { keys: 'Ctrl/⌘ + L', desc: 'Toggle light / dark theme' },
  { keys: 'Esc', desc: 'Close dialogs and panels' },
  { keys: '↑ / ↓', desc: 'Navigate command palette' },
  { keys: '↵', desc: 'Confirm selection' },
];

export function ShortcutsHelp({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel border border-border rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </header>
        <ul className="p-4 space-y-2">
          {SHORTCUTS.map(s => (
            <li key={s.keys} className="flex items-center justify-between text-xs">
              <span className="text-foreground/90">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono text-[10px]">{s.keys}</kbd>
            </li>
          ))}
        </ul>
        <footer className="px-4 py-2 border-t border-border text-[10px] text-muted-foreground text-center">
          Tip: press Ctrl/⌘+K then start typing to jump anywhere.
        </footer>
      </div>
    </div>
  );
}
