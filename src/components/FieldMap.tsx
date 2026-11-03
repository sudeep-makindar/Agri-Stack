import React, { useState } from 'react';
import { Droplets, Leaf, MapPin, Minus, Plus, Satellite, Sun } from 'lucide-react';
import { BackendFarmSummary } from '../services/api';
import { cropHealthFromNdvi } from '../utils/agronomy';
import { Badge, Card, CardHeader, cn, DataRow, Disclosure, fmt, Meter, PageHeader, Segmented, Tone } from './ui';

interface FieldMapProps {
  latitude?: number;
  longitude?: number;
  satelliteData?: BackendFarmSummary['satellite'];
  nasaPower?: BackendFarmSummary['nasa_power'];
}

type Layer = 'natural' | 'greenness' | 'water';

const LAYERS: { value: Layer; label: string }[] = [
  { value: 'natural', label: 'Natural colour' },
  { value: 'greenness', label: 'Crop greenness' },
  { value: 'water', label: 'Water in leaves' },
];

const LAYER_TINT: Record<Layer, string> = {
  natural: 'bg-transparent',
  greenness: 'bg-emerald-500/25 mix-blend-color',
  water: 'bg-sky-500/30 mix-blend-color',
};

function leafWaterLabel(ndwi: number): { label: string; tone: Tone } {
  if (ndwi >= 0.3) return { label: 'Well watered', tone: 'good' };
  if (ndwi >= 0.1) return { label: 'Slightly dry', tone: 'warn' };
  return { label: 'Dry', tone: 'bad' };
}

export const FieldMap: React.FC<FieldMapProps> = ({ latitude = 18.5204, longitude = 73.8567, satelliteData, nasaPower }) => {
  const [layer, setLayer] = useState<Layer>('natural');
  const [zoom, setZoom] = useState(14);

  const indices = {
    NDVI: 0.72, NDRE: 0.64, EVI: 0.62, NDWI: 0.42, NDMI: 0.48, SAVI: 0.58,
    ...satelliteData?.vegetation_indices,
  };
  const bands = satelliteData?.spectral_bands;
  const solar = satelliteData?.solar_radiation;
  const acqDate = satelliteData?.acquisition_date || '2026-09-15';
  const cloud = satelliteData?.cloud_cover_pct ?? 44;
  const isLive = !!satelliteData;

  const health = cropHealthFromNdvi(indices.NDVI);
  const leafWater = leafWaterLabel(indices.NDWI);

  // lat/lon → Esri World Imagery tile (zoom 14)
  const xTile = Math.floor(((longitude + 180) / 360) * 2 ** 14);
  const latRad = (latitude * Math.PI) / 180;
  const yTile = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** 14);
  const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/${yTile}/${xTile}`;

  const photoDate = new Date(acqDate);
  const photoDateText = Number.isNaN(photoDate.getTime())
    ? acqDate
    : photoDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field map"
        description="A satellite photo of your field. Switch views to see where crops are green and healthy, and where they may need water."
        action={!isLive ? <Badge tone="warn">Sample satellite data</Badge> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Map */}
        <Card className="bg-surface p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Segmented label="Map view" options={LAYERS} value={layer} onChange={setLayer} />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(12, z - 1))}
                className="grid h-9 w-9 place-items-center rounded-lg border-2 border-ink text-ink hover:bg-sun-500 cursor-pointer"
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(20, z + 1))}
                className="grid h-9 w-9 place-items-center rounded-lg border-2 border-ink text-ink hover:bg-sun-500 cursor-pointer"
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border-2 border-ink bg-sunken">
            <img
              src={tileUrl}
              alt="Satellite photo of your farm"
              className="h-full w-full object-cover transition-transform duration-300"
              style={{ transform: `scale(${1 + (zoom - 14) * 0.12})` }}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className={cn('pointer-events-none absolute inset-0 transition-colors duration-300', LAYER_TINT[layer])} />
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polygon points="25,30 75,22 82,78 30,85" fill="rgba(255,255,255,0.12)" stroke="#ffffff" strokeWidth="0.6" strokeDasharray="2 1.2" />
            </svg>
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center">
              <span className="rounded-md border-2 border-ink bg-sun-500 px-2.5 py-0.5 text-xs font-bold text-ink shadow-brutal-sm">Your farm</span>
              <MapPin className="h-7 w-7 text-alert-600 drop-shadow" fill="currentColor" stroke="white" aria-hidden="true" />
            </div>
            {layer !== 'natural' && (
              <div className="absolute bottom-3 left-3 rounded-md border-2 border-ink bg-surface px-3 py-2 text-xs text-ink shadow-brutal-sm">
                <div className="mb-1 font-bold">{layer === 'greenness' ? 'Crop greenness' : 'Water in leaves'}</div>
                <div className={cn('h-3 w-40 rounded-sm border-2 border-ink', layer === 'greenness' ? 'bg-gradient-to-r from-amber-300 via-lime-400 to-emerald-600' : 'bg-gradient-to-r from-amber-200 via-sky-300 to-sky-700')} />
                <div className="mt-1 flex justify-between text-muted">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}
          </div>

          <p className="px-1 text-sm text-muted">
            Photo taken {photoDateText} · {fmt(cloud, 0)}% cloud · {fmt(latitude, 4)}° N, {fmt(longitude, 4)}° E
          </p>
        </Card>

        {/* Summary */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <CardHeader icon={Leaf} tone={health.tone} title="Crop greenness" description="How green and leafy your crops are." />
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-ink tabular-nums">{fmt(indices.NDVI, 2)}</span>
              <Badge tone={health.tone} dot>{health.label}</Badge>
            </div>
            <Meter value={indices.NDVI} tone={health.tone} labels={['Bare soil', 'Fair', 'Healthy']} />
            <p className="text-[15px] text-muted leading-relaxed">{health.advice}</p>
          </Card>

          <Card className="p-5 space-y-4">
            <CardHeader icon={Droplets} tone="info" title="Water in leaves" description="Whether plants have enough water inside them." />
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-ink tabular-nums">{fmt(indices.NDWI, 2)}</span>
              <Badge tone={leafWater.tone} dot>{leafWater.label}</Badge>
            </div>
            <Meter value={indices.NDWI} min={-0.2} max={0.8} tone="info" labels={['Dry', 'Moist']} />
          </Card>

          {solar && (
            <Card className="p-5">
              <CardHeader
                icon={Sun}
                tone="warn"
                title={`UV index ${fmt(solar.uv_index_max)}`}
                description={solar.uv_index_max >= 8 ? 'Very strong sun. Cover up and drink water when working outside.' : 'Normal sunlight for crops.'}
              />
            </Card>
          )}
        </div>
      </div>

      <Disclosure summary="Technical satellite details">
        <div className="grid gap-x-10 md:grid-cols-2">
          <dl>
            <div className="mb-1 flex items-center gap-1.5 text-sm font-bold text-ink">
              <Satellite className="h-4 w-4" aria-hidden="true" /> Image
            </div>
            <DataRow label="Satellite" value={(satelliteData?.platform || 'sentinel-2b').replace('sentinel', 'Sentinel')} />
            <DataRow label="Tile" value={satelliteData?.sentinel_tile_id || 'S2B_43QCA_20260915_0_L2A'} />
            <DataRow label="Date" value={acqDate} />
            <DataRow label="Cloud cover" value={`${fmt(cloud)}%`} />
            {nasaPower && <DataRow label="Average solar energy (NASA)" value={`${fmt(nasaPower.solar_irradiance_kw_m2, 2)} kW/m²`} />}
          </dl>
          <dl>
            <div className="mb-1 mt-4 md:mt-0 text-sm font-bold text-ink">Vegetation indices</div>
            <DataRow label="NDVI (greenness)" value={fmt(indices.NDVI, 2)} />
            <DataRow label="NDRE (chlorophyll)" value={fmt(indices.NDRE, 2)} />
            <DataRow label="EVI (enhanced greenness)" value={fmt(indices.EVI, 2)} />
            <DataRow label="NDWI (leaf water)" value={fmt(indices.NDWI, 2)} />
            <DataRow label="NDMI (moisture)" value={fmt(indices.NDMI, 2)} />
            <DataRow label="SAVI (soil-adjusted)" value={fmt(indices.SAVI, 2)} />
          </dl>
          {bands && (
            <dl className="md:col-span-2 mt-4">
              <div className="mb-1 text-sm font-bold text-ink">Band reflectance</div>
              <div className="grid gap-x-10 md:grid-cols-2">
                {Object.entries(bands).map(([k, v]) => (
                  <DataRow key={k} label={k.replace(/_/g, ' ')} value={fmt(v as number, 3)} />
                ))}
              </div>
            </dl>
          )}
        </div>
      </Disclosure>
    </div>
  );
};
