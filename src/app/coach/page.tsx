'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Player } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';
import { getCampDay, getDayProgram } from '@/lib/program';

type PlayerWithStats = Player & { present: boolean; completionPct: number };

const PHASE_META: Record<string, { accent: string; dim: string; border: string }> = {
  Foundation: { accent: '#68dba9', dim: 'rgba(104,219,169,0.08)', border: 'rgba(104,219,169,0.2)' },
  Build:      { accent: '#adc6ff', dim: 'rgba(173,198,255,0.08)', border: 'rgba(173,198,255,0.2)' },
  Peak:       { accent: '#ffb77c', dim: 'rgba(255,183,124,0.08)', border: 'rgba(255,183,124,0.2)' },
  Taper:      { accent: '#d4a8ff', dim: 'rgba(212,168,255,0.08)', border: 'rgba(212,168,255,0.2)' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function CoachDashboard() {
  const router = useRouter();
  const [coachName, setCoachName] = useState('Coach');
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const campDay = getCampDay();
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
      if (!me?.is_coach) { router.push('/player'); return; }
      setCoachName((me as Player).name?.split(' ')[0] ?? 'Coach');

      const { data: allPlayers } = await supabase.from('players').select('*').eq('is_coach', false);
      if (!allPlayers) { setLoading(false); return; }

      const { data: attendance } = await supabase.from('attendance').select('*').eq('date', today);
      const { data: completions } = await supabase.from('exercise_completions').select('*').eq('day_number', campDay).eq('date', today);

      const enriched: PlayerWithStats[] = allPlayers.map(p => {
        const present = attendance?.some(a => a.player_id === p.id && a.present) ?? false;
        const playerCompletions = completions?.filter(c => c.player_id === p.id) ?? [];
        const completed = playerCompletions.filter(c => c.completed).length;
        const total = playerCompletions.length;
        return { ...p, present, completionPct: total > 0 ? Math.round((completed / total) * 100) : 0 };
      });

      enriched.sort((a, b) => (b.present ? 1 : 0) - (a.present ? 1 : 0) || b.completionPct - a.completionPct);
      setPlayers(enriched);
      setLoading(false);
    }
    load();
  }, [router, today, campDay]);

  const presentCount = players.filter(p => p.present).length;
  const absentCount = players.length - presentCount;
  const attendanceRate = players.length > 0 ? Math.round((presentCount / players.length) * 100) : 0;
  const avgCompletion = players.length > 0
    ? Math.round(players.reduce((acc, p) => acc + p.completionPct, 0) / players.length)
    : 0;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading dashboard...</p>
    </div>
  );

  return (
    <div style={{ background: '#0f1511', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px' }}>

        {/* Header */}
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
            style={{ background: 'none', border: 'none', color: '#87948b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          </button>
        </header>

        <main style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Hero */}
          <div style={{ background: '#1b211d', border: `1px solid ${meta.border}`, borderRadius: '20px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${meta.dim} 0%, transparent 65%)` }} />
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: meta.dim, filter: 'blur(40px)' }} />
            <div style={{ position: 'relative' }}>
              <p style={{ fontSize: '13px', color: '#87948b', fontFamily: 'Geist, sans-serif', marginBottom: '4px' }}>{dateStr}</p>
              <h1 style={{ fontSize: '26px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {getGreeting()},<br />
                <span style={{ color: meta.accent }}>{coachName}</span> 🏸
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

          {/* Today's snapshot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Present', value: `${presentCount}/${players.length}`, icon: 'how_to_reg', color: presentCount === players.length ? '#68dba9' : presentCount > 0 ? '#ffd080' : '#ffb4ab' },
              { label: 'Absent', value: absentCount, icon: 'person_off', color: absentCount === 0 ? '#68dba9' : '#ffb4ab' },
              { label: 'Avg Done', value: `${avgCompletion}%`, icon: 'insights', color: avgCompletion >= 70 ? '#68dba9' : avgCompletion >= 40 ? '#ffd080' : '#87948b' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '14px', padding: '14px 12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: stat.color, fontVariationSettings: "'FILL' 1", display: 'block', marginBottom: '6px' }}>{stat.icon}</span>
                <p style={{ fontSize: '22px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Attendance rate bar */}
          <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '14px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today&apos;s Attendance</span>
              <span style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: attendanceRate === 100 ? '#68dba9' : '#dee4de' }}>{attendanceRate}%</span>
            </div>
            <div style={{ height: '8px', background: '#252b28', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '100px', width: `${attendanceRate}%`, transition: 'width 0.6s ease',
                background: attendanceRate === 100 ? '#68dba9' : attendanceRate >= 75 ? '#ffd080' : '#ffb4ab',
              }} />
            </div>
          </div>

          {/* Who's here — avatar bubbles */}
          {players.length > 0 && (
            <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '14px', padding: '16px' }}>
              <p style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Roll Call</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {players.map(p => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/player/${p.id}`)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%', background: '#252b28',
                      border: `2px solid ${p.present ? '#68dba9' : '#3d4a42'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                      color: p.present ? '#dee4de' : '#87948b',
                      opacity: p.present ? 1 : 0.5,
                      position: 'relative',
                    }}>
                      {initials(p.name)}
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: '11px', height: '11px', borderRadius: '50%',
                        background: p.present ? '#68dba9' : '#3d4a42',
                        border: '2px solid #1b211d',
                      }} />
                    </div>
                    <span style={{ fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: p.present ? '#bccac0' : '#87948b', maxWidth: '44px', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Squad roster */}
          <div>
            <p style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Squad Roster</p>

            {players.length === 0 ? (
              <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#87948b', fontSize: '40px', display: 'block', marginBottom: '8px' }}>group_add</span>
                <p style={{ color: '#bccac0', fontFamily: 'Geist, sans-serif', fontSize: '14px' }}>No players yet. Share the app link with your athletes.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {players.map(player => (
                  <div
                    key={player.id}
                    onClick={() => router.push(`/player/${player.id}`)}
                    style={{
                      background: player.present ? 'rgba(104,219,169,0.04)' : '#1b211d',
                      border: `1px solid ${player.present ? 'rgba(104,219,169,0.15)' : '#3d4a42'}`,
                      borderRadius: '12px', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      cursor: 'pointer', opacity: player.present ? 1 : 0.65,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%', background: '#252b28',
                        border: `2px solid ${player.present ? '#68dba9' : '#3d4a42'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de',
                      }}>
                        {initials(player.name)}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: player.present ? '#68dba9' : '#3d4a42',
                        border: '2px solid #1b211d',
                      }} />
                    </div>

                    {/* Name + progress */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '15px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</span>
                        <span style={{ fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: player.present ? '#68dba9' : '#87948b', flexShrink: 0, marginLeft: '8px' }}>
                          {player.present ? `${player.completionPct}%` : '—'}
                        </span>
                      </div>
                      <div style={{ height: '4px', background: '#252b28', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '100px', width: `${player.completionPct}%`, transition: 'width 0.5s ease',
                          background: player.completionPct >= 80 ? '#68dba9' : player.completionPct >= 50 ? '#ffd080' : '#ffb4ab',
                        }} />
                      </div>
                    </div>

                    <span className="material-symbols-outlined" style={{ color: '#3d4a42', fontSize: '18px', flexShrink: 0 }}>chevron_right</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
        <BottomNav role="coach" />
      </div>
    </div>
  );
}
