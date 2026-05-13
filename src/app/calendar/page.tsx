'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { getCampDay } from '@/lib/program';

export default function CalendarPage() {
  const router = useRouter();
  const [attendedDates, setAttendedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const campDay = getCampDay();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push('/'); return; }
      const { data: me } = await supabase.from('players').select('is_coach').eq('id', auth.user.id).single();
      setIsCoach(!!me?.is_coach);

      const { data: att } = await supabase.from('attendance')
        .select('date').eq('player_id', auth.user.id).eq('present', true);
      if (att) setAttendedDates(new Set(att.map(a => a.date)));
      setLoading(false);
    }
    load();
  }, [router]);

  const attendedCount = attendedDates.size;
  const attendancePct = campDay > 0 ? Math.round((attendedCount / campDay) * 100) : 0;
  const daysLeft = 45 - campDay;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function prevMonth() { setCurrentMonth(new Date(year, month - 1)); }
  function nextMonth() { setCurrentMonth(new Date(year, month + 1)); }

  function getDayStatus(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === today;
    const isFuture = dateStr > today;
    const isAttended = attendedDates.has(dateStr);
    return { dateStr, isToday, isFuture, isAttended };
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading calendar...</p>
    </div>
  );

  return (
    <div style={{ background: '#0f1511', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px' }}>
        <TopBar />
        <main style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Stats Bento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1', background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Camp Attendance</span>
                <span style={{ fontSize: '32px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#68dba9', letterSpacing: '-0.02em', lineHeight: 1 }}>{attendancePct}%</span>
              </div>
              <div style={{ height: '8px', background: '#303632', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#68dba9', borderRadius: '100px', width: `${attendancePct}%`, transition: 'width 0.5s' }} />
              </div>
            </div>
            <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>Present
              </span>
              <div style={{ fontSize: '24px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de' }}>{attendedCount}<span style={{ fontSize: '13px', color: '#bccac0' }}>/{campDay}</span></div>
            </div>
            <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>hourglass_top</span>Left
              </span>
              <div style={{ fontSize: '24px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de' }}>{daysLeft}<span style={{ fontSize: '13px', color: '#bccac0' }}>/45</span></div>
            </div>
            <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>today</span>Day
              </span>
              <div style={{ fontSize: '24px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de' }}>{campDay}</div>
            </div>
          </div>

          {/* Calendar */}
          <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #3d4a42' }}>
              <h2 style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de' }}>{monthName}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: '#bccac0', cursor: 'pointer', padding: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
                </button>
                <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: '#bccac0', cursor: 'pointer', padding: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', opacity: i >= 5 ? 0.5 : 1 }}>{d}</span>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const { isToday, isFuture, isAttended } = getDayStatus(day);
                const isWeekend = (startOffset + i) % 7 >= 5;

                let bg = 'transparent';
                let color = '#bccac0';
                let opacity = 1;
                if (isToday) { bg = '#68dba9'; color = '#002114'; }
                else if (isAttended) { bg = '#252b28'; color = '#dee4de'; }
                else if (isFuture) { opacity = 0.4; }
                else { bg = '#1b211d'; color = '#87948b'; }
                if (isWeekend && !isToday) opacity = 0.5;

                return (
                  <div key={day} style={{
                    aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', borderRadius: '8px', background: bg, color, opacity,
                    fontSize: '13px', fontFamily: 'Inter, sans-serif', position: 'relative',
                    border: !isToday && !isFuture && !isAttended && !isWeekend ? '1px solid #3d4a42' : 'none',
                  }}>
                    {day}
                    {isAttended && !isToday && (
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#68dba9', position: 'absolute', bottom: '3px' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #3d4a42' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#68dba9' }} />
                <span style={{ fontSize: '12px', color: '#bccac0' }}>Today</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#252b28', border: '1px solid #3d4a42' }} />
                <span style={{ fontSize: '12px', color: '#bccac0' }}>Present</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#1b211d', border: '1px solid #3d4a42' }} />
                <span style={{ fontSize: '12px', color: '#bccac0' }}>Absent</span>
              </div>
            </div>
          </div>
        </main>
        <BottomNav role={isCoach ? 'coach' : 'player'} />
      </div>
    </div>
  );
}
