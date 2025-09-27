// This is a server-side file.
'use server';
import { cookies } from 'next/headers';
import { users, type User } from '@/lib/data';

const FAKE_SESSION_COOKIE = 'cxc_session';

export async function login(email: string): Promise<void> {
  // For the demo, we log in the user with the matching email.
  const user = users.find(u => u.email === email);
  if (!user) {
    // Fallback to the Director of Technology if demo email is used but not found
    const director = users.find(u => u.team === 'Technology' && u.role === 'Chair of Directors');
    if(!director) throw new Error('Default user not found');
    cookies().set(FAKE_SESSION_COOKIE, JSON.stringify(director), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    return;
  }

  cookies().set(FAKE_SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });
}

export async function getCurrentUser(): Promise<User | null> {
    const defaultUser = users.find(u => u.email === 'demo@demo.com');
    return defaultUser || users[0];
}

export async function logout(): Promise<void> {
  cookies().delete(FAKE_SESSION_COOKIE);
}
