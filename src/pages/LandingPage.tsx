import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { AdvisorPanel } from '../components/AdvisorPanel';
import { Logo } from '../components/AppNav';
import { ModuleDetailModal } from '../components/ModuleDetailModal';
import { Button, cn } from '../components/ui';
import { ECOSYSTEM_MODULES } from '../data/modules';
import { EcosystemModule } from '../types';

const STEPS = [
  { title: 'Sensors in your field', body: 'A small solar box measures soil moisture, temperature and air quality all day.' },
  { title: 'Satellite + weather', body: 'We add free satellite photos of your field and a 7-day forecast for your exact location.' },
  { title: 'Plain advice on your phone', body: 'Each morning you see what to do today — in English or Tamil, read aloud if you like.' },
];

const FEATURE_COLOURS: Record<EcosystemModule['iconType'], string> = {
  node: 'bg-brand-500',
  soil: 'bg-brand-500',
  chart: 'bg-water-500',
  water: 'bg-water-500',
  vote: 'bg-sun-500',
  cloud: 'bg-sun-500',
  bot: 'bg-alert-500',
  eye: 'bg-alert-500',
};

/** Static preview of the "Today" screen used in the hero */
const TodayPreview: React.FC = () => (
  <div className="relative mx-auto w-full max-w-sm rotate-2">
    <div className="rounded-xl border-2 border-ink bg-surface p-4 shadow-brutal-lg space-y-3">
      <div className="flex items-center justify-between border-b-2 border-ink pb-3">
        <span className="font-display text-sm uppercase">Today</span>
        <span className="rounded-md border-2 border-ink bg-sun-500 px-2 text-xs font-bold">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div className="rounded-lg border-2 border-ink bg-water-500 p-4">
        <div className="text-xs font-bold uppercase tracking-wider">Watering</div>
        <div className="mt-1 font-display text-2xl uppercase leading-none">Water 75 min</div>
        <div className="mt-1.5 text-sm font-bold">Start 6:00 am · about 420 litres</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border-2 border-ink bg-brand-500 p-3">
          <div className="text-xs font-bold uppercase tracking-wider">Crops</div>
          <div className="mt-1 font-display text-lg uppercase leading-none">Healthy</div>
        </div>
        <div className="rounded-lg border-2 border-ink bg-sun-500 p-3">
          <div className="text-xs font-bold uppercase tracking-wider">Thursday</div>
          <div className="mt-1 font-display text-lg uppercase leading-none">Rain. Skip.</div>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-lg border-2 border-dashed border-ink px-3 py-2.5 text-sm">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        <span lang="ta">இன்று காலை 6 மணிக்கு நீர் பாய்ச்சவும்</span>
      </div>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<EcosystemModule | null>(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <header className="border-b-2 border-ink bg-canvas">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2 sm:gap-4">
            <a href="#how-it-works" className="hidden sm:inline text-[15px] font-bold underline decoration-2 underline-offset-4 hover:bg-sun-500">
              How it works
            </a>
            <Button size="sm" onClick={() => navigate('/dashboard')}>
              Open my farm
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 pt-12 pb-16 sm:pt-16 sm:pb-24 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-block -rotate-2 rounded-md border-2 border-ink bg-brand-500 px-2.5 py-0.5 text-sm font-bold shadow-brutal-sm">
              Made for smallholder farmers
            </span>
            <h1 className="mt-6 font-display text-[44px] sm:text-6xl lg:text-7xl uppercase leading-[0.95] tracking-tight">
              Know when to <span className="marker">water</span>, feed &amp; protect your crops.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              AgriStack reads the sensors in your field, satellite photos and the weather forecast — then tells you, in plain
              words, what to do this morning.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                Open my farm
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
              </Button>
              <Button size="lg" variant="secondary" icon={MessageCircle} onClick={() => setAdvisorOpen(true)}>
                Ask a farming question
              </Button>
            </div>
          </div>
          <TodayPreview />
        </section>

        {/* Ticker band */}
        <div className="border-y-2 border-ink bg-ink text-canvas">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-3 font-display text-sm uppercase tracking-wide sm:justify-between">
            <span>English + <span lang="ta">தமிழ்</span></span>
            <span className="text-sun-500">/</span>
            <span>Read-aloud advice</span>
            <span className="text-sun-500">/</span>
            <span>Free satellite data</span>
            <span className="text-sun-500">/</span>
            <span>Works on any phone</span>
          </div>
        </div>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-xl font-display text-3xl sm:text-4xl uppercase leading-none tracking-tight">
              Four jobs, one app.
            </h2>
            <p className="text-lg text-muted">Tap one to see the kind of advice you'll get.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {ECOSYSTEM_MODULES.map((mod, i) => (
              <button
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className={cn(
                  'press group flex flex-col rounded-lg border-2 border-ink p-6 text-left shadow-brutal cursor-pointer',
                  FEATURE_COLOURS[mod.iconType],
                )}
              >
                <span className="font-display text-sm">0{i + 1}</span>
                <h3 className="mt-3 font-display text-2xl uppercase leading-tight tracking-tight">{mod.title}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed">{mod.description}</p>
                <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-md border-2 border-ink bg-surface px-3 py-1.5 text-sm font-bold">
                  See an example
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y-2 border-ink bg-surface scroll-mt-6">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight">How it works</h2>
            <ol className="mt-10 grid gap-0.5 overflow-hidden rounded-lg border-2 border-ink bg-ink md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="bg-canvas p-6 sm:p-8">
                  <span className="font-display text-6xl leading-none text-ink">{i + 1}</span>
                  <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl border-2 border-ink bg-sun-500 px-6 py-10 shadow-brutal-lg sm:px-10 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl uppercase leading-none tracking-tight">See today's plan.</h2>
              <p className="mt-3 text-lg font-medium">It takes less than a minute every morning.</p>
            </div>
            <Button size="lg" variant="secondary" onClick={() => navigate('/dashboard')}>
              Open my farm
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-ink">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-6 text-sm font-medium">
          <span>© 2026 AgriStack · Farm advice made simple</span>
          <button onClick={() => setAdvisorOpen(true)} className="font-bold underline decoration-2 underline-offset-4 cursor-pointer">
            Ask a question
          </button>
        </div>
      </footer>

      <ModuleDetailModal
        module={selectedModule}
        onClose={() => setSelectedModule(null)}
        onOpenDashboard={() => navigate('/dashboard')}
      />
      <AdvisorPanel isOpen={advisorOpen} onClose={() => setAdvisorOpen(false)} farmId="FARM-74-2B" />
    </div>
  );
};
