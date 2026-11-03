import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Droplets,
  Flame,
  Gauge,
  History,
  LoaderCircle,
  MapPin,
  MonitorSmartphone,
  Power,
  Send,
  Sprout,
  Thermometer,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, cn, DataRow, Disclosure, fmt, PageHeader, Stat } from './ui';

export interface TelemetryData {
  device_id: string;
  timestamp: number;
  uptime_s: number;
  wifi_connected: boolean;
  ip: string;
  rssi: number;
  free_heap: number;
  transport: 'wifi' | 'usb_serial' | 'offline';
  dht11: { temperature_c: number; humidity_percent: number; heat_index_c: number; valid: boolean };
  bmp180: { pressure_hpa: number; temperature_c: number; altitude_m: number; valid: boolean };
  mpu9250: {
    accel_magnitude: number;
    gyro_magnitude: number;
    pitch: number;
    roll: number;
    yaw: number;
    motion_detected: boolean;
    valid: boolean;
  };
  mq6: { raw_adc: number; normalized: number; change_from_previous: number };
  soil_moisture?: { raw_adc: number; calibrated_percent: number; status: string };
  display?: { type: string; active: boolean; last_message?: string };
  gps: {
    location_valid: boolean;
    satellites: number;
    latitude: number | null;
    longitude: number | null;
    speed_kmph: number | null;
  };
  relay_state: 'ON' | 'OFF';
}

const ESP32_IP = import.meta.env.VITE_ESP32_IP || 'http://192.168.137.33';
const ESP32_HOST = import.meta.env.VITE_ESP32_HOST || '192.168.137.33';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const DEFAULT_TELEMETRY: TelemetryData = {
  device_id: 'ESP_NODE_001',
  timestamp: Date.now(),
  uptime_s: 342,
  wifi_connected: true,
  ip: ESP32_HOST,
  rssi: -40,
  free_heap: 53688,
  transport: 'wifi',
  dht11: { temperature_c: 29.9, humidity_percent: 68, heat_index_c: 34.33, valid: true },
  bmp180: { pressure_hpa: 1005.02, temperature_c: 30.3, altitude_m: 112.4, valid: true },
  mpu9250: { accel_magnitude: 0.99, gyro_magnitude: 0.24, pitch: 1.2, roll: 0.7, yaw: 12.5, motion_detected: false, valid: true },
  mq6: { raw_adc: 2557, normalized: 0.6244, change_from_previous: -2 },
  soil_moisture: { raw_adc: 1420, calibrated_percent: 38.4, status: 'OPTIMAL_FIELD_CAPACITY' },
  gps: { location_valid: true, satellites: 4, latitude: 18.5204, longitude: 73.8567, speed_kmph: 0.0 },
  display: { type: 'ssd1306_oled_128x64', active: true, last_message: 'AgriStack Node' },
  relay_state: 'OFF',
};

interface LogEntry {
  time: string;
  text: string;
}

const now = () => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

function gasLevel(normalized: number): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (normalized < 0.7) return { label: 'Normal', tone: 'good' };
  if (normalized < 0.85) return { label: 'A bit high', tone: 'warn' };
  return { label: 'High — check the area', tone: 'bad' };
}

function soilStatusText(status?: string): string {
  if (!status) return '';
  const s = status.toUpperCase();
  if (s.includes('DRY')) return 'Dry — needs water';
  if (s.includes('WET') || s.includes('SATURATED')) return 'Very wet';
  return 'Just right';
}

function formatUptime(s: number): string {
  if (s < 60) return `${s} sec`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  return `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min`;
}

export const FieldSensors: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);
  const [relayState, setRelayState] = useState<'ON' | 'OFF'>('OFF');
  const [message, setMessage] = useState('AGRISTACK FIELD NODE ONLINE');
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  const addLog = (text: string) => setLog((prev) => [{ time: now(), text }, ...prev.slice(0, 7)]);

  // Poll live telemetry from the ESP32 (via the backend, falling back to the device itself)
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        let res = await fetch(`${API_BASE_URL}/esp32/sensors`);
        if (!res.ok) res = await fetch(`${ESP32_IP}/sensors`);
        if (!res.ok) {
          setIsOnline(false);
          return;
        }
        const data = await res.json();
        setIsOnline(true);
        setLastSeen(now());
        setTelemetry((prev) => ({
          ...prev,
          device_id: data.device_id || prev.device_id,
          uptime_s: data.timestamp || data.time?.uptime_s || prev.uptime_s,
          wifi_connected: true,
          ip: ESP32_HOST,
          dht11: {
            temperature_c: data.dht11?.temperature_c ?? prev.dht11.temperature_c,
            humidity_percent: data.dht11?.humidity_percent ?? prev.dht11.humidity_percent,
            heat_index_c: data.dht11?.heat_index_c ?? prev.dht11.heat_index_c,
            valid: data.dht11?.temperature_valid ?? true,
          },
          bmp180: {
            pressure_hpa: data.bmp180?.pressure_hpa ?? prev.bmp180.pressure_hpa,
            temperature_c: data.bmp180?.temperature_c ?? prev.bmp180.temperature_c,
            altitude_m: data.bmp180?.altitude_m ?? prev.bmp180.altitude_m,
            valid: data.bmp180?.valid ?? true,
          },
          mq6: {
            raw_adc: data.mq6?.raw_adc ?? prev.mq6.raw_adc,
            normalized: data.mq6?.normalized ?? prev.mq6.normalized,
            change_from_previous: data.mq6?.change_from_previous ?? prev.mq6.change_from_previous,
          },
          soil_moisture: data.soil_moisture
            ? {
                raw_adc: data.soil_moisture?.raw_adc ?? prev.soil_moisture?.raw_adc ?? 0,
                calibrated_percent: data.soil_moisture?.calibrated_percent ?? prev.soil_moisture?.calibrated_percent ?? 0,
                status: data.soil_moisture?.status || prev.soil_moisture?.status || 'OPTIMAL',
              }
            : prev.soil_moisture,
          display: {
            type: data.display?.type ?? prev.display?.type ?? 'i2c_lcd_1602',
            active: data.display?.active ?? prev.display?.active ?? true,
            last_message: data.display?.last_message ?? prev.display?.last_message,
          },
          mpu9250: {
            ...prev.mpu9250,
            pitch: data.mpu9250?.pitch ?? prev.mpu9250.pitch,
            roll: data.mpu9250?.roll ?? prev.mpu9250.roll,
            yaw: data.mpu9250?.yaw ?? prev.mpu9250.yaw,
            valid: data.mpu9250?.valid ?? false,
          },
          gps: {
            ...prev.gps,
            satellites: data.gps?.satellites ?? prev.gps.satellites,
            latitude: data.gps?.latitude ?? prev.gps.latitude,
            longitude: data.gps?.longitude ?? prev.gps.longitude,
          },
        }));
      } catch (err) {
        setIsOnline(false);
        console.warn('Telemetry fetch check:', err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleRelay = async () => {
    const next = relayState === 'ON' ? 'OFF' : 'ON';
    setRelayState(next);
    addLog(next === 'ON' ? 'You turned the water pump on' : 'You turned the water pump off');
    try {
      await fetch(`${API_BASE_URL}/esp32/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: next }),
      });
    } catch (err) {
      console.warn('Relay actuator call error:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true);
    addLog(`Sent "${message}" to the field screen`);
    try {
      await fetch(`${API_BASE_URL}/esp32/display`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
    } catch (err) {
      console.warn('OLED display call error:', err);
    } finally {
      setTimeout(() => setIsSending(false), 600);
    }
  };

  const gas = gasLevel(telemetry.mq6.normalized);
  const soil = telemetry.soil_moisture;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field sensors"
        description="Live readings from the sensor box in your field. Readings refresh every few seconds."
      />

      {/* Connection */}
      <Card
        className={cn(
          'flex flex-wrap items-center justify-between gap-4 p-5',
          isOnline === false ? 'bg-sun-100' : 'bg-surface',
        )}
      >
        <div className="flex items-center gap-4">
          <span
            className={cn(
              'grid h-12 w-12 place-items-center rounded-md border-2 border-ink',
              isOnline === null ? 'bg-surface' : isOnline ? 'bg-brand-500' : 'bg-sun-500',
            )}
          >
            {isOnline === null ? (
              <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />
            ) : isOnline ? (
              <Wifi className="h-6 w-6" aria-hidden="true" />
            ) : (
              <WifiOff className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <div>
            <div className="text-base font-bold text-ink">
              {isOnline === null
                ? 'Looking for your sensor box…'
                : isOnline
                  ? 'Your sensor box is connected'
                  : "We can't reach your sensor box"}
            </div>
            <p className="text-[15px] text-muted">
              {isOnline === false
                ? 'Check that it has power and is on the same Wi-Fi. Showing the last known readings.'
                : lastSeen
                  ? `Last update at ${lastSeen}`
                  : `Device ${telemetry.device_id}`}
            </p>
          </div>
        </div>
        {isOnline !== null && (
          <Badge tone={isOnline ? 'good' : 'warn'} dot>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        )}
      </Card>

      {/* Readings */}
      <section aria-labelledby="readings-heading" className="space-y-3">
        <h2 id="readings-heading" className="font-display text-xl uppercase tracking-tight text-ink">Readings</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Stat
            icon={Thermometer}
            tone="warn"
            label="Temperature"
            value={fmt(telemetry.dht11.temperature_c)}
            unit="°C"
            hint={`Feels like ${fmt(telemetry.dht11.heat_index_c)}°C`}
          />
          <Stat icon={Droplets} tone="info" label="Humidity" value={fmt(telemetry.dht11.humidity_percent, 0)} unit="%" hint="Moisture in the air" />
          {soil && (
            <Stat
              icon={Sprout}
              tone="good"
              label="Soil moisture"
              value={fmt(soil.calibrated_percent)}
              unit="%"
              hint={soilStatusText(soil.status)}
            />
          )}
          <Stat
            icon={Flame}
            tone={gas.tone}
            label="Gas level"
            value={gas.label}
            hint={`Sensor reading ${telemetry.mq6.raw_adc} (higher means more gas)`}
          />
          <Stat icon={Gauge} label="Air pressure" value={fmt(telemetry.bmp180.pressure_hpa, 0)} unit="hPa" hint="A sudden drop can mean rain" />
          <Stat
            icon={MapPin}
            label="Location"
            value={telemetry.gps.latitude != null ? `${fmt(telemetry.gps.latitude, 3)}°, ${fmt(telemetry.gps.longitude, 3)}°` : '—'}
            hint={`${telemetry.gps.satellites} GPS satellites in view`}
          />
        </div>
      </section>

      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5 sm:p-6 space-y-4">
          <CardHeader
            icon={Power}
            tone={relayState === 'ON' ? 'info' : 'neutral'}
            title="Water pump"
            description="Turn your drip irrigation pump on or off from here."
            action={<Badge tone={relayState === 'ON' ? 'info' : 'neutral'} dot>{relayState === 'ON' ? 'Running' : 'Off'}</Badge>}
          />
          <Button
            variant={relayState === 'ON' ? 'danger' : 'primary'}
            icon={Power}
            onClick={handleToggleRelay}
            className="w-full"
            aria-pressed={relayState === 'ON'}
          >
            {relayState === 'ON' ? 'Turn pump off' : 'Turn pump on'}
          </Button>
        </Card>

        <Card as="div" className="p-5 sm:p-6">
          <form onSubmit={handleSendMessage} className="space-y-4">
            <CardHeader
              icon={MonitorSmartphone}
              tone="neutral"
              title="Field screen message"
              description="Show a short note on the small screen on the sensor box — handy for workers in the field."
            />
            <div className="flex gap-2">
              <label htmlFor="field-msg" className="sr-only">Message</label>
              <input
                id="field-msg"
                type="text"
                value={message}
                maxLength={32}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Water block 2 today"
                className="h-11 min-w-0 flex-1 rounded-md border-2 border-ink bg-surface px-4 text-[15px] text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none"
              />
              <Button type="submit" variant="secondary" icon={isSending ? LoaderCircle : Send} disabled={isSending || !message.trim()}>
                Send
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Activity */}
      <Card className="p-5 sm:p-6">
        <CardHeader icon={History} tone="neutral" title="Recent activity" />
        {log.length === 0 ? (
          <p className="mt-4 text-[15px] text-muted">Nothing yet. Actions you take here will show up in this list.</p>
        ) : (
          <ul className="mt-4 divide-y-2 divide-dashed divide-ink/40">
            {log.map((l, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 py-2.5 text-[15px]">
                <span className="text-ink">{l.text}</span>
                <span className="shrink-0 text-sm text-muted">{l.time}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Disclosure summary="Technical device details">
        <div className="grid gap-x-10 md:grid-cols-2">
          <dl>
            <div className="mb-1 flex items-center gap-1.5 text-sm font-bold text-ink">
              <Cpu className="h-4 w-4" aria-hidden="true" /> Device
            </div>
            <DataRow label="Device ID" value={telemetry.device_id} />
            <DataRow label="Address" value={ESP32_IP} />
            <DataRow label="Running for" value={formatUptime(telemetry.uptime_s)} />
            <DataRow label="Wi-Fi signal" value={`${telemetry.rssi} dBm`} />
            <DataRow label="Free memory" value={`${fmt(telemetry.free_heap / 1024)} KB`} />
            <DataRow label="Screen" value={telemetry.display?.type ?? '—'} />
          </dl>
          <dl>
            <div className="mb-1 mt-4 md:mt-0 text-sm font-bold text-ink">Sensors</div>
            <DataRow label="Barometer temperature" value={`${fmt(telemetry.bmp180.temperature_c)}°C`} />
            <DataRow label="Altitude" value={`${fmt(telemetry.bmp180.altitude_m)} m`} />
            <DataRow label="Gas sensor (MQ-6)" value={`${telemetry.mq6.raw_adc} raw · ${fmt(telemetry.mq6.normalized, 3)}`} />
            <DataRow label="Soil sensor raw" value={soil ? soil.raw_adc : '—'} />
            <DataRow label="Tilt (pitch / roll / yaw)" value={`${telemetry.mpu9250.pitch}° / ${telemetry.mpu9250.roll}° / ${telemetry.mpu9250.yaw}°`} />
            <DataRow label="GPS speed" value={`${fmt(telemetry.gps.speed_kmph ?? 0)} km/h`} />
          </dl>
        </div>
      </Disclosure>
    </div>
  );
};
