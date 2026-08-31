import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Layers, Palette, LogOut, Users, Clapperboard, Radio } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [canAccessControlRoom, setCanAccessControlRoom] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkAccess() {
      if (!user) {
        setCanAccessControlRoom(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/control-room/verify-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (active) setCanAccessControlRoom(Boolean(data.allowed));
        }
      } catch (err) {
        if (active) setCanAccessControlRoom(false);
      }
    }
    checkAccess();
    return () => {
      active = false;
    };
  }, [user]);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  return (
    <header className="app-header">
      <div className="logo-group">
        <Layers className="logo-icon" />
        <span className="logo-text">Overlay Engine</span>
      </div>
      
      <nav className="nav-links">
        <Link 
          href="/editor" 
          className={`nav-link ${isActive('/editor') ? 'active' : ''}`}
        >
          <Palette style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
          Templates
        </Link>
        <Link 
          href="/slots" 
          className={`nav-link ${isActive('/slots') ? 'active' : ''}`}
        >
          <Layers style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
          Live Slots
        </Link>
        <Link 
          href="/studio" 
          className={`nav-link ${isActive('/studio') ? 'active' : ''}`}
        >
          <Clapperboard style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
          Studio Room
        </Link>
        {canAccessControlRoom && (
          <Link 
            href="/control-room" 
            className={`nav-link ${isActive('/control-room') ? 'active' : ''}`}
            style={{ color: isActive('/control-room') ? '#a855f7' : undefined }}
          >
            <Radio style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom', color: '#a855f7' }} />
            Control Room
          </Link>
        )}
        <Link 
          href="/teams" 
          className={`nav-link ${isActive('/teams') ? 'active' : ''}`}
        >
          <Users style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
          Teams & Invites
        </Link>
      </nav>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {user?.email || 'Broadcast Studio'}
        </div>
        {user && (
          <button 
            onClick={() => logout()} 
            className="btn btn-secondary btn-sm"
            style={{ 
              padding: '0.35rem 0.65rem', 
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              borderColor: 'transparent',
              background: 'rgba(255, 255, 255, 0.04)' 
            }}
          >
            <LogOut style={{ width: '12px', height: '12px' }} />
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
}
