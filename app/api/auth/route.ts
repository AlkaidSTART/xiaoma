import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
const user=[{username:'myj',password:'5278mm'},{username:'Jude.Chen',password:'Gxf9rwvIMPb0SH'}]



export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const cookieStore = await cookies();
    if (user.some(u => u.username === username && u.password === password)) {
      cookieStore.set('auth_token', 'admin', { httpOnly: true, path: '/' });
      return NextResponse.json({ success: true, role: 'admin', username: username });
    }
    
    cookieStore.set('auth_token', 'guest', { httpOnly: true, path: '/' });
    return NextResponse.json({ success: true, role: 'guest', username: username || 'Guest' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
