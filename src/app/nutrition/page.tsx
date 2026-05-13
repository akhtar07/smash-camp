'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

const MEALS = [
  { time: '05:15 AM', meal: 'Pre-workout', foods: 'Banana + oats + coffee', tip: 'Never train dehydrated. Eat 90 mins before court.', icon: 'alarm', color: '#ffb77c' },
  { time: '08:15 AM', meal: 'Recovery Meal', foods: 'Eggs / paneer + rice', tip: 'Consume protein within 30 min of session end.', icon: 'restaurant', color: '#68dba9' },
  { time: '11:00 AM', meal: 'Snack', foods: 'Greek yogurt + nuts', tip: 'Avoid junk sugar — keep energy stable.', icon: 'nutrition', color: '#adc6ff' },
  { time: '01:30 PM', meal: 'Lunch', foods: 'Rice + dal + chicken / paneer', tip: 'Add colorful vegetables every day.', icon: 'lunch_dining', color: '#68dba9' },
  { time: '05:00 PM', meal: 'Evening Snack', foods: 'Smoothie + fruit', tip: 'Add omega-3 sources for recovery.', icon: 'local_cafe', color: '#d4a8ff' },
  { time: '08:00 PM', meal: 'Dinner', foods: 'Chapati + protein + salad', tip: 'Light dinner improves sleep quality.', icon: 'dinner_dining', color: '#adc6ff' },
];

const HYDRATION_GOAL = 3000;
const HYDRATION_STEP = 250;

export default function NutritionPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [loggedMeals, setLoggedMeals] = useState<Set<string>>(new Set());
  const [hydration, setHydration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push('/'); return; }
      setUserId(auth.user.id);

      const { data: me } = await supabase.from('players').select('is_coach').eq('id', auth.user.id).single();
      setIsCoach(!!me?.is_coach);

      const { data: logs } = await supabase.from('nutrition_logs')
        .select('meal_name, hydration_ml').eq('player_id', auth.user.id).eq('date', today);

      if (logs) {
        const meals = new Set(logs.filter(l => l.meal_name && l.meal_name !== '__hydration__').map(l => l.meal_name as string));
        setLoggedMeals(meals);
        const totalHydration = logs.reduce((sum, l) => sum + (l.hydration_ml || 0), 0);
        setHydration(totalHydration);
      }
      setLoading(false);
    }
    load();
  }, [router, today]);

  async function logMeal(mealName: string) {
    if (!userId || loggedMeals.has(mealName) || logging) return;
    setLogging(mealName);
    await supabase.from('nutrition_logs').upsert({ player_id: userId, date: today, meal_name: mealName, hydration_ml: 0 }, { onConflict: 'player_id,date,meal_name' });
    setLoggedMeals(prev => new Set([...prev, mealName]));
    setLogging(null);
  }

  async function addHydration() {
    if (!userId) return;
    const newVal = Math.min(hydration + HYDRATION_STEP, HYDRATION_GOAL);
    setHydration(newVal);
    await supabase.from('nutrition_logs').upsert({ player_id: userId, date: today, meal_name: '__hydration__', hydration_ml: newVal }, { onConflict: 'player_id,date,meal_name' });
  }

  const mealsLogged = loggedMeals.size;
  const hydrationPct = Math.min((hydration / HYDRATION_GOAL) * 100, 100);
  const circumference = 2 * Math.PI * 38;
  const mealOffset = circumference - (circumference * (mealsLogged / MEALS.length));
  const allDone = mealsLogged === MEALS.length;
  const hydrationDone = hydration >= HYDRATION_GOAL;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading nutrition...</p>
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
            <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>restaurant</span>
            <span style={{ fontSize: '14px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#dee4de' }}>Nutrition</span>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            style={{ background: 'none', border: 'none', color: '#87948b', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          </button>
        </header>

        <main style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Hero */}
          <div>
            <p style={{ fontSize: '13px', color: '#87948b', fontFamily: 'Geist, sans-serif' }}>{dateStr}</p>
            <h1 style={{ fontSize: '26px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de', lineHeight: 1.1, letterSpacing: '-0.02em', marginTop: '2px' }}>
              {allDone ? 'Perfect day! 🎉' : `${MEALS.length - mealsLogged} meals to go`}
            </h1>
            <p style={{ fontSize: '13px', color: '#87948b', marginTop: '4px' }}>Fuel your performance · {mealsLogged}/{MEALS.length} logged</p>
          </div>

          {/* Progress bento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

            {/* Meals ring */}
            <div style={{ background: '#1b211d', border: `1px solid ${allDone ? 'rgba(104,219,169,0.3)' : '#3d4a42'}`, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative', overflow: 'hidden' }}>
              {allDone && <div style={{ position: 'absolute', inset: 0, background: 'rgba(104,219,169,0.05)' }} />}
              <div style={{ position: 'relative', width: '84px', height: '84px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                  <circle cx="42" cy="42" r="38" fill="transparent" stroke="#252b28" strokeWidth="7" />
                  <circle cx="42" cy="42" r="38" fill="transparent" stroke={allDone ? '#68dba9' : '#68dba9'} strokeWidth="7"
                    strokeDasharray={circumference} strokeDashoffset={mealOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  {allDone
                    ? <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    : <>
                        <span style={{ fontSize: '22px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de', lineHeight: 1 }}>{mealsLogged}</span>
                        <span style={{ fontSize: '11px', color: '#87948b' }}>/{MEALS.length}</span>
                      </>
                  }
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: allDone ? '#68dba9' : '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {allDone ? 'All Done!' : 'Meals'}
                </p>
              </div>
            </div>

            {/* Hydration */}
            <div style={{ background: '#1b211d', border: `1px solid ${hydrationDone ? 'rgba(173,198,255,0.3)' : '#3d4a42'}`, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
              {hydrationDone && <div style={{ position: 'absolute', inset: 0, background: 'rgba(173,198,255,0.04)' }} />}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#adc6ff', fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                  <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#adc6ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hydration</span>
                </div>
                <p style={{ fontSize: '28px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: hydrationDone ? '#adc6ff' : '#dee4de', lineHeight: 1 }}>
                  {(hydration / 1000).toFixed(1)}<span style={{ fontSize: '15px', fontWeight: 600, color: '#87948b' }}>L</span>
                </p>
                <p style={{ fontSize: '11px', color: '#87948b', marginTop: '2px' }}>of {HYDRATION_GOAL / 1000}L goal</p>

                {/* Water fill visual */}
                <div style={{ height: '6px', background: '#252b28', borderRadius: '100px', overflow: 'hidden', marginTop: '10px' }}>
                  <div style={{ height: '100%', background: '#adc6ff', borderRadius: '100px', width: `${hydrationPct}%`, transition: 'width 0.4s ease' }} />
                </div>
              </div>
              <button
                onClick={addHydration}
                disabled={hydrationDone}
                style={{
                  marginTop: '12px', width: '100%',
                  background: hydrationDone ? 'rgba(173,198,255,0.1)' : '#adc6ff',
                  color: hydrationDone ? '#adc6ff' : '#001a4d',
                  border: hydrationDone ? '1px solid rgba(173,198,255,0.3)' : 'none',
                  borderRadius: '8px', padding: '9px',
                  fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  cursor: hydrationDone ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{hydrationDone ? 'check' : 'add'}</span>
                {hydrationDone ? 'Goal reached!' : '+250ml'}
              </button>
            </div>
          </div>

          {/* Meals list */}
          <div>
            <p style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Today&apos;s Protocol</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MEALS.map(m => {
                const done = loggedMeals.has(m.meal);
                const isLogging = logging === m.meal;

                return (
                  <div key={m.meal} style={{
                    background: done ? 'rgba(104,219,169,0.04)' : '#1b211d',
                    border: `1px solid ${done ? 'rgba(104,219,169,0.2)' : '#3d4a42'}`,
                    borderRadius: '14px', overflow: 'hidden',
                    transition: 'all 0.3s ease',
                  }}>
                    {/* Top accent */}
                    {done && <div style={{ height: '2px', background: '#68dba9' }} />}

                    <div style={{ padding: '14px 16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      {/* Icon */}
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                        background: done ? 'rgba(104,219,169,0.12)' : `rgba(${m.color === '#ffb77c' ? '255,183,124' : m.color === '#68dba9' ? '104,219,169' : m.color === '#adc6ff' ? '173,198,255' : m.color === '#d4a8ff' ? '212,168,255' : '104,219,169'}, 0.1)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {done
                          ? <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check</span>
                          : <span className="material-symbols-outlined" style={{ color: m.color, fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                        }
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <h3 style={{ fontSize: '15px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: done ? '#68dba9' : '#dee4de' }}>{m.meal}</h3>
                          <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#87948b', background: '#252b28', padding: '2px 8px', borderRadius: '4px', flexShrink: 0 }}>{m.time}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#87948b', marginBottom: done ? 0 : '10px' }}>{m.foods}</p>

                        {!done && (
                          <>
                            <div style={{ background: '#0f1511', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                              <span className="material-symbols-outlined" style={{ color: '#ffb77c', fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>bolt</span>
                              <p style={{ fontSize: '12px', color: '#87948b', fontStyle: 'italic', lineHeight: 1.4 }}>{m.tip}</p>
                            </div>
                            <button
                              onClick={() => logMeal(m.meal)}
                              disabled={!!logging}
                              style={{
                                width: '100%', background: '#68dba9', color: '#002114',
                                border: 'none', borderRadius: '8px', padding: '11px',
                                fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                cursor: logging ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                opacity: isLogging ? 0.7 : 1, transition: 'opacity 0.2s',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_task</span>
                              {isLogging ? 'Logging...' : 'Log Meal'}
                            </button>
                          </>
                        )}
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
