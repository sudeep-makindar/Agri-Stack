import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle, MessageCircle, Send, Sprout, Square, Volume2, X } from 'lucide-react';
import { agriApi } from '../services/api';
import { Badge, Button, cn } from './ui';

interface AdvisorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
}

const SUGGESTIONS = [
  { label: 'What fertiliser should I use?', prompt: 'Give a detailed summary of my soil health, NPK levels, and recommended fertilizer dosing.' },
  { label: 'When should I water this week?', prompt: 'What is my current root moisture, ET0 rate, and 7-day irrigation schedule?' },
  { label: 'Are my crops at risk of disease?', prompt: 'Analyze crop foliage health, disease risks based on humidity, and action steps.' },
  { label: 'Give me a full farm summary', prompt: 'Provide a complete agronomic summary of my farm status in English and Tamil.' },
];

const OFFLINE_SAMPLE =
  `**ENGLISH ADVISORY:**\nSoil pH is 6.8 with an NPK ratio of 140:35:180 mg/kg in clay loam soil. Apply 25 kg/ha of nitrogen (urea, 46% N) at the V4 maize growth stage.\n\n**TAMIL ADVISORY (தமிழ் விவசாய ஆலோசனை):**\nமண் pH 6.8 ஆக உள்ளது. NPK விகிதம் 140:35:180 mg/kg. ஹெக்டேருக்கு 25 கிலோ நைட்ரஜன் (யூரியா 46% N) இடுங்கள்.`;

interface Answer {
  question: string;
  english: string;
  tamil: string;
  confidence: number | null;
  offline: boolean;
}

/** Split the bilingual LLM answer into its English and Tamil parts */
function splitBilingual(raw: string): { english: string; tamil: string } {
  const parts = raw.split(/(\*\*TAMIL ADVISORY.*?\*\*|TAMIL ADVISORY:?)/i);
  if (parts.length >= 3) {
    return {
      english: parts[0].replace(/\*\*ENGLISH ADVISORY:?\*\*:?/i, '').trim(),
      tamil: parts.slice(2).join('').trim(),
    };
  }
  return { english: raw.replace(/\*\*ENGLISH ADVISORY:?\*\*:?/i, '').trim(), tamil: '' };
}

/** Light markdown → plain paragraphs (bold kept) */
const RichText: React.FC<{ text: string; lang?: string }> = ({ text, lang }) => (
  <div lang={lang} className="space-y-2 text-[15px] leading-relaxed text-ink">
    {text.split(/\n{1,}/).filter(Boolean).map((line, i) => {
      const clean = line.replace(/^#+\s*/, '').replace(/^[-*]\s+/, '• ');
      const segments = clean.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i}>
          {segments.map((seg, j) =>
            seg.startsWith('**') && seg.endsWith('**') ? <strong key={j}>{seg.slice(2, -2)}</strong> : <React.Fragment key={j}>{seg}</React.Fragment>,
          )}
        </p>
      );
    })}
  </div>
);

export const AdvisorPanel: React.FC<AdvisorPanelProps> = ({ isOpen, onClose, farmId }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [answers, loading]);

  if (!isOpen) return null;

  const stopSpeech = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(null);
  };

  const handleClose = () => {
    stopSpeech();
    onClose();
  };

  const speak = (id: string, text: string, lang: 'en-IN' | 'ta-IN') => {
    if (!('speechSynthesis' in window)) return;
    if (speaking === id) {
      stopSpeech();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*|#+/g, '').replace(/\[.*?\]/g, ''));
    utterance.lang = lang;
    utterance.rate = 0.95;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.split('-')[0]));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setSpeaking(id);
    utterance.onend = () => setSpeaking(null);
    utterance.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(utterance);
  };

  const ask = async (label: string, prompt: string) => {
    if (loading) return;
    stopSpeech();
    setQuestion('');
    setLoading(true);
    const data = await agriApi.askAdvisory(farmId, prompt);
    const raw: string = data?.answer ?? OFFLINE_SAMPLE;
    setAnswers((prev) => [
      ...prev,
      {
        question: label,
        ...splitBilingual(raw),
        confidence: data?.confidence_score ?? null,
        offline: !data,
      },
    ]);
    setLoading(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (q) ask(q, q);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="advisor-title">
      <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={handleClose} />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-canvas shadow-brutal-lg animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-sun-500 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md border-2 border-ink bg-surface">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="advisor-title" className="font-display text-lg uppercase text-ink">Ask AgriStack</h2>
              <p className="text-sm text-ink">Answers use your farm's data, in English and தமிழ்</p>
            </div>
          </div>
          <button onClick={handleClose} className="grid h-10 w-10 place-items-center rounded-md text-ink border-2 border-ink bg-surface hover:bg-sun-500 cursor-pointer" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conversation */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {answers.length === 0 && !loading && (
            <div className="space-y-4">
              <div className="rounded-lg bg-surface border-2 border-ink p-5">
                <p className="text-[15px] text-ink leading-relaxed">
                  Hi! Ask me anything about your farm — watering, fertiliser, pests, or the weather. You can also tap a question below to get started.
                </p>
              </div>
              <div className="space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => ask(s.label, s.prompt)}
                    className="w-full rounded-md border-2 border-ink bg-surface px-4 py-3 text-left text-[15px] font-medium text-ink shadow-brutal-sm press transition-colors cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {answers.map((a, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg rounded-br-none border-2 border-ink bg-brand-500 px-4 py-2.5 text-[15px] font-medium text-ink shadow-brutal-sm">{a.question}</div>
              </div>

              <div className="flex gap-3">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md border-2 border-ink bg-sun-500">
                  <Sprout className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  {a.offline && (
                    <div className="rounded-md border-2 border-dashed border-ink bg-sun-100 px-3 py-2 text-sm font-medium text-ink">
                      The assistant is offline right now, so this is a sample answer.
                    </div>
                  )}
                  <AnswerBlock
                    title="English"
                    text={a.english}
                    speaking={speaking === `${i}-en`}
                    onSpeak={() => speak(`${i}-en`, a.english, 'en-IN')}
                  />
                  {a.tamil && (
                    <AnswerBlock
                      title="தமிழ்"
                      lang="ta"
                      text={a.tamil}
                      speaking={speaking === `${i}-ta`}
                      onSpeak={() => speak(`${i}-ta`, a.tamil, 'ta-IN')}
                      listenLabel="கேளுங்கள்"
                    />
                  )}
                  {a.confidence != null && (
                    <Badge tone="good">{Math.round(a.confidence * 100)}% confident</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-muted">
              <LoaderCircle className="h-5 w-5 animate-spin text-brand-500" aria-hidden="true" />
              <span className="text-[15px]">Looking at your farm data…</span>
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={submit} className="border-t-2 border-ink bg-surface p-4">
          <div className="flex items-end gap-2">
            <label htmlFor="advisor-input" className="sr-only">Your question</label>
            <textarea
              id="advisor-input"
              ref={inputRef}
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) submit(e);
              }}
              placeholder="Type your question…"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-md border-2 border-ink bg-surface px-4 py-2.5 text-[15px] text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none"
            />
            <Button type="submit" icon={Send} disabled={loading || !question.trim()} aria-label="Send question">
              <span className="hidden sm:inline">Ask</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AnswerBlock: React.FC<{
  title: string;
  text: string;
  lang?: string;
  speaking: boolean;
  onSpeak: () => void;
  listenLabel?: string;
}> = ({ title, text, lang, speaking, onSpeak, listenLabel = 'Listen' }) => (
  <div className="rounded-lg rounded-tl-none border-2 border-ink bg-surface p-4 shadow-brutal-sm">
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">{title}</span>
      <button
        onClick={onSpeak}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors cursor-pointer',
          'border-2 border-ink', speaking ? 'bg-sun-500 text-ink' : 'bg-surface text-ink hover:bg-sun-100',
        )}
      >
        {speaking ? <Square className="h-3.5 w-3.5" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
        <span lang={lang}>{speaking ? 'Stop' : listenLabel}</span>
      </button>
    </div>
    <RichText text={text} lang={lang} />
  </div>
);
