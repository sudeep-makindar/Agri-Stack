import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { BackendFarmSummary } from '../services/api';
import { cropHealthFromNdvi, soilPhLabel } from '../utils/agronomy';
import { describeDecision, getSchedule } from '../utils/irrigation';
import { greeting, windBearing } from '../utils/weather';
import { FarmAlerts } from './CriticalAlertsWidget';
import { FarmRoverModule } from './FarmRoverModule';
import { Badge, fmt, SectionTitle } from './ui';

interface TodayOverviewProps {
  data: BackendFarmSummary | null;
  farmerName: string;
  onAsk: () => void;
}

/** One cell of the "conditions" grid */
const Reading: React.FC<{ label: string; value: string; unit?: string; hint: string }> = ({ label, value, unit, hint }) => (
  <div className="p-4 sm:p-5">
    <div className="text-xs font-bold uppercase tracking-wider text-muted">{label}</div>
    <div className="mt-1 flex items-baseline gap-1">
      <span className="font-display text-3xl tracking-tight tabular-nums">{value}</span>
      {unit && <span className="text-base font-bold">{unit}</span>}
    </div>
    <p className="mt-1 text-sm leading-snug text-muted">{hint}</p>
  </div>
);

export const TodayOverview: React.FC<TodayOverviewProps> = ({ data, farmerName, onAsk }) => {
  const w = data?.weather;
  const soil = data?.soil;

  const { schedule } = getSchedule(w?.forecast_7day, data?.irrigation.current_moisture_pct);
  const today = schedule[0];
  const todayPlan = describeDecision(today);
  const needsWater = today.durationMinutes > 0;
  const nextRainDay = schedule.find((s) => s.decision === 'SKIP_RAIN');

  const ndvi = data?.satellite?.vegetation_indices?.NDVI ?? 0.72;
  const health = cropHealthFromNdvi(ndvi);

  const ph = soil?.ph ?? 6.8;
  const phInfo = soilPhLabel(ph);
  const dosing = soil?.dosing_recommendation || 'Apply 25 kg/ha urea with organic compost at the next growth stage.';

  const firstName = farmerName.split(' ')[0];
  const dateText = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <span className="inline-block -rotate-2 rounded-md border-2 border-ink bg-sun-500 px-2.5 py-0.5 text-sm font-bold shadow-brutal-sm">
          {dateText}
        </span>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl tracking-tight text-ink">
          {greeting()}, {firstName}.
        </h1>
        <p className="mt-2 text-lg text-muted">
          Here's what to do on {data?.farm.name ?? 'your farm'} today.
        </p>
      </div>

      {/* The three answers: water (big), crops, soil */}
      <section aria-label="Your plan for today" className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Link
          to="/dashboard/watering"
          className="press group relative flex flex-col rounded-lg border-2 border-ink bg-water-500 p-6 sm:p-7 shadow-brutal"
        >
          <span className="absolute -top-3.5 right-5 rotate-3 rounded-md border-2 border-ink bg-surface px-2.5 py-0.5 text-sm font-bold shadow-brutal-sm">
            {needsWater ? 'To do today' : 'Day off'}
          </span>
          <div className="text-sm font-bold uppercase tracking-wider">Watering</div>
          <div className="mt-3 font-display text-4xl sm:text-5xl uppercase leading-[0.95] tracking-tight">
            {needsWater ? todayPlan.title : 'No water today'}
          </div>
          {needsWater && (
            <div className="mt-3 text-xl font-bold">
              Start {today.startTime} · about {fmt(today.waterLiters, 0)} litres
            </div>
          )}
          <p className="mt-3 max-w-lg text-base leading-relaxed">{todayPlan.reason}</p>
          {nextRainDay && needsWater && (
            <p className="mt-1 text-base leading-relaxed">
              Rain is coming on <span className="font-bold">{nextRainDay.day.toLowerCase()}</span>, so you can skip that day.
            </p>
          )}
          <span className="mt-6 lg:mt-auto inline-flex w-fit items-center gap-2 rounded-md border-2 border-ink bg-surface px-3 py-2 text-sm font-bold">
            See the week's plan
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} aria-hidden="true" />
          </span>
        </Link>

        <div className="grid gap-5">
          <Link
            to="/dashboard/map"
            className="press group flex flex-col rounded-lg border-2 border-ink bg-brand-500 p-5 shadow-brutal"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold uppercase tracking-wider">Crops</span>
              <Badge tone="neutral">Greenness {fmt(ndvi, 2)}</Badge>
            </div>
            <div className="mt-2 font-display text-3xl uppercase tracking-tight">{health.label}</div>
            <p className="mt-1.5 text-[15px] leading-relaxed">{health.advice}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold underline decoration-2 underline-offset-4">
              Open field map
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </span>
          </Link>

          <button
            type="button"
            onClick={onAsk}
            className="press group flex flex-col rounded-lg border-2 border-ink bg-sun-500 p-5 text-left shadow-brutal cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold uppercase tracking-wider">Soil</span>
              <Badge tone="neutral">pH {fmt(ph)}</Badge>
            </div>
            <div className="mt-2 font-display text-3xl uppercase tracking-tight">{phInfo.label}</div>
            <p className="mt-1.5 text-[15px] leading-relaxed">{dosing}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold underline decoration-2 underline-offset-4">
              <MessageCircle className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              Ask about fertiliser
            </span>
          </button>
        </div>
      </section>

      <FarmAlerts />

      {/* Conditions — one ruled panel instead of six floating cards */}
      <section aria-labelledby="conditions-heading" className="space-y-4">
        <SectionTitle
          id="conditions-heading"
          action={
            <Link to="/dashboard/weather" className="text-sm font-bold underline decoration-2 underline-offset-4">
              Full forecast
            </Link>
          }
        >
          Right now
        </SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-0.5 overflow-hidden rounded-lg border-2 border-ink bg-ink shadow-brutal [&>*]:bg-surface">
          <Reading
            label="Temperature"
            value={fmt(w?.temperature ?? 27.4)}
            unit="°C"
            hint={`Feels like ${fmt(w?.apparent_temp_c ?? w?.temperature ?? 29)}°C`}
          />
          <Reading label="Humidity" value={fmt(w?.humidity ?? 68, 0)} unit="%" hint="Moisture in the air" />
          <Reading
            label="Rain, 24 h"
            value={fmt(w?.rainfall_mm ?? 0)}
            unit="mm"
            hint={`${fmt(w?.rainfall_7day_mm ?? data?.satellite?.rainfall_7day_mm ?? 0)} mm this past week`}
          />
          <Reading
            label="Wind"
            value={fmt(w?.wind_speed_kmh ?? 12)}
            unit="km/h"
            hint={`Blowing from the ${windBearing(w?.wind_direction_deg ?? 225)}`}
          />
          <Reading
            label="Water lost today"
            value={fmt(w?.et0_mm_day ?? 4.2)}
            unit="mm"
            hint="Pulled out of soil and leaves by heat and sun"
          />
          <Reading
            label="Soil"
            value={`pH ${fmt(ph)}`}
            hint={`${soil?.soil_class ?? 'Clay loam'} · ${fmt(soil?.organic_carbon_pct ?? 1.42, 2)}% organic matter`}
          />
        </div>
      </section>

      <FarmRoverModule />
    </div>
  );
};
