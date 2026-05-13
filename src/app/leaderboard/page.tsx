'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';
import { getCampDay } from '@/lib/program';

type LeaderboardEntry = {
  id: string;
  name: string;
  attendancePct: number;
  avgCompletion: number;
  score: number;
  daysPresent: number;
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
const RANK_BG = ['rgba(255,215,0,0.1)', 'rgba(192,192,192,0.1)', 'rgba(205,127,50,0.1)'];
const RANK_BORDER = ['rgba(255,215,0,0.3)', 'rgba(192,192,192,0.3)', 'rgba(205,127,50,0.3)'];
const RANK_LABELS = ['🥇', '🥈', '🥉'];

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
        return { id: p.id, name: p.name, attendancePct, avgCompletion, score, daysPresent };
      });

      board.sort((a, b) => b.score - a.score);
      setEntries(board);
      setLoading(false);
    }
    load();
  }, [router, campDay]);

  const mvp = entries[0];
  const myEntry = entries.find(e => e.id === currentUserId);
  const myRank = entries.findIndex(e => e.id === currentUserId) + 1;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading leaderboard...</p>
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
            <span className="material-symbols-outlined" style={{ color: '#ffd700', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            <span style={{ fontSize: '14px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de' }}>Leaderboard</span>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            style={{ background: 'none', border: 'none', color: '#87948b', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          </button>
        </header>

        <main style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* MVP Card */}
          {mvp && (
            <div style={{ background: '#1b211d', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,215,0,0.05)', filter: 'blur(40px)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🏆 Camp MVP</p>
                    <p style={{ fontSize: '12px', color: '#87948b', marginTop: '2px' }}>Highest overall score</p>
                  </div>
                  <div style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#ffd700', lineHeight: 1 }}>{mvp.score}</p>
                    <p style={{ fontSize: '10px', color: '#87948b', marginTop: '2px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em' }}>SCORE</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#252b28', border: '2px solid #ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de', flexShrink: 0 }}>
                    {initials(mvp.name)}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de' }}>{mvp.name}</h2>
                    <p style={{ fontSize: '13px', color: '#87948b', marginTop: '2px' }}>{mvp.daysPresent} days attended</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Attendance', value: mvp.attendancePct, color: '#68dba9' },
                    { label: 'Completion', value: mvp.avgCompletion, color: '#adc6ff' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
                      <p style={{ fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{stat.label}</p>
                      <p style={{ fontSize: '22px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}%</p>
                      <div style={{ height: '3px', background: '#252b28', borderRadius: '100px', overflow: 'hidden', marginTop: '8px' }}>
                        <div style={{ height: '100%', background: stat.color, borderRadius: '100px', width: `${stat.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* My rank card (if not #1 and not coach) */}
          {myEntry && myRank > 1 && !isCoach && (
            <div style={{ background: 'rgba(104,219,169,0.06)', border: '1px solid rgba(104,219,169,0.25)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(104,219,169,0.12)', border: '1px solid rgba(104,219,169,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#68dba9', flexShrink: 0 }}>
                {initials(myEntry.name)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#68dba9' }}>Your Rank: #{myRank}</p>
                <p style={{ fontSize: '12px', color: '#87948b', marginTop: '1px' }}>Score {myEntry.score} · {myEntry.attendancePct}% attendance · {myEntry.avgCompletion}% done</p>
              </div>
              <span style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#68dba9' }}>{myEntry.score}</span>
            </div>
          )}

          {/* Full rankings */}
          <div>
            <p style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Full Rankings</p>

            {entries.length === 0 ? (
              <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#87948b', fontSize: '40px', display: 'block', marginBottom: '8px' }}>leaderboard</span>
                <p style={{ color: '#bccac0', fontFamily: 'Geist, sans-serif' }}>No players yet. Share the app link!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {entries.map((entry, idx) => {
                  const isMe = entry.id === currentUserId;
                  const isTop3 = idx < 3;

                  return (
                    <div key={entry.id} style={{
                      background: isMe ? 'rgba(104,219,169,0.06)' : isTop3 ? RANK_BG[idx] : '#1b211d',
                      border: `1px solid ${isMe ? 'rgba(104,219,169,0.25)' : isTop3 ? RANK_BORDER[idx] : '#3d4a42'}`,
                      borderRadius: '12px', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      {/* Rank */}
                      <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                        {isTop3
                          ? <span style={{ fontSize: '20px' }}>{RANK_LABELS[idx]}</span>
                          : <span style={{ fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b' }}>#{idx + 1}</span>
                        }
                      </div>

                      {/* Avatar */}
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                        background: '#252b28',
                        border: `2px solid ${isTop3 ? RANK_COLORS[idx] : isMe ? 'rgba(104,219,169,0.4)' : '#3d4a42'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de',
                      }}>
                        {initials(entry.name)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <span style={{ fontSize: '15px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: isMe ? '#68dba9' : '#dee4de', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.name}{isMe ? ' (You)' : ''}
                          </span>
                          <span style={{ fontSize: '17px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: isTop3 ? RANK_COLORS[idx] : isMe ? '#68dba9' : '#dee4de', flexShrink: 0, marginLeft: '8px' }}>
                            {entry.score}
                          </span>
                        </div>
                        {/* Score breakdown bar */}
                        <div style={{ display: 'flex', height: '4px', borderRadius: '100px', overflow: 'hidden', gap: '2px' }}>
                          <div style={{ height: '100%', background: '#68dba9', borderRadius: '100px', width: `${entry.attendancePct * 0.5}%`, transition: 'width 0.5s' }} />
                          <div style={{ height: '100%', background: '#adc6ff', borderRadius: '100px', width: `${entry.avgCompletion * 0.5}%`, transition: 'width 0.5s' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#68dba9' }}>📅 {entry.attendancePct}%</span>
                          <span style={{ fontSize: '11px', color: '#adc6ff' }}>💪 {entry.avgCompletion}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '4px', borderRadius: '2px', background: '#68dba9' }} />
              <span style={{ fontSize: '11px', color: '#87948b' }}>Attendance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '4px', borderRadius: '2px', background: '#adc6ff' }} />
              <span style={{ fontSize: '11px', color: '#87948b' }}>Completion</span>
            </div>
          </div>

        </main>
        <BottomNav role={isCoach ? 'coach' : 'player'} />
      </div>
    </div>
  );
}
