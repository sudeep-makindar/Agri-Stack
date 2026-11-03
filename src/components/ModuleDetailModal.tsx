import React, { useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { EcosystemModule } from '../types';
import { ModuleIcon } from './ModuleIcon';
import { Button } from './ui';

interface ModuleDetailModalProps {
  module: EcosystemModule | null;
  onClose: () => void;
  onOpenDashboard: () => void;
}

export const ModuleDetailModal: React.FC<ModuleDetailModalProps> = ({ module, onClose, onOpenDashboard }) => {
  useEffect(() => {
    if (!module) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [module, onClose]);

  if (!module) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="module-title"
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-xl border-2 border-ink bg-surface p-6 sm:p-7 shadow-brutal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <ModuleIcon type={module.iconType} />
            <div>
              <div className="text-sm font-medium text-muted">{module.subtitle}</div>
              <h2 id="module-title" className="font-display text-2xl uppercase text-ink leading-tight">{module.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-ink border-2 border-ink bg-surface hover:bg-sun-500 cursor-pointer" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 text-[15px] leading-relaxed text-muted">{module.description}</p>

        {module.recommendation && (
          <div className="mt-5 rounded-lg border-2 border-ink bg-brand-500 p-4 shadow-brutal-sm">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
              Example advice
            </div>
            <p className="mt-1 text-[15px] leading-relaxed text-ink">{module.recommendation}</p>
          </div>
        )}

        {module.stats && (
          <dl className="mt-5 grid grid-cols-2 gap-3">
            {module.stats.map((stat) => (
              <div key={stat.label} className="rounded-md border-2 border-ink bg-canvas px-4 py-3">
                <dt className="text-sm text-muted">{stat.label}</dt>
                <dd className="mt-0.5 text-[15px] font-bold text-ink">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {module.details && <p className="mt-5 text-[15px] leading-relaxed text-muted">{module.details}</p>}

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={onOpenDashboard}>Open my farm</Button>
        </div>
      </div>
    </div>
  );
};
