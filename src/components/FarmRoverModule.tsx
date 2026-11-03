import React, { useState } from 'react';
import { BatteryMedium, Clock, Gauge, Mountain, Play, Tractor, Wind } from 'lucide-react';
import { Badge, Button, Card, CardHeader, fmt } from './ui';

export const FarmRoverModule: React.FC = () => {
  const [isPatrolling, setIsPatrolling] = useState(false);
  const [telemetry, setTelemetry] = useState({
    co2Ppm: 412,
    methanePpm: 1.8,
    altitudeMeters: 45.2,
    speedKmh: 0.0,
    batteryPercent: 94,
  });

  const handleStartPatrol = () => {
    setIsPatrolling(true);
    setTelemetry((prev) => ({ ...prev, speedKmh: 3.6 }));

    setTimeout(() => {
      setIsPatrolling(false);
      setTelemetry((prev) => ({ ...prev, co2Ppm: 418, methanePpm: 2.1, speedKmh: 0.0 }));
    }, 2500);
  };

  const items = [
    { icon: Wind, label: 'Carbon dioxide', value: `${telemetry.co2Ppm} ppm`, hint: 'Normal air' },
    { icon: Wind, label: 'Methane', value: `${fmt(telemetry.methanePpm)} ppm`, hint: 'Gas from soil' },
    { icon: Mountain, label: 'Height above sea', value: `${telemetry.altitudeMeters} m`, hint: 'Field slope' },
    { icon: Gauge, label: 'Speed', value: `${fmt(telemetry.speedKmh)} km/h`, hint: isPatrolling ? 'Driving to next stop' : 'Parked at base' },
    { icon: BatteryMedium, label: 'Battery', value: `${telemetry.batteryPercent}%`, hint: 'Charging from solar' },
    { icon: Clock, label: 'Daily round', value: '10:00 am', hint: 'Runs automatically' },
  ];

  return (
    <Card className="bg-surface p-5 sm:p-6 space-y-5">
      <CardHeader
        icon={Tractor}
        title="Field rover"
        description="A small robot that drives around your field every morning and checks the air and soil."
        action={
          <>
            <Badge tone={isPatrolling ? 'info' : 'good'} dot>
              {isPatrolling ? 'On patrol' : 'Ready'}
            </Badge>
            <Button size="sm" variant="secondary" icon={Play} onClick={handleStartPatrol} disabled={isPatrolling}>
              {isPatrolling ? 'Patrolling…' : 'Start a round now'}
            </Button>
          </>
        }
      />
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 overflow-hidden rounded-md border-2 border-ink bg-ink">
        {items.map((i) => (
          <div key={i.label} className="bg-canvas px-4 py-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">{i.label}</dt>
            <dd className="mt-0.5 font-display text-xl text-ink tabular-nums">{i.value}</dd>
            <dd className="text-sm text-muted">{i.hint}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
};
