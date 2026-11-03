import React from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

export type LucideIconType = LucideIcon;

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'info';

/** Solid, saturated fills — used for stickers, icon blocks, buttons */
const TONE_FILL: Record<Tone, string> = {
  neutral: 'bg-surface',
  good: 'bg-brand-500',
  warn: 'bg-sun-500',
  bad: 'bg-alert-500',
  info: 'bg-water-500',
};

/** Light tints — used for large blocks so text stays easy to read */
const TONE_TINT: Record<Tone, string> = {
  neutral: 'bg-surface',
  good: 'bg-brand-100',
  warn: 'bg-sun-100',
  bad: 'bg-alert-100',
  info: 'bg-water-100',
};

export const toneFill = (tone: Tone) => TONE_FILL[tone];
export const toneTint = (tone: Tone) => TONE_TINT[tone];
/** Bordered solid icon block */
export const toneSoft = (tone: Tone) => cn('border-2 border-ink text-ink', TONE_FILL[tone]);

/* ── Card ─────────────────────────────────────────────── */

export const Card: React.FC<React.HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'article'; tone?: Tone }> = ({
  as: Tag = 'section',
  tone = 'neutral',
  className,
  children,
  ...rest
}) => (
  <Tag className={cn('rounded-lg border-2 border-ink shadow-brutal', TONE_TINT[tone], className)} {...rest}>
    {children}
  </Tag>
);

interface CardHeaderProps {
  icon?: LucideIcon;
  tone?: Tone;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ icon: Icon, tone = 'good', title, description, action, className }) => (
  <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-md', toneSoft(tone))}>
          <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-ink leading-snug">{title}</h2>
        {description && <p className="mt-0.5 text-[15px] text-muted leading-relaxed">{description}</p>}
      </div>
    </div>
    {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
  </div>
);

/* ── Headings ─────────────────────────────────────────── */

export const PageHeader: React.FC<{ title: string; description?: React.ReactNode; action?: React.ReactNode }> = ({
  title,
  description,
  action,
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-ink">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-base text-muted leading-relaxed">{description}</p>}
    </div>
    {action}
  </div>
);

export const SectionTitle: React.FC<{ id?: string; children: React.ReactNode; action?: React.ReactNode }> = ({ id, children, action }) => (
  <div className="flex items-end justify-between gap-3">
    <h2 id={id} className="font-display text-xl uppercase tracking-tight text-ink">{children}</h2>
    {action}
  </div>
);

/* ── Badge / sticker ──────────────────────────────────── */

export const Badge: React.FC<{ tone?: Tone; dot?: boolean; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  dot = false,
  children,
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-md border-2 border-ink px-2 py-0.5 text-xs font-bold text-ink whitespace-nowrap',
      TONE_FILL[tone],
      className,
    )}
  >
    {dot && <span className="h-2 w-2 rounded-full border border-ink bg-surface" />}
    {children}
  </span>
);

/* ── Button ───────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-ink border-2 border-ink shadow-brutal press',
  secondary: 'bg-surface text-ink border-2 border-ink shadow-brutal press',
  danger: 'bg-alert-500 text-ink border-2 border-ink shadow-brutal press',
  ghost: 'text-ink border-2 border-transparent hover:border-ink hover:bg-surface',
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; icon?: LucideIcon }
> = ({ variant = 'primary', size = 'md', icon: Icon, className, children, ...rest }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-md font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
      size === 'sm' && 'h-9 px-3 text-sm',
      size === 'md' && 'h-11 px-4 text-[15px]',
      size === 'lg' && 'h-13 px-6 text-base',
      BUTTON_VARIANTS[variant],
      className,
    )}
    {...rest}
  >
    {Icon && <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'} strokeWidth={2.5} aria-hidden="true" />}
    {children}
  </button>
);

/* ── Stat tile ────────────────────────────────────────── */

interface StatProps {
  icon?: LucideIcon;
  tone?: Tone;
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  className?: string;
}

export const Stat: React.FC<StatProps> = ({ icon: Icon, tone = 'neutral', label, value, unit, hint, className }) => (
  <div className={cn('rounded-lg border-2 border-ink p-4 shadow-brutal', TONE_TINT[tone], className)}>
    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink">
      {Icon && <Icon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />}
      <span>{label}</span>
    </div>
    <div className="mt-2 flex items-baseline gap-1">
      <span className="font-display text-3xl tracking-tight text-ink tabular-nums">{value}</span>
      {unit && <span className="text-base font-bold text-ink">{unit}</span>}
    </div>
    {hint && <p className="mt-1 text-sm leading-snug text-muted">{hint}</p>}
  </div>
);

/* ── Key/value row (for technical details) ────────────── */

export const DataRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-4 py-2 text-sm border-b border-dashed border-ink/40 last:border-0">
    <dt className="text-muted">{label}</dt>
    <dd className="font-bold text-ink text-right tabular-nums break-all">{value}</dd>
  </div>
);

/* ── Collapsible "technical details" ──────────────────── */

export const Disclosure: React.FC<{ summary: string; children: React.ReactNode; defaultOpen?: boolean; className?: string }> = ({
  summary,
  children,
  defaultOpen = false,
  className,
}) => (
  <details open={defaultOpen} className={cn('group rounded-lg border-2 border-ink bg-surface shadow-brutal', className)}>
    <summary className="flex cursor-pointer select-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-bold text-ink">
      {summary}
      <span className="grid h-7 w-7 place-items-center rounded-md border-2 border-ink bg-sun-500 transition-transform group-open:rotate-180">
        <ChevronDown className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      </span>
    </summary>
    <div className="border-t-2 border-ink px-5 py-4">{children}</div>
  </details>
);

/* ── Scale meter (e.g. crop greenness 0–1) ────────────── */

interface MeterProps {
  value: number;
  min?: number;
  max?: number;
  /** Labels shown under the bar, left to right */
  labels?: string[];
  tone?: Tone;
}

export const Meter: React.FC<MeterProps> = ({ value, min = 0, max = 1, labels, tone = 'good' }) => {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div>
      <div
        className="h-5 w-full overflow-hidden rounded-md border-2 border-ink bg-surface"
        role="meter"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div className={cn('h-full border-r-2 border-ink transition-all duration-500', TONE_FILL[tone])} style={{ width: `${pct}%` }} />
      </div>
      {labels && (
        <div className="mt-1.5 flex justify-between text-xs font-bold uppercase tracking-wide text-muted">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Segmented control ────────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap overflow-hidden rounded-md border-2 border-ink bg-surface">
      {options.map((o, i) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-bold transition-colors cursor-pointer',
            i > 0 && 'border-l-2 border-ink',
            value === o.value ? 'bg-sun-500 text-ink' : 'text-ink hover:bg-sunken',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Formatting helpers ───────────────────────────────── */

export const fmt = (n: number | null | undefined, digits = 1): string =>
  n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits });
