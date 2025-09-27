// This is a server-side file.
'use server';
import { cookies } from 'next/headers';
import { users, type User } from '@/lib/data';

const FAKE_SESSION_COOKIE = 'cxc_session';

export async function getCurrentUser(): Promise<User | null> {
    const sessionCookie = cookies().get(FAKE_SESSION_COOKIE);

    if (sessionCookie) {
        try {
            const user = JSON.parse(sessionCookie.value) as User;
            // Re-fetch user from data source to ensure it's not stale
            const currentUser = users.find(u => u.id === user.id);
            return currentUser || null;
        } catch {
            // Invalid cookie, treat as logged out
            return null;
        }
    }
    // For demo purposes, if no one is logged in, default to the Director of Technology
    const defaultUser = users.find(u => u.email === 'demo@demo.com');
    return defaultUser || users[0];
}

export async function logout(): Promise<void> {
  cookies().delete(FAKE_SESSION_COOKIE);
}
