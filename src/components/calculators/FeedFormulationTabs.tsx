import { useState } from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { FeedFormulation } from './FeedFormulation';
import { WinFeedSuite } from './WinFeedSuite';

export function FeedFormulationTabs({ isAdmin = false }: { isAdmin?: boolean }) {
  const [mode, setMode] = useState<'classic' | 'pro'>('pro');
  return (
    <div className="space-y-3">
      <div className="flex gap-1 glass-panel rounded-lg p-1 w-fit">
        <button onClick={() => setMode('pro')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'pro' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <Sparkles className="w-3.5 h-3.5" /> WinFeed Pro
        </button>
        <button onClick={() => setMode('classic')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
            mode === 'classic' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <Layers className="w-3.5 h-3.5" /> Classic Builder
        </button>
      </div>
      {mode === 'pro' ? <WinFeedSuite isAdmin={isAdmin} /> : <FeedFormulation isAdmin={isAdmin} />}
    </div>
  );
}
