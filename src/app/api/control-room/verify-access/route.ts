import { NextRequest, NextResponse } from 'next/server';

function decodeJwtPayload(token: string): { email?: string; email_verified?: boolean } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ownerEmail = (process.env.CONTROL_ROOM_OWNER_EMAIL || '').toLowerCase().trim();

    // If owner email is not set in environment, deny all access
    if (!ownerEmail) {
      return NextResponse.json({ allowed: false }, { status: 200 });
    }

    let idToken = '';
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7);
    } else {
      const body = await req.json().catch(() => ({}));
      idToken = body.idToken || '';
    }

    if (!idToken) {
      return NextResponse.json({ allowed: false }, { status: 200 });
    }

    const payload = decodeJwtPayload(idToken);
    if (!payload || !payload.email) {
      return NextResponse.json({ allowed: false }, { status: 200 });
    }

    const tokenEmail = payload.email.toLowerCase().trim();
    const isAllowed = tokenEmail === ownerEmail;

    return NextResponse.json({ allowed: isAllowed }, { status: 200 });
  } catch (error) {
    console.error('Error verifying control room access:', error);
    return NextResponse.json({ allowed: false }, { status: 200 });
  }
}
