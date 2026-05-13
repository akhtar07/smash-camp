'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';

const MEALS = [
  { time: '05:15 AM', meal: 'Pre-workout', foods: 'Banana + oats + coffee', tip: 'Never train dehydrated. Eat 90 mins before court.' },
  { time: '08:15 AM', meal: 'Recovery Meal', foods: 'Eggs / paneer + rice', tip: 'Consume protein within 30 min of session end.' },
  { time: '11:00 AM', meal: 'Snack', foods: 'Greek yogurt + nuts', tip: 'Avoid junk sugar — keep energy stable.' },
  { time: '01:30 PM', meal: 'Lunch', foods: 'Rice + dal + chicken / paneer', tip: 'Add colorful vegetables every day.' },
  { time: '05:00 PM', meal: 'Evening Snack', foods: 'Smoothie + fruit', tip: 'Add omega-3 sources for recovery.' },
  { time: '08:00 PM', meal: 'Dinner', foods: 'Chapati + protein + salad', tip: 'Light dinner improves sleep quality.' },
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
        const meals = new Set(logs.filter(l => l.meal_name).map(l => l.meal_name as string));
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
    const newVal = hydration + HYDRATION_STEP;
    setHydration(newVal);
    await supabase.from('nutrition_logs').upsert({ player_id: userId, date: today, meal_name: '__hydration__', hydration_ml: newVal }, { onConflict: 'player_id,date,meal_name' });
  }

  const mealsLogged = loggedMeals.size;
  const hydrationPct = Math.min((hydration / HYDRATION_GOAL) * 100, 100);
  const circumference = 2 * Math.PI * 40;
  const mealCircleOffset = circumference - (circumference * (mealsLogged / MEALS.length));

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading nutrition...</p>
    </div>
  );

  return (
    <div style={{ background: '#0f1511', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px' }}>
        <TopBar />
        <main style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Header */}
          <div>
            <h1 style={{ fontSize: '24px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de', letterSpacing: '-0.02em' }}>Nutrition Tracker</h1>
            <p style={{ fontSize: '14px', color: '#bccac0', marginTop: '4px' }}>{dateStr} • Heavy Session Day</p>
          </div>

          {/* Progress Bento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Meals circle */}
            <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(104,219,169,0.03)' }} />
              <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#303632" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#68dba9" strokeWidth="8"
                    strokeDasharray={circumference} strokeDashoffset={mealCircleOffset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de', lineHeight: 1 }}>{mealsLogged}</span>
                  <span style={{ fontSize: '11px', color: '#bccac0' }}>/{MEALS.length}</span>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#bccac0', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Meals Logged</span>
            </div>

            {/* Hydration */}
            <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#adc6ff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>water_drop</span>
                  Hydration
                </span>
                <div style={{ fontSize: '28px', fontFamily: 'Geist, sans-serif', fontWeight: 800, color: '#dee4de', marginTop: '4px', lineHeight: 1 }}>
                  {(hydration / 1000).toFixed(1)}<span style={{ fontSize: '16px', fontWeight: 600 }}>L</span>
                </div>
                <p style={{ fontSize: '12px', color: '#bccac0', marginTop: '2px' }}>of {HYDRATION_GOAL / 1000}L goal</p>
                <div style={{ height: '4px', background: '#303632', borderRadius: '100px', overflow: 'hidden', marginTop: '8px' }}>
                  <div style={{ height: '100%', background: '#adc6ff', borderRadius: '100px', width: `${hydrationPct}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
              <button onClick={addHydration} style={{
                marginTop: '10px', width: '100%', background: '#0566d9', color: '#e6ecff',
                border: 'none', borderRadius: '8px', padding: '8px',
                fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                250ml
              </button>
            </div>
          </div>

          {/* Meals List */}
          <div>
            <h2 style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de', marginBottom: '16px', borderBottom: '1px solid #3d4a42', paddingBottom: '8px' }}>
              Today&apos;s Protocol
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {MEALS.map(m => {
                const done = loggedMeals.has(m.meal);
                const isLogging = logging === m.meal;
                return (
                  <div key={m.meal} style={{
                    background: '#1b211d', border: `1px solid ${done ? 'rgba(104,219,169,0.3)' : '#3d4a42'}`,
                    borderRadius: '12px', padding: '16px',
                    display: 'flex', gap: '16px', alignItems: 'flex-start',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {done && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#68dba9' }} />}
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {done
                        ? <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        : <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #3d4a42' }} />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '16px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de' }}>{m.meal}</h3>
                        <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: done ? '#68dba9' : '#bccac0', background: done ? 'rgba(104,219,169,0.1)' : '#252b28', padding: '2px 8px', borderRadius: '4px' }}>{m.time}</span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#bccac0', marginBottom: done ? '0' : '8px' }}>{m.foods}</p>
                      {!done && (
                        <>
                          <div style={{ background: '#0f1511', padding: '8px', borderRadius: '6px', border: '1px solid #252b28', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <span className="material-symbols-outlined" style={{ color: '#dd706b', fontSize: '14px', marginTop: '1px' }}>bolt</span>
                            <p style={{ fontSize: '12px', color: '#bccac0', fontStyle: 'italic' }}>{m.tip}</p>
                          </div>
                          <button onClick={() => logMeal(m.meal)} disabled={!!logging} style={{
                            width: '100%', background: '#68dba9', color: '#002114',
                            border: 'none', borderRadius: '8px', padding: '12px',
                            fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            cursor: logging ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            opacity: isLogging ? 0.7 : 1,
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_task</span>
                            {isLogging ? 'Logging...' : 'Log Meal'}
                          </button>
                        </>
                      )}
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
