'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Player } from '@/lib/supabase';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { getCampDay, getDayProgram } from '@/lib/program';

const phaseColors: Record<string, string> = {
  Foundation: '#68dba9',
  Build: '#adc6ff',
  Peak: '#ffb3ae',
  Taper: '#c4aaff',
};

export default function PlayerDashboard() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [attendedToday, setAttendedToday] = useState(false);
  const [completionPct, setCompletionPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const campDay = getCampDay();
  const today = new Date().toISOString().split('T')[0];
  const program = getDayProgram(campDay);
  const phaseColor = program ? phaseColors[program.phase] || '#68dba9' : '#68dba9';
  const overallPct = Math.round((campDay / 45) * 100);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push('/'); return; }

      const { data: me } = await supabase.from('players').select('*').eq('id', auth.user.id).single();
      if (!me) { router.push('/'); return; }
      if (me.is_coach) { router.push('/coach'); return; }
      setPlayer(me);

      const { data: att } = await supabase.from('attendance').select('*').eq('player_id', auth.user.id).eq('date', today).single();
      setAttendedToday(!!att?.present);

      const { data: completions } = await supabase.from('exercise_completions')
        .select('*').eq('player_id', auth.user.id).eq('day_number', campDay).eq('date', today);

      if (completions && completions.length > 0) {
        const done = completions.filter(c => c.completed).length;
        setCompletionPct(Math.round((done / completions.length) * 100));
      }

      setLoading(false);
    }
    load();
  }, [router, today, campDay]);

  async function logAttendance() {
    if (!player || attendedToday || marking) return;
    setMarking(true);
    await supabase.from('attendance').upsert({ player_id: player.id, date: today, present: true });
    setAttendedToday(true);
    setMarking(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f1511', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px' }}>
        <TopBar />
        <main style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Player Status Card */}
          <section style={{ background: '#171d19', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #3d4a42' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de' }}>{player?.name}</h1>
                <p style={{ fontSize: '13px', color: '#bccac0' }}>Elite Track</p>
              </div>
              <div style={{ background: `${phaseColor}20`, color: phaseColor, border: `1px solid ${phaseColor}4d`, padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em' }}>
                {program?.phase?.toUpperCase() || 'PHASE 1'}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#bccac0', marginBottom: '4px' }}>CURRENT BLOCK</p>
                <p style={{ fontSize: '24px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: phaseColor, letterSpacing: '-0.02em' }}>
                  Day {campDay} — {program?.phase}
                </p>
              </div>
              <div style={{ height: '8px', background: '#252b28', borderRadius: '100px', border: '1px solid #3d4a42', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ height: '100%', background: phaseColor, borderRadius: '100px', width: `${overallPct}%`, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#bccac0', marginTop: '4px' }}>
                <span>{overallPct}% Complete</span>
                <span>{campDay}/45 Days</span>
              </div>
            </div>

            {/* Attendance Button */}
            <button
              onClick={logAttendance}
              disabled={attendedToday || marking}
              style={{
                width: '100%', background: attendedToday ? '#252b28' : '#68dba9',
                color: attendedToday ? '#87948b' : '#002114',
                border: attendedToday ? '1px solid #3d4a42' : 'none',
                borderRadius: '8px', padding: '14px',
                fontSize: '14px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                letterSpacing: '0.02em', textTransform: 'uppercase',
                cursor: attendedToday ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: attendedToday ? "'FILL' 1" : "'FILL' 0" }}>
                {attendedToday ? 'check_circle' : 'login'}
              </span>
              {marking ? 'Logging...' : attendedToday ? 'Attendance Logged ✓' : 'Log Attendance'}
            </button>
          </section>

          {/* Today's Session */}
          {program && (
            <section style={{ background: '#171d19', border: '1px solid #3d4a42', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #3d4a42', background: 'rgba(27,33,29,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: phaseColor, fontSize: '22px' }}>fitness_center</span>
                  Today&apos;s Session
                </h2>
                {completionPct > 0 && (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: phaseColor }}>{completionPct}%</span>
                )}
              </div>
              <div>
                {program.blocks.map(block => (
                  <div key={block.block} style={{ borderBottom: '1px solid #3d4a42' }}>
                    <p style={{ padding: '8px 16px', fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#bccac0', background: '#1b211d' }}>
                      {block.block}
                    </p>
                    {block.exercises.map(ex => (
                      <div key={ex.name} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(61,74,66,0.4)' }}>
                        <div>
                          <p style={{ fontSize: '15px', color: '#dee4de', fontFamily: 'Inter, sans-serif' }}>{ex.name}</p>
                          <p style={{ fontSize: '13px', color: '#bccac0', marginTop: '2px' }}>{ex.sets} sets × {ex.reps}</p>
                        </div>
                        <span className="material-symbols-outlined" style={{ color: '#3d4a42', fontSize: '22px' }}>play_circle</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push(`/session/${campDay}`)}
                style={{
                  width: '100%', background: '#25a475', color: '#002114',
                  border: 'none', padding: '16px',
                  fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>play_circle</span>
                Start Session — Day {campDay}
              </button>
            </section>
          )}
        </main>
        <BottomNav role="player" />
      </div>
    </div>
  );
}
