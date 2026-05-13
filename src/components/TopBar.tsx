'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TopBar({ title = 'SMASH CAMP' }: { title?: string }) {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#0f1511',
      borderBottom: '1px solid #3d4a42',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      width: '100%', maxWidth: '448px', margin: '0 auto',
      padding: '0 1.25rem', height: '64px',
    }}>
      <button
        onClick={() => router.back()}
        style={{ color: '#68dba9', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
      <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: '20px', fontWeight: 900, color: '#68dba9', letterSpacing: '-0.02em' }}>
        {title}
      </h1>
      <button
        onClick={handleLogout}
        style={{ color: '#68dba9', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
      >
        <span className="material-symbols-outlined">logout</span>
      </button>
    </header>
  );
}
