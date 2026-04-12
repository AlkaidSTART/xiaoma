import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const cookieStore = await cookies();
    
    if (username === 'myj' && password === '123456') {
      cookieStore.set('auth_token', 'admin', { httpOnly: true, path: '/' });
      return NextResponse.json({ success: true, role: 'admin', username: 'myj' });
    }
    
    cookieStore.set('auth_token', 'guest', { httpOnly: true, path: '/' });
    return NextResponse.json({ success: true, role: 'guest', username: username || 'Guest' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
