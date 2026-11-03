import { ForecastItem } from '../services/api';
import { dayLabel } from './weather';

export type WateringDecision = 'WATER' | 'LIGHT' | 'SKIP_RAIN' | 'SKIP_WET';

export interface ScheduleSlot {
  day: string;
  decision: WateringDecision;
  startTime: string | null;
  durationMinutes: number;
  waterLiters: number;
  moisturePercent: number;
  rainForecastMm: number;
  rainProbPct: number;
  et0Mm: number;
}

/** Derive a 7-day irrigation schedule from the live weather forecast */
export function buildScheduleFromForecast(forecast: ForecastItem[], baseMoisture: number): ScheduleSlot[] {
  return Array.from({ length: 7 }, (_, i) => {
    const f = forecast[i] ?? ({} as ForecastItem);
    const rainProb = f.rain_prob_pct ?? 15;
    const rainMm = f.rain_sum_mm ?? 0;
    const et0 = f.et0_mm ?? 4.2;
    const moisturePct = Math.min(100, baseMoisture + rainMm * 1.5 - et0 * 0.8);

    let decision: WateringDecision = 'WATER';
    let durationMinutes = 60;
    let waterLiters = Math.round(et0 * 75);

    if (rainProb > 70 || rainMm > 8) {
      decision = 'SKIP_RAIN';
      durationMinutes = 0;
      waterLiters = 0;
    } else if (moisturePct > 55) {
      decision = 'SKIP_WET';
      durationMinutes = 0;
      waterLiters = 0;
    } else if (et0 < 3.5 && rainMm > 2) {
      decision = 'LIGHT';
      durationMinutes = 30;
      waterLiters = Math.round(et0 * 50);
    } else if (i === 0) {
      durationMinutes = 75;
      waterLiters = Math.round(et0 * 90);
    }

    return {
      day: dayLabel(f.date, i),
      decision,
      startTime: durationMinutes > 0 ? '6:00 am' : null,
      durationMinutes,
      waterLiters: Math.max(0, waterLiters),
      moisturePercent: Math.round(Math.max(0, Math.min(100, moisturePct))),
      rainForecastMm: Math.round(rainMm * 10) / 10,
      rainProbPct: rainProb,
      et0Mm: Math.round(et0 * 100) / 100,
    };
  });
}

/** Used when the backend is unreachable */
export const SAMPLE_SCHEDULE: ScheduleSlot[] = [
  { day: 'Today',    decision: 'WATER',     startTime: '6:00 am', durationMinutes: 75, waterLiters: 420, moisturePercent: 31, rainForecastMm: 0,    rainProbPct: 5,  et0Mm: 4.8 },
  { day: 'Tomorrow', decision: 'WATER',     startTime: '6:00 am', durationMinutes: 45, waterLiters: 280, moisturePercent: 34, rainForecastMm: 0.2,  rainProbPct: 15, et0Mm: 4.2 },
  { day: 'Day 3',    decision: 'SKIP_RAIN', startTime: null,      durationMinutes: 0,  waterLiters: 0,   moisturePercent: 68, rainForecastMm: 18.5, rainProbPct: 90, et0Mm: 2.1 },
  { day: 'Day 4',    decision: 'LIGHT',     startTime: '6:00 am', durationMinutes: 30, waterLiters: 190, moisturePercent: 42, rainForecastMm: 1.0,  rainProbPct: 25, et0Mm: 3.8 },
  { day: 'Day 5',    decision: 'WATER',     startTime: '6:00 am', durationMinutes: 60, waterLiters: 350, moisturePercent: 35, rainForecastMm: 0,    rainProbPct: 8,  et0Mm: 4.5 },
  { day: 'Day 6',    decision: 'SKIP_WET',  startTime: null,      durationMinutes: 0,  waterLiters: 0,   moisturePercent: 58, rainForecastMm: 4.2,  rainProbPct: 45, et0Mm: 3.0 },
  { day: 'Day 7',    decision: 'WATER',     startTime: '6:00 am', durationMinutes: 75, waterLiters: 410, moisturePercent: 30, rainForecastMm: 0,    rainProbPct: 5,  et0Mm: 4.9 },
];

export function getSchedule(forecast: ForecastItem[] | undefined, moisture: number | undefined): { schedule: ScheduleSlot[]; isLive: boolean } {
  if (forecast && forecast.length > 0) {
    return { schedule: buildScheduleFromForecast(forecast, moisture ?? 32.4), isLive: true };
  }
  return { schedule: SAMPLE_SCHEDULE, isLive: false };
}

/** One-sentence explanation of a day's decision */
export function describeDecision(slot: ScheduleSlot): { title: string; reason: string } {
  switch (slot.decision) {
    case 'WATER':
      return {
        title: `Water for ${slot.durationMinutes} min`,
        reason: `Dry weather and your crop will lose about ${slot.et0Mm} mm of water.`,
      };
    case 'LIGHT':
      return {
        title: `Light watering, ${slot.durationMinutes} min`,
        reason: `A little rain (${slot.rainForecastMm} mm) is expected, so a short top-up is enough.`,
      };
    case 'SKIP_RAIN':
      return {
        title: 'No watering needed',
        reason: `${slot.rainProbPct}% chance of rain (about ${slot.rainForecastMm} mm). Let the rain do the work.`,
      };
    case 'SKIP_WET':
      return {
        title: 'No watering needed',
        reason: `The soil is already moist enough (about ${slot.moisturePercent}%).`,
      };
  }
}

export function summarizeSchedule(schedule: ScheduleSlot[]) {
  const totalWater = schedule.reduce((s, slot) => s + slot.waterLiters, 0);
  const wateringDays = schedule.filter((s) => s.durationMinutes > 0).length;
  const skippedDays = schedule.length - wateringDays;
  // Rough comparison with watering every day at a typical 380 L
  const everyDay = schedule.length * 380;
  const savedLiters = Math.max(0, everyDay - totalWater);
  const savedPct = everyDay > 0 ? Math.round((savedLiters / everyDay) * 100) : 0;
  return { totalWater, wateringDays, skippedDays, savedLiters, savedPct };
}
