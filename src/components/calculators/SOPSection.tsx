import { useState } from 'react';
import { Search, BookOpen, FlaskConical, Beaker, ChevronDown, ChevronRight } from 'lucide-react';
import { SOP_DATA, type SOPEntry } from '@/lib/sopData';

export function SOPSection() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [...new Set(SOP_DATA.map(s => s.category))];

  const filtered = SOP_DATA.filter(sop =>
    sop.name.toLowerCase().includes(search.toLowerCase()) ||
    sop.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search SOPs by test name or category..."
          className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {filtered.length} SOPs found</span>
        <span className="flex items-center gap-1"><FlaskConical className="w-3.5 h-3.5" /> {categories.length} categories</span>
      </div>

      {/* Results grouped by category */}
      {categories.map(cat => {
        const catSOPs = filtered.filter(s => s.category === cat);
        if (catSOPs.length === 0) return null;
        return (
          <div key={cat} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-primary flex items-center gap-2">
              <Beaker className="w-3.5 h-3.5" />
              {cat}
            </h3>
            <div className="space-y-1">
              {catSOPs.map(sop => (
                <SOPCard key={sop.id} sop={sop} expanded={expandedId === sop.id} onToggle={() => toggle(sop.id)} />
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No SOPs found for "{search}"</p>
        </div>
      )}
    </div>
  );
}

function SOPCard({ sop, expanded, onToggle }: { sop: SOPEntry; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors">
        {expanded ? <ChevronDown className="w-4 h-4 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <span className="text-sm font-medium text-foreground flex-1">{sop.name}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{sop.category}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          {sop.principle && (
            <Section title="Principle">
              <p className="text-sm text-muted-foreground leading-relaxed">{sop.principle}</p>
            </Section>
          )}

          {sop.apparatus && sop.apparatus.length > 0 && (
            <Section title="Apparatus">
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {sop.apparatus.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </Section>
          )}

          {sop.reagents && sop.reagents.length > 0 && (
            <Section title="Reagents">
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {sop.reagents.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </Section>
          )}

          {sop.reagentPreparation && sop.reagentPreparation.length > 0 && (
            <Section title="Reagent Preparation">
              {sop.reagentPreparation.map((rp, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs font-semibold text-foreground mb-1">{rp.name}</p>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-0.5 pl-2">
                    {rp.steps.map((s, j) => <li key={j}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </Section>
          )}

          <Section title="Procedure">
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              {sop.procedure.map((step, i) => <li key={i} className="leading-relaxed">{step}</li>)}
            </ol>
          </Section>

          {sop.calculations && (
            <Section title="Calculations">
              <pre className="text-sm text-foreground font-mono bg-muted/50 rounded-md p-3 whitespace-pre-wrap">{sop.calculations}</pre>
            </Section>
          )}

          {sop.resultInterpretation && (
            <Section title="Result Interpretation">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{sop.resultInterpretation}</pre>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-1.5">{title}</h4>
      {children}
    </div>
  );
}
