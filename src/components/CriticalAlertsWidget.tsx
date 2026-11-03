import React, { useState } from 'react';
import { Bell, Flame, ThermometerSun, X } from 'lucide-react';
import { Badge, Card, cn, LucideIconType, Tone, toneFill } from './ui';

interface AlertItem {
  id: string;
  icon: LucideIconType;
  tone: Tone;
  title: string;
  detail: string;
  action: string;
  time: string;
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'ALT-101',
    icon: Flame,
    tone: 'bad',
    title: 'Gas level a little high near sensor 1',
    detail: 'Methane reached 2.1 ppm (safe limit is 2.0 ppm).',
    action: 'Check for rotting crop waste or standing water near the sensor.',
    time: '10 min ago',
  },
  {
    id: 'ALT-102',
    icon: ThermometerSun,
    tone: 'warn',
    title: 'Very hot in orchard block 4',
    detail: 'Temperature reached 38.4°C.',
    action: 'Avoid spraying until evening. Young plants may need shade or extra water.',
    time: '45 min ago',
  },
];

export const FarmAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  return (
    <section aria-labelledby="alerts-heading" className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 id="alerts-heading" className="font-display text-xl uppercase tracking-tight text-ink">Alerts</h2>
        {alerts.length > 0 && <Badge tone="bad">{alerts.length} new</Badge>}
      </div>

      {alerts.length === 0 ? (
        <Card className="flex items-center gap-3 p-5 text-[15px] font-medium">
          <Bell className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          All clear. We'll let you know if anything needs attention.
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((a) => (
            <Card as="article" key={a.id} className="flex overflow-hidden bg-surface">
              <div className={cn('flex w-14 shrink-0 items-start justify-center border-r-2 border-ink pt-5', toneFill(a.tone))}>
                <a.icon className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold leading-snug text-ink">{a.title}</h3>
                    <p className="text-[15px] text-muted">
                      {a.detail} <span className="whitespace-nowrap">· {a.time}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-ink bg-surface hover:bg-sunken cursor-pointer"
                    aria-label={`Dismiss alert: ${a.title}`}
                  >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
                <p className="mt-3 rounded-md border-2 border-dashed border-ink px-3 py-2 text-[15px] text-ink">
                  <span className="font-bold">What to do: </span>
                  {a.action}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};
