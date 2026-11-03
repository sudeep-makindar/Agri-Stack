import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, LucideIcon, Snowflake, Sun } from 'lucide-react';

/** Wind direction degrees → compass bearing label */
export function windBearing(deg?: number | null): string {
  if (deg == null) return '—';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

/** WMO weather code → plain-language description */
export function wmoCodeToText(code?: number | null): string | null {
  if (code == null) return null;
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 69) return 'Light rain';
  if (code <= 79) return 'Snow or sleet';
  if (code <= 99) return 'Thunderstorm';
  return null;
}

/** Format sunrise/sunset ISO string → "6:12 am" */
export function formatTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export type SkyKind = 'clear' | 'partly' | 'cloudy' | 'showers' | 'storm' | 'fog' | 'snow';

export const SKY_ICON: Record<SkyKind, LucideIcon> = {
  clear: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  showers: CloudRain,
  storm: CloudLightning,
  fog: CloudFog,
  snow: Snowflake,
};

export const SKY_LABEL: Record<SkyKind, string> = {
  clear: 'Sunny',
  partly: 'Partly cloudy',
  cloudy: 'Cloudy',
  showers: 'Showers likely',
  storm: 'Heavy rain / storm',
  fog: 'Foggy',
  snow: 'Snow',
};

/** Pick a sky type from rain probability (0–100) */
export function skyFromRainChance(pop: number): SkyKind {
  if (pop > 70) return 'storm';
  if (pop > 40) return 'showers';
  if (pop > 20) return 'partly';
  return 'clear';
}

export function skyFromWmo(code?: number | null): SkyKind | null {
  if (code == null) return null;
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code <= 49) return 'fog';
  if (code <= 69) return 'showers';
  if (code <= 79) return 'snow';
  return 'storm';
}

/** Short weekday label for a forecast date, e.g. "Today", "Tue" */
export function dayLabel(dateStr: string | undefined, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  if (!dateStr) return `Day ${index + 1}`;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return `Day ${index + 1}`;
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
