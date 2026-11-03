import React, { useState } from 'react';
import { CircleCheck, CircleX, Droplets, Sunrise, Sunset, Thermometer, Wind } from 'lucide-react';
import { BackendFarmSummary } from '../services/api';
import {
  dayLabel,
  formatTime,
  SKY_ICON,
  SKY_LABEL,
  skyFromRainChance,
  skyFromWmo,
  SkyKind,
  windBearing,
  wmoCodeToText,
} from '../utils/weather';
import { Badge, Card, CardHeader, cn, DataRow, Disclosure, fmt, PageHeader } from './ui';

interface WeatherForecastProps {
  liveWeather?: BackendFarmSummary['weather'];
  nasaPower?: BackendFarmSummary['nasa_power'];
}

interface DayForecast {
  label: string;
  sky: SkyKind;
  tempMax: number;
  tempMin: number;
  pop: number;
  rainMm: number;
  et0: number;
  windMax: number;
  sunrise?: string | null;
  sunset?: string | null;
}

const SAMPLE_DAYS: DayForecast[] = [
  { label: 'Today', sky: 'clear', tempMax: 31, tempMin: 23, pop: 5, rainMm: 0, et0: 4.8, windMax: 12 },
  { label: 'Tomorrow', sky: 'partly', tempMax: 30, tempMin: 22, pop: 20, rainMm: 0.2, et0: 4.2, windMax: 14 },
  { label: 'Day 3', sky: 'showers', tempMax: 28, tempMin: 21, pop: 65, rainMm: 6, et0: 3.1, windMax: 18 },
  { label: 'Day 4', sky: 'storm', tempMax: 25, tempMin: 20, pop: 95, rainMm: 22, et0: 2.1, windMax: 26 },
  { label: 'Day 5', sky: 'partly', tempMax: 27, tempMin: 21, pop: 30, rainMm: 1, et0: 3.8, windMax: 15 },
  { label: 'Day 6', sky: 'clear', tempMax: 29, tempMin: 22, pop: 10, rainMm: 0, et0: 4.5, windMax: 11 },
  { label: 'Day 7', sky: 'clear', tempMax: 32, tempMin: 24, pop: 0, rainMm: 0, et0: 4.9, windMax: 10 },
];

/** Simple farm-work advice for a given day */
function farmTips(d: DayForecast): { ok: boolean; text: string }[] {
  return [
    {
      ok: d.windMax < 15 && d.pop < 30,
      text: d.windMax >= 15 ? 'Too windy to spray — spray drifts away' : d.pop >= 30 ? 'Rain may wash off any spray' : 'Good day for spraying',
    },
    {
      ok: d.pop < 40,
      text: d.pop >= 40 ? 'Hold off on fertiliser — rain can wash it away' : 'Fine for applying fertiliser',
    },
    {
      ok: d.tempMax < 35,
      text: d.tempMax >= 35 ? 'Very hot — work early or late, give plants extra water' : 'Comfortable for field work',
    },
  ];
}

export const WeatherForecast: React.FC<WeatherForecastProps> = ({ liveWeather, nasaPower }) => {
  const [selected, setSelected] = useState(0);
  const isLive = !!liveWeather?.forecast_7day?.length;

  const days: DayForecast[] = isLive
    ? liveWeather!.forecast_7day.slice(0, 7).map((f, i) => {
        const pop = f.rain_prob_pct ?? Math.round((f.precipitation_mm || 0) * 10);
        return {
          label: dayLabel(f.date, i),
          sky: skyFromRainChance(pop),
          tempMax: f.temp_max_c ?? Math.round(liveWeather!.temperature + 3),
          tempMin: f.temp_min_c ?? Math.round(liveWeather!.temperature - 5),
          pop,
          rainMm: f.rain_sum_mm ?? f.precipitation_mm ?? 0,
          et0: f.et0_mm ?? 0,
          windMax: f.wind_max_kmh ?? liveWeather!.wind_speed_kmh,
          sunrise: f.sunrise,
          sunset: f.sunset,
        };
      })
    : SAMPLE_DAYS;

  const day = days[selected] ?? days[0];

  const temp = liveWeather?.temperature ?? 27.4;
  const nowSky = skyFromWmo(liveWeather?.weather_code) ?? days[0].sky;
  const NowIcon = SKY_ICON[nowSky];
  const nowText = wmoCodeToText(liveWeather?.weather_code) ?? SKY_LABEL[nowSky];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weather"
        description="The forecast for your farm, and what it means for your work this week."
        action={!isLive ? <Badge tone="warn">Sample forecast</Badge> : undefined}
      />

      {/* Right now */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <span className="grid h-20 w-20 -rotate-3 place-items-center rounded-lg border-2 border-ink bg-sun-500 shadow-brutal-sm">
              <NowIcon className="h-10 w-10" aria-hidden="true" />
            </span>
            <div>
              <div className="text-sm font-medium text-muted">Right now</div>
              <div className="font-display text-6xl tracking-tight text-ink tabular-nums">{fmt(temp)}°</div>
              <div className="text-[15px] text-muted">
                {nowText} · feels like {fmt(liveWeather?.apparent_temp_c ?? temp)}°
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
            {[
              { icon: Droplets, label: 'Humidity', value: `${fmt(liveWeather?.humidity ?? 68, 0)}%` },
              {
                icon: Wind,
                label: 'Wind',
                value: `${fmt(liveWeather?.wind_speed_kmh ?? 12)} km/h${liveWeather?.wind_direction_deg != null ? ` ${windBearing(liveWeather.wind_direction_deg)}` : ''}`,
              },
              ...(days[0].sunrise ? [{ icon: Sunrise, label: 'Sunrise', value: formatTime(days[0].sunrise) }] : []),
              ...(days[0].sunset ? [{ icon: Sunset, label: 'Sunset', value: formatTime(days[0].sunset) }] : []),
            ].map((x) => (
              <div key={x.label}>
                <dt className="flex items-center gap-1.5 text-sm text-muted">
                  <x.icon className="h-4 w-4" aria-hidden="true" />
                  {x.label}
                </dt>
                <dd className="mt-0.5 text-[15px] font-bold text-ink tabular-nums">{x.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      {/* 7 days */}
      <section aria-labelledby="week-heading" className="space-y-3">
        <h2 id="week-heading" className="font-display text-xl uppercase tracking-tight text-ink">Next 7 days</h2>
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div role="tablist" aria-label="Choose a day" className="grid grid-flow-col auto-cols-[minmax(6.5rem,1fr)] gap-2 pb-1">
            {days.map((d, i) => {
              const Icon = SKY_ICON[d.sky];
              const active = i === selected;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border-2 border-ink px-3 py-4 transition-transform cursor-pointer',
                    active ? 'bg-sun-500 shadow-brutal -translate-y-1' : 'bg-surface hover:bg-sun-100',
                  )}
                >
                  <span className="text-sm font-bold text-ink">{d.label}</span>
                  <Icon className="h-7 w-7" strokeWidth={2.25} aria-label={SKY_LABEL[d.sky]} />
                  <span className="text-[15px] font-bold text-ink tabular-nums">
                    {fmt(d.tempMax, 0)}° <span className="font-normal text-muted">{fmt(d.tempMin, 0)}°</span>
                  </span>
                  <span className={cn('inline-flex items-center gap-1 text-xs font-medium', d.pop > 40 ? 'rounded-sm border border-ink bg-water-500 px-1 text-ink' : 'text-muted')}>
                    <Droplets className="h-3 w-3" aria-hidden="true" />
                    {d.pop}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Selected day */}
      <Card className="p-5 sm:p-6">
        <CardHeader
          icon={SKY_ICON[day.sky]}
          tone={day.pop > 40 ? 'info' : 'warn'}
          title={`${day.label}: ${SKY_LABEL[day.sky].toLowerCase()}`}
          description={`High ${fmt(day.tempMax, 0)}°C, low ${fmt(day.tempMin, 0)}°C · ${day.pop}% chance of rain${day.rainMm > 0 ? ` (about ${fmt(day.rainMm)} mm)` : ''} · wind up to ${fmt(day.windMax, 0)} km/h`}
        />
        <div className="mt-5">
          <div className="text-sm font-bold text-ink mb-2">Good for farm work?</div>
          <ul className="grid gap-2 sm:grid-cols-3">
            {farmTips(day).map((t) => (
              <li
                key={t.text}
                className={cn('flex items-start gap-2 rounded-md px-3 py-2.5 text-[15px]', 'border-2 border-ink font-medium text-ink', t.ok ? 'bg-brand-100' : 'bg-alert-100')}
              >
                {t.ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
                {t.text}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Disclosure summary="More weather details">
        <div className="grid gap-x-10 md:grid-cols-2">
          <dl>
            <DataRow label="Dew point" value={`${fmt(liveWeather?.dew_point_c)}°C`} />
            <DataRow label="Air pressure" value={`${fmt(liveWeather?.pressure_hpa)} hPa`} />
            <DataRow label="Cloud cover" value={`${fmt(liveWeather?.cloud_cover_pct, 0)}%`} />
            <DataRow label="Rain, last 24 h" value={`${fmt(liveWeather?.rainfall_mm ?? 0)} mm`} />
            <DataRow label="Rain, last 7 days" value={`${fmt(liveWeather?.rainfall_7day_mm)} mm`} />
          </dl>
          <dl>
            <DataRow label="Soil surface temperature" value={`${fmt(liveWeather?.soil_temp_0cm_c)}°C`} />
            <DataRow
              label="Top-soil moisture"
              value={liveWeather?.soil_moisture_0_1cm != null ? `${fmt(liveWeather.soil_moisture_0_1cm * 100)}%` : '—'}
            />
            <DataRow label="Water loss (ET₀)" value={`${fmt(liveWeather?.et0_mm_day ?? day.et0)} mm/day`} />
            {nasaPower && <DataRow label="Usual yearly rain (NASA)" value={`${fmt(nasaPower.historical_annual_precip_mm, 0)} mm`} />}
            {nasaPower && <DataRow label="Usual temperature (NASA)" value={`${fmt(nasaPower.historical_avg_temp_c)}°C`} />}
          </dl>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
          Source: {liveWeather?.source ?? 'Open-Meteo'}
        </p>
      </Disclosure>
    </div>
  );
};
