import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { askGoals, loadGoalsInterview, resetGoalsInterview, slotsComplete } from '@/services/interview';

export default function Goals() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [state, setState] = useState<{ messages: { role: 'user'|'assistant'; content: string }[]; slots: any }>({ messages: [], slots: {} });
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const s = await loadGoalsInterview();
      setState(s);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.messages.length, thinking]);

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    setThinking(true);
    try {
      const next = await askGoals(state as any, text);
      setState(next);
    } catch (e: any) {
      setState((prev) => ({ ...prev, messages: [...prev.messages, { role: 'assistant', content: `Error: ${e?.message || e}` }] }));
    } finally {
      setThinking(false);
    }
  }

  const canContinue = slotsComplete(state.slots);

  return (
    <div className="grid gap-3">
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Goals Interview (Chat)</h2>
        <div ref={listRef} className="max-h-72 overflow-auto space-y-2">
          {loading ? (
            <div className="text-sm text-muted">Loading…</div>
          ) : state.messages.length === 0 ? (
            <div className="text-sm text-muted">Say hi and tell me what you want to achieve. I will ask brief follow‑ups.</div>
          ) : (
            state.messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-aptum-blue text-white' : 'bg-panel border border-line'}`}>{m.content}</div>
              </div>
            ))
          )}
          {thinking && <div className="text-sm text-muted">Coach is thinking…</div>}
        </div>
        <div className="mt-3 flex gap-2">
          <input className="input flex-1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Type your message…" />
          <button className="btn btn-primary" onClick={send} disabled={thinking}>Send</button>
          <button className="btn" onClick={async () => { await resetGoalsInterview(); const s = await loadGoalsInterview(); setState(s); }}>Reset</button>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={!canContinue} onClick={() => nav('/onboarding/plan', { state: { ...state.slots } })}>Use answers</button>
        <button className="btn" onClick={() => nav('/onboarding/profile')}>Back</button>
      </div>
    </div>
  );
}
