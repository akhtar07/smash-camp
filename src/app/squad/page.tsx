'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCampDay } from '@/lib/program';
import BottomNav from '@/components/BottomNav';

type Player = { id: string; name: string; email: string };
type SquadMember = {
  id: string;
  name: string;
  initials: string;
  presentToday: boolean;
  streak: number;
  attendancePct: number;
  avgCompletion: number;
  score: number;
  daysPresent: number;
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function calcStreak(dates: Set<string>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 45; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (dates.has(ds)) streak++;
    else break;
  }
  return streak;
}

export default function SquadPage() {
  const router = useRouter();
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [loading, setLoading] = useState(true);
  const campDay = getCampDay();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push('/'); return; }
      setCurrentUserId(auth.user.id);

      const { data: me } = await supabase.from('players').select('is_coach').eq('id', auth.user.id).single();
      setIsCoach(!!me?.is_coach);

      const { data: players } = await supabase.from('players').select('id, name, email').eq('is_coach', false);
      if (!players) { setLoading(false); return; }

      const { data: attendance } = await supabase.from('attendance').select('player_id, date').eq('present', true);
      const { data: sessions } = await supabase.from('daily_sessions').select('player_id, completion_percent');

      const squad: SquadMember[] = (players as Player[]).map(p => {
        const playerDates = new Set(attendance?.filter(a => a.player_id === p.id).map(a => a.date) ?? []);
        const daysPresent = playerDates.size;
        const attendancePct = campDay > 0 ? Math.round((daysPresent / campDay) * 100) : 0;
        const playerSessions = sessions?.filter(s => s.player_id === p.id) ?? [];
        const avgCompletion = playerSessions.length > 0
          ? Math.round(playerSessions.reduce((sum, s) => sum + s.completion_percent, 0) / playerSessions.length)
          : 0;
        const score = Math.round(attendancePct * 0.5 + avgCompletion * 0.5);
        const streak = calcStreak(playerDates);
        const presentToday = playerDates.has(today);

        return { id: p.id, name: p.name, initials: getInitials(p.name), presentToday, streak, attendancePct, avgCompletion, score, daysPresent };
      });

      squad.sort((a, b) => (b.presentToday ? 1 : 0) - (a.presentToday ? 1 : 0) || b.score - a.score);
      setMembers(squad);
      setLoading(false);
    }
    load();
  }, [router, campDay, today]);

  const presentCount = members.filter(m => m.presentToday).length;
  const topStreak = members.reduce((max, m) => m.streak > max ? m.streak : max, 0);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading squad...</p>
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
          padding: '0 20px', height: '64px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <h1 style={{ fontSize: '18px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de', flex: 1 }}>The Squad</h1>
          <div style={{ background: presentCount > 0 ? 'rgba(104,219,169,0.12)' : 'rgba(61,74,66,0.4)', border: `1px solid ${presentCount > 0 ? 'rgba(104,219,169,0.3)' : '#3d4a42'}`, color: presentCount > 0 ? '#68dba9' : '#87948b', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em' }}>
            {presentCount} TRAINING NOW
          </div>
        </header>

        <main style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Players', value: members.length, icon: 'group', color: '#68dba9' },
              { label: 'Here Today', value: presentCount, icon: 'sports_martial_arts', color: presentCount > 0 ? '#68dba9' : '#87948b' },
              { label: 'Top Streak', value: `${topStreak}d`, icon: 'local_fire_department', color: topStreak >= 3 ? '#ffb77c' : '#87948b' },
            ].map(stat => (
              <div key={stat.label} style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ color: stat.color, fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                <p style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Present today avatars */}
          {presentCount > 0 && (
            <div style={{ background: '#1b211d', border: '1px solid rgba(104,219,169,0.2)', borderRadius: '14px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(104,219,169,0.06) 0%, transparent 60%)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>sports_martial_arts</span>
                  <h3 style={{ fontSize: '12px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#68dba9', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Training Today</h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {members.filter(m => m.presentToday).map(m => (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#252b28', border: '2px solid #68dba9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de', position: 'relative' }}>
                        {m.initials}
                        <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', background: '#68dba9', border: '2px solid #1b211d' }} />
                      </div>
                      <span style={{ fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#bccac0', maxWidth: '48px', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Full squad list */}
          <div>
            <h3 style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Full Roster</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map((m, idx) => {
                const isMe = m.id === currentUserId;
                const streakHot = m.streak >= 5;
                const streakWarm = m.streak >= 3;

                return (
                  <div
                    key={m.id}
                    onClick={() => isCoach && router.push(`/player/${m.id}`)}
                    style={{
                      background: isMe ? 'rgba(104,219,169,0.06)' : '#1b211d',
                      border: `1px solid ${isMe ? 'rgba(104,219,169,0.25)' : m.presentToday ? 'rgba(104,219,169,0.12)' : '#3d4a42'}`,
                      borderRadius: '12px', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      cursor: isCoach ? 'pointer' : 'default',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {/* Rank */}
                    <span style={{ fontSize: '12px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', width: '20px', flexShrink: 0, textAlign: 'center' }}>
                      {idx + 1}
                    </span>

                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%', background: '#252b28',
                        border: `2px solid ${m.presentToday ? '#68dba9' : '#3d4a42'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de',
                      }}>
                        {m.initials}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0, width: '13px', height: '13px', borderRadius: '50%',
                        background: m.presentToday ? '#68dba9' : '#3d4a42',
                        border: '2px solid #1b211d',
                      }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.name}{isMe ? ' (You)' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {m.streak > 0 && (
                          <span style={{ fontSize: '12px', color: streakHot ? '#ffb77c' : streakWarm ? '#ffd080' : '#bccac0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1", color: streakHot ? '#ffb77c' : streakWarm ? '#ffd080' : '#87948b' }}>local_fire_department</span>
                            {m.streak}d streak
                          </span>
                        )}
                        <span style={{ fontSize: '12px', color: '#bccac0' }}>📅 {m.daysPresent} days</span>
                        <span style={{ fontSize: '12px', color: '#bccac0' }}>💪 {m.avgCompletion}%</span>
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <span style={{ fontSize: '18px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#68dba9' }}>{m.score}</span>
                      {isCoach && <span className="material-symbols-outlined" style={{ display: 'block', color: '#3d4a42', fontSize: '16px', marginTop: '2px' }}>chevron_right</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Link to full leaderboard */}
          <button
            onClick={() => router.push('/leaderboard')}
            style={{ width: '100%', background: 'none', border: '1px solid #3d4a42', borderRadius: '12px', padding: '14px', color: '#bccac0', fontFamily: 'Geist, sans-serif', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>leaderboard</span>
            View Full Leaderboard
          </button>
        </main>

        <BottomNav role={isCoach ? 'coach' : 'player'} />
      </div>
    </div>
  );
}
