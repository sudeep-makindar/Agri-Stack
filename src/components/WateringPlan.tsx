import React from 'react';
import { CalendarDays, CloudRain, Droplets, PiggyBank, Sprout } from 'lucide-react';
import { ForecastItem } from '../services/api';
import { describeDecision, getSchedule, ScheduleSlot, summarizeSchedule } from '../utils/irrigation';
import { Badge, Card, CardHeader, cn, Disclosure, fmt, Meter, PageHeader, Stat, Tone } from './ui';

interface WateringPlanProps {
  currentMoisturePct?: number;
  forecast7day?: ForecastItem[];
  stressStatus?: string;
}

function stressInfo(status?: string): { label: string; tone: Tone } | null {
  if (!status) return null;
  const s = status.toUpperCase();
  if (s.includes('STRESS') || s.includes('DRY')) return { label: 'Crops are thirsty', tone: 'bad' };
  if (s.includes('HIGH') || s.includes('WET')) return { label: 'Soil is very wet', tone: 'info' };
  return { label: 'Water level is fine', tone: 'good' };
}

const DECISION_STYLE: Record<ScheduleSlot['decision'], { icon: typeof Droplets; tone: Tone; badge: string }> = {
  WATER: { icon: Droplets, tone: 'info', badge: 'Water' },
  LIGHT: { icon: Droplets, tone: 'info', badge: 'Light water' },
  SKIP_RAIN: { icon: CloudRain, tone: 'good', badge: 'Rain expected' },
  SKIP_WET: { icon: Sprout, tone: 'good', badge: 'Soil is moist' },
};

export const WateringPlan: React.FC<WateringPlanProps> = ({ currentMoisturePct, forecast7day, stressStatus }) => {
  const { schedule, isLive } = getSchedule(forecast7day, currentMoisturePct);
  const moisture = currentMoisturePct ?? 32.4;
  const summary = summarizeSchedule(schedule);
  const maxLiters = Math.max(...schedule.map((s) => s.waterLiters), 1);
  const today = schedule[0];
  const todayPlan = describeDecision(today);
  const stress = stressInfo(stressStatus);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Watering plan"
        description="We look at the soil moisture, the weather forecast and how fast your crop is drying out, then tell you when to water and when to save it."
        action={!isLive ? <Badge tone="warn">Sample plan</Badge> : undefined}
      />

      {/* Today hero */}
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[1.3fr_1fr]">
          <div className="p-6 sm:p-7">
            <span className="inline-block -rotate-2 rounded-md border-2 border-ink bg-water-500 px-2.5 py-0.5 text-sm font-bold">Today</span>
            <div className="mt-3 font-display text-4xl sm:text-5xl uppercase leading-[0.95] tracking-tight text-ink">{todayPlan.title}</div>
            {today.startTime && (
              <div className="mt-1 text-lg text-muted">
                Start at {today.startTime} · about <span className="font-bold text-ink">{fmt(today.waterLiters, 0)} litres</span>
              </div>
            )}
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{todayPlan.reason}</p>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">Early morning watering loses less water to the sun.</p>
          </div>
          <div className="border-t-2 md:border-t-0 md:border-l-2 border-ink bg-water-100 p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-ink">Soil moisture now</span>
              {stress && <Badge tone={stress.tone} dot>{stress.label}</Badge>}
            </div>
            <div className="font-display text-5xl tracking-tight text-ink tabular-nums">
              {fmt(moisture)}<span className="text-xl text-muted">%</span>
            </div>
            <Meter value={moisture} min={0} max={70} tone="info" labels={['Dry', 'Just right', 'Wet']} />
            <p className="text-sm text-muted">Most crops do best between 30% and 50%.</p>
          </div>
        </div>
      </Card>

      {/* Week summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat icon={Droplets} tone="info" label="Water needed this week" value={fmt(summary.totalWater, 0)} unit="litres" />
        <Stat icon={CalendarDays} tone="neutral" label="Days to water" value={`${summary.wateringDays} of 7`} hint={`${summary.skippedDays} days you can skip`} />
        <Stat
          icon={PiggyBank}
          tone="good"
          label="Water saved"
          value={`${summary.savedPct}%`}
          hint={`About ${fmt(summary.savedLiters, 0)} L less than watering every day`}
        />
      </div>

      {/* Day by day */}
      <Card className="p-5 sm:p-6">
        <CardHeader icon={CalendarDays} tone="info" title="Next 7 days" description="Updated automatically when the forecast changes." />
        <ol className="mt-5 divide-y-2 divide-ink border-t-2 border-ink">
          {schedule.map((slot, i) => {
            const style = DECISION_STYLE[slot.decision];
            const plan = describeDecision(slot);
            const Icon = style.icon;
            return (
              <li key={i} className="grid grid-cols-[auto_1fr] sm:grid-cols-[7rem_1fr_12rem] items-center gap-x-4 gap-y-2 py-4">
                <div className="flex items-center gap-3 sm:block">
                  <div className={cn('text-[15px] font-bold', i === 0 ? 'text-ink underline decoration-water-500 decoration-4 underline-offset-4' : 'text-ink')}>{slot.day}</div>
                </div>
                <div className="min-w-0 col-span-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Icon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                    <span className="text-[15px] font-bold text-ink">{plan.title}</span>
                    {slot.startTime && <span className="text-sm text-muted">at {slot.startTime}</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{plan.reason}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  {slot.waterLiters > 0 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Water</span>
                        <span className="font-bold text-ink tabular-nums">{fmt(slot.waterLiters, 0)} L</span>
                      </div>
                      <div className="h-4 rounded-sm border-2 border-ink bg-surface overflow-hidden">
                        <div className="h-full border-r-2 border-ink bg-water-500" style={{ width: `${(slot.waterLiters / maxLiters) * 100}%` }} />
                      </div>
                    </div>
                  ) : (
                    <Badge tone={style.tone}>{style.badge}</Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <Disclosure summary="How we decide">
        <ul className="space-y-2 text-[15px] text-muted leading-relaxed list-disc pl-5">
          <li><span className="text-ink font-medium">Rain coming?</span> If there's more than a 70% chance of rain, or more than 8 mm expected, we skip watering.</li>
          <li><span className="text-ink font-medium">Soil already wet?</span> If the soil will be above 55% moisture, we skip watering.</li>
          <li><span className="text-ink font-medium">How much?</span> We estimate how much water the crop loses each day from heat, sun and wind (called <em>evapotranspiration</em>), and replace it.</li>
        </ul>
        <dl className="mt-4">
          <div className="text-sm font-bold text-ink mb-1">Daily water loss forecast</div>
          {schedule.map((s, i) => (
            <div key={i} className="flex justify-between py-1.5 text-sm border-b border-ink last:border-0">
              <dt className="text-muted">{s.day}</dt>
              <dd className="text-ink tabular-nums">{s.et0Mm} mm · rain {s.rainProbPct}% / {s.rainForecastMm} mm</dd>
            </div>
          ))}
        </dl>
      </Disclosure>
    </div>
  );
};
