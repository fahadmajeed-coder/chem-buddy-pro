import { useState } from 'react';
import { X } from 'lucide-react';

interface AddSectionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export function AddSectionDialog({ open, onClose, onAdd }: AddSectionDialogProps) {
  const [name, setName] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Add Custom Section</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-1.5 mb-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Section Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Titration Calculator"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Add Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
