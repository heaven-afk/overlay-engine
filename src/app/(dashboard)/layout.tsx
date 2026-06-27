'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect unauthenticated users to the login page
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#07070a',
        color: '#9fa0ac',
        fontFamily: 'sans-serif',
        gap: '1rem'
      }}>
        <Loader2 className="animate-spin" style={{ width: '2rem', height: '2rem', color: '#8b5cf6', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem' }}>Verifying designer session...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Suppress flash of dashboard content before redirect triggers
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: 'calc(100vh - 74px)' }}>
        {children}
      </main>
    </>
  );
}
