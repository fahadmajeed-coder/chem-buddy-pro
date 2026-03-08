interface InputFieldProps {
  label: string;
  unit?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: 'number' | 'text';
}

export function InputField({ label, unit, value, onChange, placeholder, disabled, type = 'number' }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '0'}
          disabled={disabled}
          className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 transition-all"
        />
        {unit && (
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap min-w-[2rem]">{unit}</span>
        )}
      </div>
    </div>
  );
}
