import React from 'react';
import { CloudSun, Droplets, ScanSearch, Sprout } from 'lucide-react';
import { EcosystemModule } from '../types';
import { cn, Tone, toneSoft } from './ui';

const ICONS: Record<EcosystemModule['iconType'], { icon: typeof Sprout; tone: Tone }> = {
  node: { icon: Sprout, tone: 'good' },
  soil: { icon: Sprout, tone: 'good' },
  chart: { icon: Droplets, tone: 'info' },
  water: { icon: Droplets, tone: 'info' },
  vote: { icon: CloudSun, tone: 'warn' },
  cloud: { icon: CloudSun, tone: 'warn' },
  bot: { icon: ScanSearch, tone: 'bad' },
  eye: { icon: ScanSearch, tone: 'bad' },
};

export const ModuleIcon: React.FC<{ type: EcosystemModule['iconType']; className?: string }> = ({ type, className }) => {
  const { icon: Icon, tone } = ICONS[type];
  return (
    <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-lg', toneSoft(tone), className)}>
      <Icon className="h-6 w-6" aria-hidden="true" />
    </span>
  );
};
