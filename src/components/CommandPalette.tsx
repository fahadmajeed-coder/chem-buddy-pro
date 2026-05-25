import { useEffect, useMemo, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';

export interface PaletteCommand {
  id: string;
  label: string;
  hint?: string;
  action: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
}

export function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 30);
    return commands
      .filter((c) => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q))
      .slice(0, 30);
  }, [commands, query]);

  if (!open) return null;

  const run = (cmd?: PaletteCommand) => {
    if (!cmd) return;
    cmd.action();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-background/70 backdrop-blur-sm pt-[12vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg glass-panel rounded-xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                run(filtered[active]);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Jump to section, calculator, or compound…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
            Esc
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No matches</div>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(c)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  i === active ? 'bg-primary/10 text-foreground' : 'text-foreground/90 hover:bg-secondary/50'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate">{c.label}</div>
                  {c.hint && (
                    <div className="text-[11px] text-muted-foreground truncate">{c.hint}</div>
                  )}
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span>↑↓ navigate · ↵ select</span>
          <span>⌘K / Ctrl-K</span>
        </div>
      </div>
    </div>
  );
}
