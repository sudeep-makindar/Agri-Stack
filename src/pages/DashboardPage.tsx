import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CloudOff, LoaderCircle, MessageCircle, RefreshCw } from 'lucide-react';
import { AdvisorPanel } from '../components/AdvisorPanel';
import { BottomNav, isSectionId, Logo, SideNav } from '../components/AppNav';
import { FieldMap } from '../components/FieldMap';
import { FieldSensors } from '../components/FieldSensors';
import { PlantCheck } from '../components/PlantCheck';
import { TodayOverview } from '../components/TodayOverview';
import { cn } from '../components/ui';
import { WateringPlan } from '../components/WateringPlan';
import { WeatherForecast } from '../components/WeatherForecast';
import { DEMO_FARM_DATA } from '../data/modules';
import { agriApi, BackendFarmSummary } from '../services/api';

const FARM_ID = 'FARM-74-2B';
const FARMER = { name: 'Yeswanth Ram', surveyNo: '74/2B' };

type LoadState = 'loading' | 'live' | 'offline';

export const DashboardPage: React.FC = () => {
  const { section } = useParams();
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [liveData, setLiveData] = useState<BackendFarmSummary | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const data = await agriApi.getFarmSummary(FARM_ID);
    if (data) {
      setLiveData(data);
      setLoadState('live');
      setLastFetch(new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }));
    } else {
      setLoadState((prev) => (prev === 'live' ? 'live' : 'offline'));
    }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    // Re-fetch every 5 minutes to keep data fresh
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [section]);

  if (section !== undefined && !isSectionId(section)) return <Navigate to="/dashboard" replace />;
  const active = section ?? 'today';

  const farmName = liveData?.farm.name ?? 'Green Valley Farm';
  const farmMeta = `${liveData?.farm.crop ?? 'Maize'} · ${liveData?.farm.area_ha ?? DEMO_FARM_DATA.areaHa} ha · Survey ${FARMER.surveyNo}`;

  return (
    <div className="min-h-screen bg-canvas">
      <SideNav active={active} farmName={farmName} farmMeta={farmMeta} onAsk={() => setAdvisorOpen(true)} />

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b-2 border-ink bg-canvas">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
            <Logo className="lg:hidden" />
            <div className="hidden lg:block text-sm text-muted truncate">
              <span className="font-bold text-ink">{farmName}</span> · {farmMeta}
            </div>

            <div className="flex items-center gap-2">
              <DataStatus state={loadState} lastFetch={lastFetch} />
              <button
                onClick={load}
                disabled={refreshing}
                className="press grid h-10 w-10 place-items-center rounded-md border-2 border-ink bg-surface shadow-brutal-sm disabled:opacity-50 cursor-pointer"
                aria-label="Refresh farm data"
                title="Refresh"
              >
                <RefreshCw className={cn('h-[18px] w-[18px]', refreshing && 'animate-spin')} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-32 lg:pb-12">
          {loadState === 'offline' && (
            <div className="mb-8 flex items-start gap-3 rounded-lg border-2 border-dashed border-ink bg-sun-100 px-4 py-3.5">
              <CloudOff className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
              <div className="text-[15px]">
                <span className="font-bold text-ink">You're seeing sample data.</span>{' '}
                <span className="text-ink">We couldn't reach the AgriStack server. Start it, then tap refresh.</span>
              </div>
            </div>
          )}

          {active === 'today' && <TodayOverview data={liveData} farmerName={FARMER.name} onAsk={() => setAdvisorOpen(true)} />}
          {active === 'watering' && (
            <WateringPlan
              currentMoisturePct={liveData?.irrigation.current_moisture_pct}
              forecast7day={liveData?.weather.forecast_7day}
              stressStatus={liveData?.irrigation.stress_status}
            />
          )}
          {active === 'weather' && <WeatherForecast liveWeather={liveData?.weather} nasaPower={liveData?.nasa_power} />}
          {active === 'map' && (
            <FieldMap
              latitude={liveData?.farm.latitude}
              longitude={liveData?.farm.longitude}
              satelliteData={liveData?.satellite}
              nasaPower={liveData?.nasa_power}
            />
          )}
          {active === 'sensors' && <FieldSensors />}
          {active === 'plant-check' && <PlantCheck />}
        </main>
      </div>

      {/* Mobile: floating ask button */}
      <button
        onClick={() => setAdvisorOpen(true)}
        className="press lg:hidden fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 flex h-13 items-center gap-2 rounded-md border-2 border-ink bg-brand-500 pl-4 pr-5 text-[15px] font-bold text-ink shadow-brutal cursor-pointer"
      >
        <MessageCircle className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        Ask
      </button>

      <BottomNav active={active} />

      <AdvisorPanel isOpen={advisorOpen} onClose={() => setAdvisorOpen(false)} farmId={FARM_ID} />
    </div>
  );
};

const DataStatus: React.FC<{ state: LoadState; lastFetch: string | null }> = ({ state, lastFetch }) => {
  if (state === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-surface px-2.5 py-1 text-xs font-bold">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Connecting…
      </span>
    );
  }
  if (state === 'offline') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-sun-500 px-2.5 py-1 text-xs font-bold">
        <span className="h-2 w-2 rounded-full border border-ink bg-surface" />
        Offline
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-brand-500 px-2.5 py-1 text-xs font-bold">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ink" />
      </span>
      Live{lastFetch ? <span className="hidden sm:inline font-medium"> · updated {lastFetch}</span> : null}
    </span>
  );
};
