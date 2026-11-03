import React from 'react';
import { Link } from 'react-router-dom';
import { CloudSun, Cpu, Droplets, House, Leaf, LucideIcon, Map, MessageCircle, Sprout } from 'lucide-react';
import { cn } from './ui';

export type SectionId = 'today' | 'watering' | 'weather' | 'map' | 'sensors' | 'plant-check';

export const SECTIONS: { id: SectionId; label: string; shortLabel: string; icon: LucideIcon; description: string }[] = [
  { id: 'today', label: 'Today', shortLabel: 'Today', icon: House, description: 'What needs your attention' },
  { id: 'watering', label: 'Watering plan', shortLabel: 'Water', icon: Droplets, description: 'When and how much to water' },
  { id: 'weather', label: 'Weather', shortLabel: 'Weather', icon: CloudSun, description: 'Forecast for your farm' },
  { id: 'map', label: 'Field map', shortLabel: 'Map', icon: Map, description: 'Satellite view of crop health' },
  { id: 'sensors', label: 'Field sensors', shortLabel: 'Sensors', icon: Cpu, description: 'Your on-farm device' },
  { id: 'plant-check', label: 'Plant check', shortLabel: 'Plants', icon: Leaf, description: 'Check a leaf photo for disease' },
];

export const isSectionId = (v: string | undefined): v is SectionId => SECTIONS.some((s) => s.id === v);

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <Link to="/" className={cn('inline-flex items-center gap-2.5 text-ink', className)} aria-label="AgriStack home">
    <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-md border-2 border-ink bg-brand-500 shadow-brutal-sm">
      <Sprout className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
    </span>
    <span className="font-display text-lg uppercase tracking-tight">AgriStack</span>
  </Link>
);

interface NavProps {
  active: SectionId;
}

export const SideNav: React.FC<NavProps & { farmName: string; farmMeta: string; onAsk: () => void }> = ({
  active,
  farmName,
  farmMeta,
  onAsk,
}) => (
  <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r-2 border-ink bg-surface">
    <div className="flex h-16 items-center border-b-2 border-ink px-5">
      <Logo />
    </div>

    <nav aria-label="Dashboard sections" className="flex-1 px-3 pt-4 space-y-1.5">
      {SECTIONS.map((s) => {
        const isActive = s.id === active;
        return (
          <Link
            key={s.id}
            to={`/dashboard/${s.id}`}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md border-2 px-3 py-2.5 text-[15px] font-bold transition-colors',
              isActive ? 'border-ink bg-sun-500 text-ink shadow-brutal-sm' : 'border-transparent text-ink hover:border-ink hover:bg-canvas',
            )}
          >
            <s.icon className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            {s.label}
          </Link>
        );
      })}
    </nav>

    <div className="p-4 space-y-3">
      <button
        onClick={onAsk}
        className="press w-full flex items-center gap-3 rounded-md border-2 border-ink bg-brand-500 px-4 py-3 text-left text-ink shadow-brutal cursor-pointer"
      >
        <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        <span>
          <span className="block text-[15px] font-bold">Ask AgriStack</span>
          <span className="block text-xs font-medium">English or தமிழ்</span>
        </span>
      </button>
      <div className="rounded-md border-2 border-dashed border-ink px-4 py-3">
        <div className="text-sm font-bold text-ink truncate">{farmName}</div>
        <div className="text-xs text-muted truncate">{farmMeta}</div>
      </div>
    </div>
  </aside>
);

export const BottomNav: React.FC<NavProps> = ({ active }) => (
  <nav
    aria-label="Dashboard sections"
    className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t-2 border-ink bg-surface pb-[env(safe-area-inset-bottom)]"
  >
    <div className="grid grid-cols-6">
      {SECTIONS.map((s) => {
        const isActive = s.id === active;
        return (
          <Link
            key={s.id}
            to={`/dashboard/${s.id}`}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-col items-center gap-1 py-2 text-[11px] font-bold text-ink"
          >
            <span
              className={cn(
                'grid h-8 w-11 place-items-center rounded-md border-2 transition-colors',
                isActive ? 'border-ink bg-sun-500 shadow-brutal-sm' : 'border-transparent',
              )}
            >
              <s.icon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
            </span>
            {s.shortLabel}
          </Link>
        );
      })}
    </div>
  </nav>
);
