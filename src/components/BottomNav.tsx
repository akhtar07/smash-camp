'use client';
import { useRouter, usePathname } from 'next/navigation';

type NavItem = { label: string; icon: string; path: string };

const coachNav: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/coach' },
  { label: 'Squad', icon: 'group', path: '/squad' },
  { label: 'Calendar', icon: 'calendar_month', path: '/calendar' },
  { label: 'Scores', icon: 'leaderboard', path: '/leaderboard' },
];

const playerNav: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', path: '/player' },
  { label: 'Program', icon: 'fitness_center', path: '/program' },
  { label: 'Squad', icon: 'group', path: '/squad' },
  { label: 'Nutrition', icon: 'restaurant', path: '/nutrition' },
];

export default function BottomNav({ role = 'player' }: { role?: 'coach' | 'player' }) {
  const router = useRouter();
  const pathname = usePathname();
  const items = role === 'coach' ? coachNav : playerNav;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '448px', zIndex: 50,
      background: '#1b211d',
      borderTop: '1px solid #3d4a42',
      borderRadius: '12px 12px 0 0',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '12px 16px',
    }}>
      {items.map(item => {
        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path + '/'));
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '4px 16px',
              background: isActive ? '#25a475' : 'none',
              color: isActive ? '#00311f' : '#bccac0',
              border: 'none', cursor: 'pointer',
              borderRadius: '12px',
              transition: 'all 0.15s',
              gap: '2px',
            }}
          >
            <span className="material-symbols-outlined" style={{
              fontSize: '22px',
              fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
            }}>
              {item.icon}
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'Geist, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
