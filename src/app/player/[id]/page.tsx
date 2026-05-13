'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCampDay } from '@/lib/program';

type PlayerData = { id: string; name: string; email: string; is_coach: boolean };
type SessionData = { day_number: number; date: string; completion_percent: number };

export default function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [attendedDates, setAttendedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const campDay = getCampDay();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push('/'); return; }
      const { data: me } = await supabase.from('players').select('is_coach').eq('id', auth.user.id).single();
      if (!me?.is_coach) { router.push('/player'); return; }

      const { data: p } = await supabase.from('players').select('*').eq('id', id).single();
      setPlayer(p);

      const { data: att } = await supabase.from('attendance').select('date').eq('player_id', id).eq('present', true);
      if (att) setAttendedDates(new Set(att.map(a => a.date)));

      const { data: sess } = await supabase.from('daily_sessions').select('*').eq('player_id', id).order('day_number', { ascending: true });
      if (sess) setSessions(sess);

      setLoading(false);
    }
    load();
  }, [router, id]);

  const daysPresent = attendedDates.size;
  const attendancePct = campDay > 0 ? Math.round((daysPresent / campDay) * 100) : 0;
  const avgCompletion = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.completion_percent, 0) / sessions.length)
    : 0;
  const todayPresent = attendedDates.has(today);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading player...</p>
    </div>
  );

  if (!player) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#ffb4ab' }}>Player not found.</p>
    </div>
  );

  return (
    <div style={{ background: '#0f1511', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px' }}>
        {/* Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#0f1511', borderBottom: '1px solid #3d4a42', display: 'flex', alignItems: 'center', padding: '0 20px', height: '64px', gap: '12px' }}>
          <button onClick={() => router.push('/coach')} style={{ background: 'none', border: 'none', color: '#bccac0', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 style={{ fontSize: '18px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de' }}>{player.name}</h1>
          <div style={{ marginLeft: 'auto', background: todayPresent ? 'rgba(104,219,169,0.15)' : 'rgba(255,180,171,0.15)', color: todayPresent ? '#68dba9' : '#ffb4ab', border: `1px solid ${todayPresent ? 'rgba(104,219,169,0.3)' : 'rgba(255,180,171,0.3)'}`, padding: '4px 10px', borderRadius: '100px', fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em' }}>
            {todayPresent ? 'PRESENT' : 'ABSENT'}
          </div>
        </header>

        <main style={{ padding: '16px 20px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Attendance', value: `${attendancePct}%`, sub: `${daysPresent}/${campDay} days` },
              { label: 'Avg Completion', value: `${avgCompletion}%`, sub: `${sessions.length} sessions` },
              { label: 'Camp Day', value: campDay, sub: 'of 45' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '14px' }}>
                <p style={{ fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{stat.label}</p>
                <p style={{ fontSize: '22px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#68dba9', lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: '#87948b', marginTop: '2px' }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Session History */}
          <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #3d4a42' }}>
              <h2 style={{ fontSize: '16px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de' }}>Session History</h2>
            </div>
            {sessions.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#bccac0', fontSize: '14px' }}>No sessions logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sessions.map(s => (
                  <div key={s.date} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(61,74,66,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: '#dee4de', fontWeight: 600 }}>Day {s.day_number}</p>
                      <p style={{ fontSize: '12px', color: '#87948b' }}>{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '80px', height: '6px', background: '#303632', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: s.completion_percent >= 80 ? '#68dba9' : s.completion_percent >= 50 ? '#adc6ff' : '#ffb3ae', borderRadius: '100px', width: `${s.completion_percent}%` }} />
                      </div>
                      <span style={{ fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de', width: '36px', textAlign: 'right' }}>{s.completion_percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
