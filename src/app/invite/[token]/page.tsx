'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getInviteByToken, acceptInviteToken, OverlayInvite } from '@/lib/db';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Users, Check, AlertCircle, Loader2 } from 'lucide-react';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<OverlayInvite | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function loadInvite() {
      try {
        setLoading(true);
        const inv = await getInviteByToken(token);
        setInvite(inv);
      } catch (err: any) {
        setError('Failed to load invite information.');
      } finally {
        setLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      router.push(`/login?redirectTo=/invite/${token}`);
      return;
    }

    try {
      setAccepting(true);
      setError('');
      await acceptInviteToken(token, { uid: user.uid, email: user.email || '' });
      setSuccess(true);
      setTimeout(() => router.push('/slots'), 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept team invite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Loader2 className="animate-spin" style={{ width: '20px', height: '20px' }} />
          <span>Loading invitation...</span>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        padding: '20px',
        textAlign: 'center',
      }}>
        <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>Invalid or Expired Invite</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '400px', margin: '0 0 24px 0' }}>
          This team invitation link is no longer valid or has already expired.
        </p>
        <Link href="/slots" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#121218',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px',
        boxSizing: 'border-box',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(217,70,239,0.1)',
          border: '1px solid rgba(217,70,239,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: '#d946ef',
        }}>
          <Users style={{ width: '32px', height: '32px' }} />
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>
          Team Invitation
        </h2>

        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          You have been invited to join team <strong style={{ color: '#d946ef' }}>{invite.teamName}</strong> as an{' '}
          <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{invite.role}</strong>.
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{
            backgroundColor: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.3)',
            color: '#4ade80',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 700,
          }}>
            <Check style={{ width: '18px', height: '18px' }} />
            <span>Invitation Accepted! Redirecting...</span>
          </div>
        ) : (
          <button
            onClick={handleAccept}
            disabled={accepting}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#d946ef',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: accepting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {accepting && <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />}
            <span>{user ? `Join ${invite.teamName}` : 'Sign in to Accept Invitation'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
