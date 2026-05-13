'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getDayProgram } from '@/lib/program';

const blockIcons: Record<string, string> = {
  'Warm-up': 'local_fire_department',
  'Main': 'fitness_center',
  'Cool-down': 'self_improvement',
};

export default function SessionPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = use(params);
  const dayNum = parseInt(day, 10);
  const router = useRouter();
  const program = getDayProgram(dayNum);
  const today = new Date().toISOString().split('T')[0];

  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const allExercises = program?.blocks.flatMap(b => b.exercises.map(e => ({ ...e, block: b.block }))) ?? [];
  const totalExercises = allExercises.length;
  const completedCount = Object.values(checked).filter(Boolean).length;
  const progressPct = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push('/'); return; }
      setUserId(auth.user.id);

      const { data: completions } = await supabase.from('exercise_completions')
        .select('*').eq('player_id', auth.user.id).eq('day_number', dayNum).eq('date', today);

      if (completions) {
        const state: Record<string, boolean> = {};
        completions.forEach(c => { state[c.exercise_name] = c.completed; });
        setChecked(state);
      }
      setLoading(false);
    }
    load();
  }, [router, dayNum, today]);

  async function toggleExercise(exerciseName: string, blockType: string) {
    if (!userId) return;
    const newVal = !checked[exerciseName];
    setChecked(prev => ({ ...prev, [exerciseName]: newVal }));

    await supabase.from('exercise_completions').upsert({
      player_id: userId,
      day_number: dayNum,
      exercise_name: exerciseName,
      block_type: blockType,
      completed: newVal,
      date: today,
    }, { onConflict: 'player_id,day_number,exercise_name,date' });

    // Update daily session summary
    const newCompleted = Object.values({ ...checked, [exerciseName]: newVal }).filter(Boolean).length;
    const pct = totalExercises > 0 ? Math.round((newCompleted / totalExercises) * 100) : 0;
    await supabase.from('daily_sessions').upsert({
      player_id: userId,
      day_number: dayNum,
      date: today,
      completion_percent: pct,
    }, { onConflict: 'player_id,date' });
  }

  if (!program) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#ffb4ab' }}>Session not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#68dba9', fontFamily: 'Geist, sans-serif' }}>Loading session...</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f1511', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* App Bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(15,21,17,0.9)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #3d4a42',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', padding: '0 20px', height: '64px',
        }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#bccac0', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex' }}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 style={{ fontSize: '20px', fontFamily: 'Geist, sans-serif', fontWeight: 600, color: '#dee4de' }}>
            Day {dayNum} — {program.phase}
          </h1>
          <div style={{ width: '40px' }} />
        </header>

        {/* Progress Bar */}
        <section style={{ padding: '12px 20px 8px', background: '#0f1511' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: '#bccac0' }}>Session Progress</span>
            <span style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#68dba9', letterSpacing: '0.05em' }}>
              {completedCount} / {totalExercises} EXERCISES
            </span>
          </div>
          <div style={{ height: '8px', background: '#303632', borderRadius: '100px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#68dba9', borderRadius: '100px', width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
          </div>
        </section>

        {/* Exercise Blocks */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {program.blocks.map(block => (
            <div key={block.block} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #3d4a42', paddingBottom: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '20px' }}>
                  {blockIcons[block.block] || 'fitness_center'}
                </span>
                <h3 style={{ fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#dee4de' }}>
                  {block.block} Phase
                </h3>
              </div>

              {block.exercises.map(exercise => {
                const isDone = !!checked[exercise.name];
                return (
                  <div
                    key={exercise.name}
                    style={{
                      background: isDone ? '#00311f' : '#171d19',
                      border: `1px solid ${isDone ? 'rgba(104,219,169,0.4)' : '#3d4a42'}`,
                      borderRadius: '12px', padding: '16px',
                      display: 'flex', gap: '16px', alignItems: 'flex-start',
                      opacity: isDone ? 0.8 : 1,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <button
                      onClick={() => toggleExercise(exercise.name, block.block)}
                      style={{
                        marginTop: '2px', width: '24px', height: '24px', borderRadius: '50%',
                        background: isDone ? '#68dba9' : 'transparent',
                        border: isDone ? 'none' : '2px solid #3d4a42',
                        flexShrink: 0, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', color: '#002114',
                      }}
                    >
                      {isDone && <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'wght' 700" }}>check</span>}
                    </button>

                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: isDone ? '#68dba9' : '#dee4de', textDecoration: isDone ? 'line-through' : 'none', marginBottom: '6px' }}>
                        {exercise.name}
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: isDone ? 'rgba(188,202,192,0.6)' : '#bccac0' }}>
                        <span>{exercise.sets} Sets</span>
                        <span>{exercise.reps}</span>
                        {exercise.rest !== '-' && <span>Rest: {exercise.rest}</span>}
                        <span>RPE {exercise.rpe}</span>
                      </div>
                      {!isDone && exercise.cue && (
                        <p style={{ fontSize: '13px', color: '#87948b', marginTop: '6px', fontStyle: 'italic' }}>{exercise.cue}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {completedCount === totalExercises && totalExercises > 0 && (
            <div style={{ background: 'rgba(104,219,169,0.1)', border: '1px solid rgba(104,219,169,0.3)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: '#68dba9', fontSize: '32px', display: 'block', marginBottom: '8px', fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              <h3 style={{ fontSize: '18px', fontFamily: 'Geist, sans-serif', fontWeight: 700, color: '#68dba9', marginBottom: '4px' }}>Session Complete!</h3>
              <p style={{ fontSize: '14px', color: '#bccac0' }}>Day {dayNum} done. Rest up and come back strong.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
