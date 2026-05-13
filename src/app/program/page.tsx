'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PROGRAM_DATA, getCampDay } from '@/lib/program';
import BottomNav from '@/components/BottomNav';

const PHASE_META: Record<string, { accent: string; dim: string; border: string; textDark: string }> = {
  Foundation: { accent: '#68dba9', dim: 'rgba(104,219,169,0.1)', border: 'rgba(104,219,169,0.25)', textDark: '#002114' },
  Build:      { accent: '#adc6ff', dim: 'rgba(173,198,255,0.1)', border: 'rgba(173,198,255,0.25)', textDark: '#001a4d' },
  Peak:       { accent: '#ffb77c', dim: 'rgba(255,183,124,0.1)', border: 'rgba(255,183,124,0.25)', textDark: '#3d1800' },
  Taper:      { accent: '#d4a8ff', dim: 'rgba(212,168,255,0.1)', border: 'rgba(212,168,255,0.25)', textDark: '#1a0040' },
};

const PHASES = [
  { name: 'Foundation', range: [1, 12],  icon: 'foundation' },
  { name: 'Build',      range: [13, 26], icon: 'trending_up' },
  { name: 'Peak',       range: [27, 38], icon: 'bolt' },
  { name: 'Taper',      range: [39, 45], icon: 'self_improvement' },
];

export default function ProgramPage() {
  const router = useRouter();
  const [isCoach, setIsCoach] = useState(false);
  const [completedDays, setCompletedDays] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const campDay = getCampDay();

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push('/'); return; }
      const { data: me } = await supabase.from('players').select('is_coach').eq('id', auth.user.id).single();
      setIsCoach(!!me?.is_coach);
      const { data: sessions } = await supabase.from('daily_sessions')
        .select('day_number, completion_percent').eq('player_id', auth.user.id);
      if (sessions) {
        const map = new Map<number, number>();
        sessions.forEach(s => map.set(s.day_number, s.completion_percent));
        setCompletedDays(map);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading program...</p>
    </div>
  );

  const currentDay = PROGRAM_DATA.find(d => d.day === campDay);
  const currentPhase = currentDay?.phase ?? 'Foundation';
  const cm = PHASE_META[currentPhase];

  return (
    <div style={{ background: '#0f1511', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px' }}>

        {/* Sticky header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(15,21,17,0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #3d4a42',
          padding: '0 20px', height: '64px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <h1 style={{ fontSize: '18px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de', flex: 1 }}>Training Program</h1>
          <div style={{ background: cm.dim, border: `1px solid ${cm.border}`, color: cm.accent, padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em' }}>
            DAY {campDay} OF 45
          </div>
        </header>

        {/* Hero card */}
        <div style={{ padding: '16px 20px 4px' }}>
          <div style={{ background: '#1b211d', border: `1px solid ${cm.border}`, borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cm.dim} 0%, transparent 65%)` }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <p style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: cm.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{currentPhase} Phase</p>
                <p style={{ fontSize: '32px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de', lineHeight: 1, marginTop: '2px' }}>Day {campDay}</p>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '13px', color: '#bccac0' }}>{completedDays.size} sessions logged</span>
                <span style={{ fontSize: '13px', color: '#bccac0' }}>{45 - campDay} days remaining</span>
              </div>
            </div>
            <div style={{ height: '6px', background: '#252b28', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: cm.accent, borderRadius: '100px', width: `${(campDay / 45) * 100}%`, transition: 'width 0.6s ease' }} />
            </div>
            <button
              onClick={() => router.push(`/session/${campDay}`)}
              style={{
                marginTop: '14px', width: '100%', background: cm.accent, color: cm.textDark,
                border: 'none', borderRadius: '10px', padding: '12px',
                fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              Start Today&apos;s Session
            </button>
          </div>
        </div>

        {/* Phase sections */}
        <main style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {PHASES.map(phase => {
            const meta = PHASE_META[phase.name];
            const phaseDays = PROGRAM_DATA.filter(d => d.day >= phase.range[0] && d.day <= phase.range[1]);
            const phaseCompleted = phaseDays.filter(d => completedDays.has(d.day)).length;
            const isCurrentPhase = phase.name === currentPhase;

            return (
              <div key={phase.name}>
                {/* Phase header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: meta.dim, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: meta.accent, fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>{phase.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h2 style={{ fontSize: '14px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: meta.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{phase.name}</h2>
                      {isCurrentPhase && <span style={{ fontSize: '10px', background: meta.accent, color: meta.textDark, padding: '1px 6px', borderRadius: '4px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em' }}>CURRENT</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#87948b' }}>Days {phase.range[0]}–{phase.range[1]} · {phaseCompleted}/{phaseDays.length} done</p>
                  </div>
                </div>

                {/* Day cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {phaseDays.map(day => {
                    const isToday = day.day === campDay;
                    const isPast = day.day < campDay;
                    const completion = completedDays.get(day.day);
                    const isDone = completion !== undefined && completion > 0;
                    const totalEx = day.blocks.reduce((s, b) => s + b.exercises.length, 0);

                    return (
                      <div
                        key={day.day}
                        onClick={() => router.push(`/session/${day.day}`)}
                        style={{
                          background: isToday ? meta.dim : isDone ? 'rgba(104,219,169,0.04)' : '#1b211d',
                          border: `1px solid ${isToday ? meta.border : isDone ? 'rgba(104,219,169,0.15)' : '#3d4a42'}`,
                          borderRadius: '10px', padding: '12px 14px',
                          display: 'flex', alignItems: 'center', gap: '12px',
                          cursor: 'pointer',
                          opacity: !isPast && !isToday ? 0.55 : 1,
                          transition: 'opacity 0.15s',
                          position: 'relative', overflow: 'hidden',
                        }}
                      >
                        {isToday && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: meta.accent, borderRadius: '0 2px 2px 0' }} />}

                        {/* Day circle */}
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                          background: isToday ? meta.accent : isDone ? 'rgba(104,219,169,0.12)' : '#252b28',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isDone && !isToday
                            ? <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check</span>
                            : <span style={{ fontSize: '15px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: isToday ? meta.textDark : '#dee4de' }}>{day.day}</span>
                          }
                        </div>

                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: isToday ? meta.accent : '#dee4de' }}>Day {day.day}</span>
                            {isToday && <span style={{ fontSize: '9px', fontFamily: 'Geist, sans-serif', fontWeight: 700, background: meta.accent, color: meta.textDark, padding: '2px 5px', borderRadius: '3px', letterSpacing: '0.06em' }}>TODAY</span>}
                          </div>
                          <p style={{ fontSize: '11px', color: '#87948b', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {day.blocks.map(b => b.block).join(' · ')} · {totalEx} exercises
                          </p>
                        </div>

                        {/* Right side */}
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isDone && !isToday && (
                            <span style={{ fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#68dba9' }}>{completion}%</span>
                          )}
                          <span className="material-symbols-outlined" style={{ color: isToday ? meta.accent : '#3d4a42', fontSize: '18px' }}>chevron_right</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </main>

        <BottomNav role={isCoach ? 'coach' : 'player'} />
      </div>
    </div>
  );
}
