import type { Tone } from '../components/ui';

/** Plain-language reading of NDVI (0–1 crop greenness) */
export function cropHealthFromNdvi(ndvi: number): { label: string; tone: Tone; advice: string } {
  if (ndvi >= 0.6) return { label: 'Healthy', tone: 'good', advice: 'Leaves are green and growing well across most of the field.' };
  if (ndvi >= 0.4) return { label: 'Fair', tone: 'warn', advice: 'Some patches look weaker. Walk the field and check for pests or dry spots.' };
  return { label: 'Needs attention', tone: 'bad', advice: 'Large parts of the field look stressed. Check water and nutrients soon.' };
}

export function soilPhLabel(ph: number): { label: string; tone: Tone } {
  if (ph < 5.5) return { label: 'Too acidic', tone: 'warn' };
  if (ph <= 7.5) return { label: 'Good for most crops', tone: 'good' };
  return { label: 'Too alkaline', tone: 'warn' };
}
