'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Layers,
  Palette,
  LogOut,
  Users,
  Clapperboard,
  Radio,
  ChevronDown,
  UserCheck,
  Check,
  Edit2,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { user, displayName, logout, updateDisplayName } = useAuth();
  const [canAccessControlRoom, setCanAccessControlRoom] = useState(false);

  // Profile menu & edit name state
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setIsEditingName(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Keep nameInput in sync with displayName
  useEffect(() => {
    setNameInput(displayName || (user?.email ? user.email.split('@')[0] : ''));
  }, [displayName, user?.email]);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    try {
      setSavingName(true);
      await updateDisplayName(nameInput.trim());
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditingName(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setSavingName(false);
    }
  };

  // Generate avatar initials
  const effectiveName = displayName || (user?.email ? user.email.split('@')[0] : 'Broadcaster');
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(effectiveName);

  return (
    <header className="app-header">
      {/* Brand / Logo */}
      <Link href="/editor" className="logo-group">
        <div className="logo-badge">
          <Layers className="logo-icon" />
        </div>
        <div className="logo-text">
          <span>Overlay Engine</span>
          <span className="logo-pill">PRO</span>
        </div>
      </Link>

      {/* Modern Pill Capsule Navigation */}
      <nav className="nav-dock">
        <Link 
          href="/editor" 
          className={`nav-dock-item ${isActive('/editor') ? 'active' : ''}`}
        >
          <Palette style={{ width: '15px', height: '15px' }} />
          <span>Templates</span>
        </Link>
        <Link 
          href="/slots" 
          className={`nav-dock-item ${isActive('/slots') ? 'active' : ''}`}
        >
          <Layers style={{ width: '15px', height: '15px' }} />
          <span>Live Slots</span>
        </Link>
        <Link 
          href="/studio" 
          className={`nav-dock-item ${isActive('/studio') ? 'active' : ''}`}
        >
          <Clapperboard style={{ width: '15px', height: '15px' }} />
          <span>Studio Room</span>
        </Link>
        {canAccessControlRoom && (
          <Link 
            href="/control-room" 
            className={`nav-dock-item ${isActive('/control-room') ? 'active' : ''}`}
          >
            <Radio style={{ width: '15px', height: '15px', color: '#c084fc' }} />
            <span>Control Room</span>
            <span className="pulse-dot-live" title="Live Broadcast Control Enabled" />
          </Link>
        )}
        <Link 
          href="/teams" 
          className={`nav-dock-item ${isActive('/teams') ? 'active' : ''}`}
        >
          <Users style={{ width: '15px', height: '15px' }} />
          <span>Teams & Invites</span>
        </Link>
      </nav>

      {/* User Profile & Actions */}
      <div style={{ position: 'relative' }} ref={menuRef}>
        {user ? (
          <>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`profile-pill-trigger ${menuOpen ? 'active' : ''}`}
              title="Click to view profile & edit display name"
              aria-label="User Profile Menu"
            >
              <div className="profile-avatar-circle">
                {initials}
                <span className="profile-online-indicator" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', marginRight: '4px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.2 }}>
                  {effectiveName}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.1 }}>
                  Producer
                </span>
              </div>

              <ChevronDown 
                style={{ 
                  width: '14px', 
                  height: '14px', 
                  color: 'var(--text-muted)',
                  transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </button>

            {/* Profile Dropdown Card */}
            {menuOpen && (
              <div className="profile-dropdown-card">
                {/* User Info Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#fff',
                    boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)',
                    flexShrink: 0
                  }}>
                    {initials}
                  </div>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {effectiveName}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Display Name Edit Block */}
                <div style={{ margin: '0.85rem 0', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#c4b5fd', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles style={{ width: '12px', height: '12px' }} />
                      Custom Profile Name
                    </span>
                    {!isEditingName && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#a78bfa',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        <Edit2 style={{ width: '11px', height: '11px' }} />
                        Change
                      </button>
                    )}
                  </div>

                  {isEditingName ? (
                    <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Alex Director"
                        autoFocus
                        style={{
                          width: '100%',
                          background: 'rgba(10, 10, 16, 0.8)',
                          border: '1px solid rgba(167, 139, 250, 0.4)',
                          borderRadius: '6px',
                          padding: '0.4rem 0.6rem',
                          color: '#fff',
                          fontSize: '0.82rem',
                          outline: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(false)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingName || !nameInput.trim()}
                          className="btn btn-primary btn-sm"
                          style={{
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.72rem',
                            background: saveSuccess ? '#22c55e' : undefined,
                            borderColor: saveSuccess ? '#22c55e' : undefined,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {savingName ? (
                            <Loader2 className="animate-spin" style={{ width: '12px', height: '12px' }} />
                          ) : saveSuccess ? (
                            <Check style={{ width: '12px', height: '12px' }} />
                          ) : null}
                          <span>{saveSuccess ? 'Saved!' : 'Save Name'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      Used in broadcast teams, invites & shared production slots.
                    </div>
                  )}
                </div>

                {/* Quick Link to Teams */}
                <Link
                  href="/teams"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#f1f5f9',
                    textDecoration: 'none',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    marginBottom: '0.65rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck style={{ width: '14px', height: '14px', color: '#c084fc' }} />
                    Teams & Workspace
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#a78bfa', fontWeight: 600 }}>Open →</span>
                </Link>

                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '0.45rem',
                    fontSize: '0.78rem',
                    borderRadius: '8px',
                    color: '#f87171',
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                  }}
                >
                  <LogOut style={{ width: '13px', height: '13px' }} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

