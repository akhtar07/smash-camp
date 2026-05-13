'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Player } from '@/lib/supabase';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { getCampDay } from '@/lib/program';

type PlayerWithAttendance = Player & { present: boolean; completionPct: number };

export default function CoachDashboard() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const campDay = getCampDay();

  useEffect(() => {
    async function load() {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) { router.push('/'); return; }

      const { data: me } = await supabase.from('players').select('is_coach').eq('id', user.user.id).single();
      if (!me?.is_coach) { router.push('/player'); return; }

      const { data: allPlayers } = await supabase.from('players').select('*').eq('is_coach', false);
      if (!allPlayers) { setLoading(false); return; }

      const { data: attendance } = await supabase.from('attendance').select('*').eq('date', today);
      const { data: completions } = await supabase.from('exercise_completions').select('*').eq('day_number', campDay).eq('date', today);

      const enriched: PlayerWithAttendance[] = allPlayers.map(p => {
        const present = attendance?.some(a => a.player_id === p.id && a.present) ?? false;
        const playerCompletions = completions?.filter(c => c.player_id === p.id) ?? [];
        const completed = playerCompletions.filter(c => c.completed).length;
        const total = playerCompletions.length;
        return { ...p, present, completionPct: total > 0 ? Math.round((completed / total) * 100) : 0 };
      });

      setPlayers(enriched);
      setLoading(false);
    }
    load();
  }, [router, today, campDay]);

  const presentCount = players.filter(p => p.present).length;
  const avgCompletion = players.length > 0 ? Math.round(players.reduce((acc, p) => acc + p.completionPct, 0) / players.length) : 0;

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading squad...</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f1511', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px' }}>
        <TopBar />
        <main style={{ padding: '16px 20px 100px' }}>
          {/* Date Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#bccac0', marginBottom: '4px' }}>
                Coach Dashboard
              </p>
              <h2 style={{ fontSize: '24px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de', letterSpacing: '-0.02em' }}>
                {dateStr}
              </h2>
              <p style={{ fontSize: '13px', color: '#87948b', marginTop: '2px' }}>Day {campDay} of 45</p>
            </div>
          </div>

          {/* Stats Bento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '16px' }}>groups</span>
                <span style={{ fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#bccac0' }}>Attendance</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '32px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de', letterSpacing: '-0.02em', lineHeight: 1 }}>{presentCount}</span>
                <span style={{ fontSize: '14px', color: '#bccac0' }}>/{players.length}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#bccac0', marginTop: '4px' }}>Present Today</p>
            </div>
            <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '16px' }}>monitoring</span>
                <span style={{ fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#bccac0' }}>Performance</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '32px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de', letterSpacing: '-0.02em', lineHeight: 1 }}>{avgCompletion}</span>
                <span style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de' }}>%</span>
              </div>
              <p style={{ fontSize: '13px', color: '#bccac0', marginTop: '4px' }}>Avg. Completion</p>
            </div>
          </div>

          {/* Squad Roster */}
          <h3 style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de', marginBottom: '16px', borderBottom: '1px solid #3d4a42', paddingBottom: '8px' }}>
            Squad Roster
          </h3>

          {players.length === 0 && (
            <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: '#87948b', fontSize: '40px', display: 'block', marginBottom: '8px' }}>group_add</span>
              <p style={{ color: '#bccac0', fontFamily: 'Inter, sans-serif' }}>No players yet. Share the app link so athletes can sign up.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {players.map(player => (
              <div
                key={player.id}
                onClick={() => router.push(`/player/${player.id}`)}
                style={{
                  background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px',
                  opacity: player.present ? 1 : 0.7, cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #3d4a42' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#252b28', border: '1px solid #87948b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dee4de', fontFamily: 'Geist, sans-serif', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                      {player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#dee4de' }}>{player.name}</h4>
                      <p style={{ fontSize: '13px', color: '#bccac0' }}>{player.email}</p>
                    </div>
                  </div>
                  <div style={{
                    background: player.present ? 'rgba(104,219,169,0.15)' : 'rgba(255,180,171,0.15)',
                    color: player.present ? '#68dba9' : '#ffb4ab',
                    border: `1px solid ${player.present ? 'rgba(104,219,169,0.3)' : 'rgba(255,180,171,0.3)'}`,
                    padding: '4px 8px', borderRadius: '100px', fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em',
                  }}>
                    {player.present ? 'PRESENT' : 'ABSENT'}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion</span>
                    <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: player.present ? '#68dba9' : '#bccac0' }}>
                      {player.present ? `${player.completionPct}%` : '--'}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#303632', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#68dba9', borderRadius: '100px', width: `${player.completionPct}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        <BottomNav role="coach" />
      </div>
    </div>
  );
}
