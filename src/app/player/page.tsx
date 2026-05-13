'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Player } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';
import { getCampDay, getDayProgram } from '@/lib/program';

const PHASE_META: Record<string, { accent: string; dim: string; border: string; dark: string }> = {
  Foundation: { accent: '#68dba9', dim: 'rgba(104,219,169,0.08)', border: 'rgba(104,219,169,0.2)', dark: '#002114' },
  Build:      { accent: '#adc6ff', dim: 'rgba(173,198,255,0.08)', border: 'rgba(173,198,255,0.2)', dark: '#001a4d' },
  Peak:       { accent: '#ffb77c', dim: 'rgba(255,183,124,0.08)', border: 'rgba(255,183,124,0.2)', dark: '#3d1800' },
  Taper:      { accent: '#d4a8ff', dim: 'rgba(212,168,255,0.08)', border: 'rgba(212,168,255,0.2)', dark: '#1a0040' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function calcStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 45; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (set.has(ds)) streak++;
    else break;
  }
  return streak;
}

export default function PlayerDashboard() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [attendedToday, setAttendedToday] = useState(false);
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [completionPct, setCompletionPct] = useState(0);
  const [avgCompletion, setAvgCompletion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const campDay = getCampDay();
  const today = new Date().toISOString().split('T')[0];
  const program = getDayProgram(campDay);
  const phase = program?.phase ?? 'Foundation';
  const meta = PHASE_META[phase];
  const campPct = Math.round((campDay / 45) * 100);

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push('/'); return; }

      const { data: me } = await supabase.from('players').select('*').eq('id', auth.user.id).single();
      if (!me) { router.push('/'); return; }
      if (me.is_coach) { router.push('/coach'); return; }
      setPlayer(me);

      const { data: att } = await supabase.from('attendance').select('date, present').eq('player_id', auth.user.id).eq('present', true);
      const dates = att?.map(a => a.date) ?? [];
      setAttendanceDates(dates);
      setAttendedToday(dates.includes(today));

      const { data: completions } = await supabase.from('exercise_completions')
        .select('completed').eq('player_id', auth.user.id).eq('day_number', campDay).eq('date', today);
      if (completions && completions.length > 0) {
        setCompletionPct(Math.round(completions.filter(c => c.completed).length / completions.length * 100));
      }

      const { data: sessions } = await supabase.from('daily_sessions').select('completion_percent').eq('player_id', auth.user.id);
      if (sessions && sessions.length > 0) {
        setAvgCompletion(Math.round(sessions.reduce((s, r) => s + r.completion_percent, 0) / sessions.length));
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
    setJustCheckedIn(true);
    setAttendanceDates(prev => [...prev, today]);
    setMarking(false);
    setTimeout(() => setJustCheckedIn(false), 3000);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading...</p>
    </div>
  );

  const daysPresent = attendanceDates.length;
  const attendancePct = campDay > 0 ? Math.round((daysPresent / campDay) * 100) : 0;
  const streak = calcStreak(attendanceDates);
  const firstName = player?.name.split(' ')[0] ?? 'Athlete';

  return (
    <div style={{ background: '#0f1511', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px' }}>

        {/* Top bar with logout */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(15,21,17,0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #3d4a42',
          padding: '0 20px', height: '56px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: meta.accent, fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>sports_tennis</span>
            <span style={{ fontSize: '14px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de', letterSpacing: '0.02em' }}>SMASH CAMP</span>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            style={{ background: 'none', border: 'none', color: '#87948b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'Geist, sans-serif' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          </button>
        </header>

        <main style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Hero greeting */}
          <div style={{ position: 'relative', background: '#1b211d', border: `1px solid ${meta.border}`, borderRadius: '20px', padding: '22px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${meta.dim} 0%, transparent 65%)` }} />
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: meta.dim, filter: 'blur(40px)' }} />
            <div style={{ position: 'relative' }}>
              <p style={{ fontSize: '13px', color: '#87948b', fontFamily: 'Geist, sans-serif', marginBottom: '4px' }}>{dateStr}</p>
              <h1 style={{ fontSize: '26px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {getGreeting()},<br />
                <span style={{ color: meta.accent }}>{firstName}</span> 👋
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                <div style={{ background: meta.dim, border: `1px solid ${meta.border}`, color: meta.accent, padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {phase.toUpperCase()} PHASE
                </div>
                <div style={{ background: 'rgba(61,74,66,0.4)', color: '#bccac0', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700 }}>
                  DAY {campDay} OF 45
                </div>
              </div>
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#87948b', fontFamily: 'Geist, sans-serif' }}>Camp Progress</span>
                  <span style={{ fontSize: '11px', color: meta.accent, fontFamily: 'Geist, sans-serif', fontWeight: 700 }}>{campPct}%</span>
                </div>
                <div style={{ height: '5px', background: '#252b28', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: meta.accent, borderRadius: '100px', width: `${campPct}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance check-in */}
          <div style={{
            background: attendedToday ? 'rgba(104,219,169,0.06)' : '#1b211d',
            border: `1px solid ${attendedToday ? 'rgba(104,219,169,0.3)' : '#3d4a42'}`,
            borderRadius: '16px', padding: '20px',
            position: 'relative', overflow: 'hidden',
            transition: 'all 0.4s ease',
          }}>
            {attendedToday && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(104,219,169,0.06) 0%, transparent 60%)' }} />}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
                background: attendedToday ? 'rgba(104,219,169,0.15)' : '#252b28',
                border: `1px solid ${attendedToday ? 'rgba(104,219,169,0.4)' : '#3d4a42'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: attendedToday ? '#68dba9' : '#87948b', fontVariationSettings: attendedToday ? "'FILL' 1" : "'FILL' 0", transition: 'all 0.3s' }}>
                  {attendedToday ? 'check_circle' : 'where_to_vote'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '16px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: attendedToday ? '#68dba9' : '#dee4de' }}>
                  {justCheckedIn ? "You're in! 🎉" : attendedToday ? 'Attendance Logged' : "Mark Today's Attendance"}
                </p>
                <p style={{ fontSize: '12px', color: '#87948b', marginTop: '2px' }}>
                  {attendedToday ? `${daysPresent} days attended · ${attendancePct}% rate` : 'Let your coach know you showed up'}
                </p>
              </div>
              {!attendedToday && (
                <button
                  onClick={logAttendance}
                  disabled={!!marking}
                  style={{
                    background: '#68dba9', color: '#002114', border: 'none',
                    borderRadius: '10px', padding: '10px 16px',
                    fontSize: '12px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    cursor: marking ? 'not-allowed' : 'pointer',
                    flexShrink: 0, opacity: marking ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {marking ? '...' : "I'm Here"}
                </button>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Attendance', value: `${attendancePct}%`, sub: `${daysPresent}/${campDay} days`, icon: 'calendar_month', color: '#68dba9' },
              { label: 'Streak', value: streak > 0 ? `${streak}d 🔥` : '0d', sub: streak >= 3 ? 'Keep it up!' : 'Start your streak', icon: 'local_fire_department', color: streak >= 3 ? '#ffb77c' : '#87948b' },
              { label: 'Today', value: completionPct > 0 ? `${completionPct}%` : '—', sub: completionPct > 0 ? "Today's session" : 'Not started', icon: 'fitness_center', color: completionPct > 0 ? meta.accent : '#87948b' },
              { label: 'Avg Done', value: avgCompletion > 0 ? `${avgCompletion}%` : '—', sub: 'All sessions', icon: 'insights', color: avgCompletion >= 70 ? '#68dba9' : '#bccac0' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <p style={{ fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: stat.color, fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                </div>
                <p style={{ fontSize: '24px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: '#87948b', marginTop: '4px' }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Today's session */}
          {program && (
            <div style={{ background: '#1b211d', border: `1px solid ${meta.border}`, borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: meta.accent }} />
              <div style={{ padding: '18px 18px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: meta.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Today&apos;s Session</p>
                    <h2 style={{ fontSize: '18px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de' }}>Day {campDay} — {phase}</h2>
                  </div>
                  {completionPct > 0 && (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: `3px solid ${meta.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: meta.accent, lineHeight: 1 }}>{completionPct}</span>
                      <span style={{ fontSize: '9px', color: '#87948b' }}>%</span>
                    </div>
                  )}
                </div>

                {/* Block pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {program.blocks.map(b => (
                    <div key={b.block} style={{ background: '#252b28', border: '1px solid #3d4a42', borderRadius: '100px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px', color: meta.accent }}>
                        {b.block === 'Warm-up' ? 'local_fire_department' : b.block === 'Main' ? 'fitness_center' : 'self_improvement'}
                      </span>
                      <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#bccac0' }}>{b.block}</span>
                      <span style={{ fontSize: '11px', color: '#87948b' }}>· {b.exercises.length}</span>
                    </div>
                  ))}
                </div>

                {/* Exercise preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  {program.blocks.flatMap(b => b.exercises).slice(0, 3).map(ex => (
                    <div key={ex.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#bccac0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                      <span style={{ fontSize: '12px', color: '#87948b', flexShrink: 0 }}>{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                  {program.blocks.flatMap(b => b.exercises).length > 3 && (
                    <p style={{ fontSize: '12px', color: '#87948b', paddingLeft: '16px' }}>+{program.blocks.flatMap(b => b.exercises).length - 3} more exercises</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push(`/session/${campDay}`)}
                style={{
                  width: '100%', background: meta.accent, color: meta.dark,
                  border: 'none', padding: '16px',
                  fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                {completionPct > 0 ? `Continue Session · ${completionPct}% done` : `Start Session · Day ${campDay}`}
              </button>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <p style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Quick Access</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Program', icon: 'calendar_view_month', path: '/program', color: meta.accent },
                { label: 'Squad', icon: 'group', path: '/squad', color: '#adc6ff' },
                { label: 'Nutrition', icon: 'restaurant', path: '/nutrition', color: '#ffb77c' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.path)}
                  style={{
                    background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px',
                    padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: action.color, fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
                  <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', letterSpacing: '0.03em' }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

        </main>
        <BottomNav role="player" />
      </div>
    </div>
  );
}
