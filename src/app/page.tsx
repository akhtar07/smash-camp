'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [coachCode, setCoachCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) redirectByRole(data.user.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function redirectByRole(userId: string) {
    const { data } = await supabase.from('players').select('is_coach').eq('id', userId).single();
    if (data?.is_coach) router.push('/coach');
    else router.push('/player');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    if (data.user) await redirectByRole(data.user.id);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const isCoach = coachCode === (process.env.NEXT_PUBLIC_COACH_CODE || 'SMASHCOACH2025');
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('players').insert({ id: data.user.id, name: name || email.split('@')[0], email, is_coach: isCoach });
      await redirectByRole(data.user.id);
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0f1511', border: '1px solid #3d4a42',
    borderRadius: '8px', padding: '12px 12px 12px 40px',
    color: '#dee4de', fontSize: '16px', fontFamily: 'Inter, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontFamily: 'Geist, sans-serif',
    fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
    color: '#bccac0', marginBottom: '4px', marginLeft: '4px',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#0f1511' }}>
      <div style={{ width: '100%', maxWidth: '448px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: '36px', fontWeight: 700, color: '#68dba9', letterSpacing: '-0.05em', textTransform: 'uppercase', lineHeight: 1.1 }}>
            SMASH CAMP
          </h1>
          <p style={{ color: '#bccac0', fontSize: '14px', fontFamily: 'Inter, sans-serif', marginTop: '8px' }}>
            Elite Badminton Training &amp; Analysis
          </p>
        </div>

        <div style={{ background: '#1b211d', border: '1px solid #3d4a42', borderRadius: '12px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, transparent, #25a475, transparent)' }} />

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mode === 'signup' && (
                <div>
                  <label style={labelStyle}>Your Name</label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#87948b', fontSize: '20px' }}>person</span>
                    <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Chen" required />
                  </div>
                </div>
              )}

              <div>
                <label style={labelStyle}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#87948b', fontSize: '20px' }}>mail</span>
                  <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="athlete@smashcamp.co" required />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#87948b', fontSize: '20px' }}>lock</span>
                  <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label style={labelStyle}>Coach Code (optional)</label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#87948b', fontSize: '20px' }}>key</span>
                    <input style={inputStyle} type="text" value={coachCode} onChange={e => setCoachCode(e.target.value)} placeholder="Leave blank if you're a player" />
                  </div>
                  <p style={{ fontSize: '12px', color: '#87948b', marginTop: '4px', marginLeft: '4px' }}>Ask your coach for the code to get coach access</p>
                </div>
              )}

              {error && (
                <p style={{ color: '#ffb4ab', fontSize: '14px', background: 'rgba(147,0,10,0.2)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,180,171,0.2)' }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', background: '#25a475', color: '#00311f',
                    border: 'none', borderRadius: '8px', padding: '16px',
                    fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 0 15px rgba(37,164,117,0.2)',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
                  {!loading && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                  style={{
                    width: '100%', background: 'transparent', border: '1px solid #3d4a42',
                    color: '#dee4de', borderRadius: '8px', padding: '16px',
                    fontSize: '11px', fontFamily: 'Geist, sans-serif', fontWeight: 700,
                    letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                  }}
                >
                  {mode === 'login' ? 'Create Account' : 'Back to Login'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#87948b', fontSize: '13px', marginTop: '24px' }}>
          By logging in, you agree to our Terms of Service &amp; Privacy Policy
        </p>
      </div>
    </div>
  );
}
