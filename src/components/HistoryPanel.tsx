import { Pin, PinOff, Trash2, X, Download, Clock } from 'lucide-react';
import { useHistory, togglePinned, removeEntry, clearHistory } from '@/lib/calculationHistory';
import { exportCSV } from '@/lib/exportUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  onJump: (section: string) => void;
}

export function HistoryPanel({ open, onClose, onJump }: Props) {
  const list = useHistory();
  if (!open) return null;

  const pinned = list.filter(e => e.pinned);
  const recent = list.filter(e => !e.pinned).slice(0, 100);

  return (
    <div className="fixed inset-0 z-[55] flex justify-end bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="w-full max-w-md h-full glass-panel border-l border-border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Calculation History</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => exportCSV('calculation-history', list.map(e => ({
                date: new Date(e.at).toISOString(),
                section: e.sectionLabel,
                title: e.title,
                result: e.result,
                pinned: e.pinned ? 'yes' : 'no',
              })))}
              disabled={list.length === 0}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { if (confirm('Clear unpinned history?')) clearHistory(true); }}
              disabled={recent.length === 0}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30"
              title="Clear (keep pinned)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {list.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-muted-foreground">
              No calculations yet. Results from calculators will appear here.
            </div>
          )}

          {pinned.length > 0 && (
            <Section title="Pinned" entries={pinned} onJump={onJump} onClose={onClose} />
          )}
          {recent.length > 0 && (
            <Section title="Recent" entries={recent} onJump={onJump} onClose={onClose} />
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, entries, onJump, onClose }: { title: string; entries: ReturnType<typeof useHistory>; onJump: (s: string) => void; onClose: () => void }) {
  return (
    <div>
      <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-secondary/30">{title}</div>
      <ul className="divide-y divide-border">
        {entries.map(e => (
          <li key={e.id} className="px-4 py-3 hover:bg-secondary/40">
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => { onJump(e.section); onClose(); }}
                className="flex-1 min-w-0 text-left"
              >
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{e.sectionLabel}</div>
                <div className="text-xs text-foreground truncate">{e.title}</div>
                <div className="text-xs font-mono text-primary truncate mt-0.5">{e.result}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-1">{new Date(e.at).toLocaleString()}</div>
              </button>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => togglePinned(e.id)} className="p-1 rounded text-muted-foreground hover:text-primary" title={e.pinned ? 'Unpin' : 'Pin'}>
                  {e.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => removeEntry(e.id)} className="p-1 rounded text-muted-foreground hover:text-destructive" title="Remove">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
