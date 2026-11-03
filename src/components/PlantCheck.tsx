import React, { useRef, useState } from 'react';
import { Bug, Camera, FlaskConical, ImageUp, Leaf, LoaderCircle, RotateCcw, Sprout, TriangleAlert } from 'lucide-react';
import { agriApi, VisionAnalysisResult } from '../services/api';
import { Badge, Button, Card, CardHeader, cn, PageHeader } from './ui';

const SAMPLES = [
  { file: 'mango_leaf_anthracnose.png', label: 'Mango leaf with spots' },
  { file: 'chlorosis_stunted_leaf.png', label: 'Yellowing leaf' },
  { file: 'arugampul_weed.png', label: 'Weeds in the field' },
  { file: 'guava_tree_canopy.png', label: 'Guava tree' },
];

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Strip emoji / shouting from model labels for display */
const tidy = (s?: string | null) => (s ?? '').replace(/[⚠️✅❌]/gu, '').trim();

function conditionTone(condition: string): 'good' | 'warn' | 'bad' {
  const c = condition.toLowerCase();
  if (c.includes('rejected') || c.includes('severe')) return 'bad';
  if (c.includes('optimal') || c.includes('healthy')) return 'good';
  return 'warn';
}

export const PlantCheck: React.FC = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = async (dataUrl: string, filename: string) => {
    setPreview(dataUrl);
    setResult(null);
    setError(null);
    setLoading(true);
    const res = await agriApi.analyzeCropImage(dataUrl, filename);
    setLoading(false);
    if (res) setResult(res);
    else setError("We couldn't reach the plant check service. Make sure the AgriStack server is running, then try again.");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    analyze(await readAsDataUrl(file), file.name);
    e.target.value = '';
  };

  const onSample = async (file: string) => {
    const blob = await (await fetch(`/test-samples/${file}`)).blob();
    analyze(await readAsDataUrl(blob), file);
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const condition = tidy(result?.condition);
  const tone = conditionTone(condition);
  const weed = tidy(result?.weed_detected);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant check"
        description="Take a clear photo of a leaf or plant. We'll tell you if it looks healthy, spot common diseases and weeds, and suggest what to do."
      />

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />

      {!preview ? (
        <>
          <Card className="p-8 sm:p-10 text-center border-dashed bg-surface">
            <span className="mx-auto grid h-16 w-16 -rotate-6 place-items-center rounded-lg border-2 border-ink bg-brand-500 shadow-brutal-sm">
              <Camera className="h-8 w-8" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-2xl uppercase text-ink">Add a photo of your plant</h2>
            <p className="mx-auto mt-1 max-w-md text-[15px] text-muted">
              For best results, photograph one leaf up close in daylight, filling most of the picture.
            </p>
            <Button size="lg" icon={ImageUp} className="mt-6" onClick={() => fileRef.current?.click()}>
              Take or upload a photo
            </Button>
          </Card>

          <section aria-labelledby="samples-heading" className="space-y-3">
            <h2 id="samples-heading" className="font-display text-xl uppercase tracking-tight text-ink">Or try an example</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLES.map((s) => (
                <button
                  key={s.file}
                  onClick={() => onSample(s.file)}
                  className="group overflow-hidden rounded-lg border-2 border-ink bg-surface text-left shadow-brutal press cursor-pointer"
                >
                  <img src={`/test-samples/${s.file}`} alt="" className="aspect-square w-full object-cover" />
                  <div className="px-3 py-2.5 text-sm font-medium text-ink">{s.label}</div>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <Card className="overflow-hidden">
            <img src={preview} alt="Your plant photo" className="aspect-square w-full object-cover" />
            <div className="p-4">
              <Button variant="secondary" icon={RotateCcw} onClick={reset} className="w-full">
                Check another photo
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            {loading && (
              <Card className="flex items-center gap-4 p-6">
                <LoaderCircle className="h-6 w-6 animate-spin text-brand-500" aria-hidden="true" />
                <div>
                  <div className="text-base font-bold text-ink">Checking your plant…</div>
                  <p className="text-[15px] text-muted">This usually takes a few seconds.</p>
                </div>
              </Card>
            )}

            {error && (
              <Card tone="bad" className="flex items-start gap-4 p-6">
                <TriangleAlert className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-base font-bold text-ink">Couldn't check this photo</div>
                  <p className="text-[15px] text-muted">{error}</p>
                </div>
              </Card>
            )}

            {result && (
              <>
                <Card className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={tone} dot>{tone === 'good' ? 'Looks healthy' : tone === 'bad' ? 'Needs action' : 'Keep an eye on it'}</Badge>
                    {result.confidence > 0 && (
                      <Badge>{Math.round(result.confidence > 1 ? result.confidence : result.confidence * 100)}% sure</Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-ink leading-snug">{condition || 'No problems found'}</h2>
                  <p className="flex items-center gap-2 text-[15px] text-muted">
                    <Leaf className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {tidy(result.plant_type)}
                  </p>
                </Card>

                {(weed || result.pest_count > 0) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {weed && weed !== 'N/A' && (
                      <Card className="p-5">
                        <CardHeader icon={Sprout} tone="warn" title="Weed found" description={weed} />
                      </Card>
                    )}
                    {result.pest_count > 0 && (
                      <Card className="p-5">
                        <CardHeader icon={Bug} tone="bad" title={`${result.pest_count} pest${result.pest_count > 1 ? 's' : ''} spotted`} description="Look under the leaves and nearby plants too." />
                      </Card>
                    )}
                  </div>
                )}

                {result.bio_treatment && (
                  <Card className="p-5 sm:p-6">
                    <CardHeader icon={Leaf} tone="good" title="What to do" />
                    <p className="mt-3 text-[15px] leading-relaxed text-ink">{tidy(result.bio_treatment)}</p>
                  </Card>
                )}

                {result.npk_recommendation && (
                  <Card className="p-5 sm:p-6">
                    <CardHeader icon={FlaskConical} tone="warn" title="Fertiliser advice" />
                    <p className={cn('mt-3 text-[15px] leading-relaxed text-ink')}>{tidy(result.npk_recommendation)}</p>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
