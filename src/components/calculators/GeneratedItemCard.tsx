import { Check, X, FileText, Calculator, FlaskConical } from 'lucide-react';
import type { GeneratedItem } from '@/lib/aiChat';

interface GeneratedItemCardProps {
  item: GeneratedItem;
  onConfirm: () => void;
  onDismiss: () => void;
  confirmed?: boolean;
}

export function GeneratedItemCard({ item, onConfirm, onDismiss, confirmed }: GeneratedItemCardProps) {
  const data = item.data as Record<string, unknown>;

  const typeConfig = {
    generate_sop: {
      icon: FileText,
      label: 'SOP',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
    },
    generate_formula: {
      icon: Calculator,
      label: 'Formula',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
    generate_inventory_item: {
      icon: FlaskConical,
      label: 'Inventory Item',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
    },
  };

  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>
          {config.label}
        </span>
        {confirmed && (
          <span className="text-xs font-medium text-emerald-600 ml-auto">✓ Added</span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2 text-sm text-card-foreground">
        <h4 className="font-semibold text-foreground">{data.name as string}</h4>

        {item.type === 'generate_sop' && (
          <>
            <p className="text-xs text-muted-foreground">Category: {data.category as string}</p>
            {data.principle && <p className="text-xs line-clamp-2">{data.principle as string}</p>}
            <p className="text-xs text-muted-foreground">{(data.procedure as string[])?.length || 0} procedure steps</p>
            {data.apparatus && <p className="text-xs text-muted-foreground">Equipment: {(data.apparatus as string[]).slice(0, 3).join(', ')}{(data.apparatus as string[]).length > 3 ? '...' : ''}</p>}
          </>
        )}

        {item.type === 'generate_formula' && (
          <>
            <p className="text-xs text-muted-foreground">{data.description as string}</p>
            <code className="block text-xs bg-background/50 rounded px-2 py-1 font-mono">
              {data.expression as string}
            </code>
            <p className="text-xs text-muted-foreground">{(data.variables as unknown[])?.length || 0} variables</p>
          </>
        )}

        {item.type === 'generate_inventory_item' && (
          <>
            <p className="text-xs font-mono">{data.formula as string}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>MW: {data.molarMass as number} g/mol</span>
              {data.nFactor != null && <span>n-factor: {data.nFactor as number}</span>}
              {data.purity && <span>Purity: {data.purity as string}</span>}
              {data.density != null && <span>Density: {data.density as number} g/mL</span>}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {!confirmed && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Add to {config.label === 'SOP' ? 'SOPs' : config.label === 'Formula' ? 'Formulas' : 'Inventory'}
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
