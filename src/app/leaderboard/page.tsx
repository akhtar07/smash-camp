'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { getCampDay } from '@/lib/program';

type LeaderboardEntry = {
  id: string;
  name: string;
  email: string;
  attendancePct: number;
  avgCompletion: number;
  score: number;
  daysPresent: number;
};

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [loading, setLoading] = useState(true);
  const campDay = getCampDay();

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push('/'); return; }
      setCurrentUserId(auth.user.id);

      const { data: me } = await supabase.from('players').select('is_coach').eq('id', auth.user.id).single();
      setIsCoach(!!me?.is_coach);

      const { data: players } = await supabase.from('players').select('*').eq('is_coach', false);
      if (!players) { setLoading(false); return; }

      const { data: attendance } = await supabase.from('attendance').select('player_id').eq('present', true);
      const { data: sessions } = await supabase.from('daily_sessions').select('player_id, completion_percent');

      const board: LeaderboardEntry[] = players.map(p => {
        const daysPresent = attendance?.filter(a => a.player_id === p.id).length ?? 0;
        const attendancePct = campDay > 0 ? Math.round((daysPresent / campDay) * 100) : 0;
        const playerSessions = sessions?.filter(s => s.player_id === p.id) ?? [];
        const avgCompletion = playerSessions.length > 0
          ? Math.round(playerSessions.reduce((sum, s) => sum + s.completion_percent, 0) / playerSessions.length)
          : 0;
        const score = Math.round(attendancePct * 0.5 + avgCompletion * 0.5);
        return { id: p.id, name: p.name, email: p.email, attendancePct, avgCompletion, score, daysPresent };
      });

      board.sort((a, b) => b.score - a.score);
      setEntries(board);
      setLoading(false);
    }
    load();
  }, [router, campDay]);

  const mvp = entries[0];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading leaderboard...</p>
    </div>
  );

  return (
    <div style={{ background: '#0f1511', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px' }}>
        <TopBar />
        <main style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Header */}
          <div>
            <h1 style={{ fontSize: '36px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de', letterSpacing: '-0.05em', lineHeight: 1.1 }}>Camp Leaderboard</h1>
            <p style={{ fontSize: '13px', color: '#bccac0', marginTop: '6px' }}>Ranked by attendance + training completion</p>
          </div>

          {/* MVP Card */}
          {mvp && (
            <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(37,164,117,0.15) 0%, transparent 60%)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative' }}>
                <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#68dba9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MVP This Week</span>
                <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '24px', fontVariationSettings: "'FILL' 1" }}>trophy</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#252b28', border: '2px solid #68dba9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de' }}>
                  {mvp.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de' }}>{mvp.name}</h2>
                  <p style={{ fontSize: '13px', color: '#68dba9', marginTop: '2px' }}>Score: {mvp.score}</p>
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '22px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de' }}>{mvp.attendancePct}%</p>
                    <p style={{ fontSize: '11px', color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '22px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de' }}>{mvp.avgCompletion}%</p>
                    <p style={{ fontSize: '11px', color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rankings */}
          <div>
            <h3 style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Full Rankings</h3>
            {entries.length === 0 && (
              <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
                <p style={{ color: '#bccac0' }}>No players yet. Share the app link with athletes!</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entries.map((entry, idx) => {
                const isMe = entry.id === currentUserId;
                return (
                  <div key={entry.id} style={{
                    background: isMe ? 'rgba(104,219,169,0.08)' : '#1b211d',
                    border: `1px solid ${isMe ? 'rgba(104,219,169,0.3)' : '#3d4a42'}`,
                    borderRadius: '12px', padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <span style={{ fontSize: idx < 3 ? '20px' : '14px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: idx < 3 ? undefined : '#bccac0', width: '28px', textAlign: 'center' }}>
                      {idx < 3 ? medals[idx] : `#${idx + 1}`}
                    </span>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#252b28', border: '1px solid #3d4a42', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de', flexShrink: 0 }}>
                      {entry.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '15px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#dee4de' }}>{entry.name}{isMe ? ' (You)' : ''}</span>
                        <span style={{ fontSize: '16px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#68dba9' }}>{entry.score}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#bccac0' }}>📅 {entry.daysPresent} days</span>
                        <span style={{ fontSize: '12px', color: '#bccac0' }}>💪 {entry.avgCompletion}% done</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
        <BottomNav role={isCoach ? 'coach' : 'player'} />
      </div>
    </div>
  );
}
