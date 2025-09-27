// This is a server-side file.
'use server';
import { cookies } from 'next/headers';
import { adminDb } from './firebase-admin';
import type { User } from '@/types';

export async function getCurrentUser(): Promise<User | null> {
    // For demo purposes, if no one is logged in, default to a user
    // Defaulting to 'Tanishpoddar.18' as the logged-in user
    const usersRef = adminDb.collection("users");
    const q = usersRef.where("username", "==", "Tanishpoddar.18");
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        console.error("Default user 'Tanishpoddar.18' not found in Firestore. Please seed the database.");
        return null;
    }

    const defaultUser = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as User;
    return defaultUser;
}

export async function logout(): Promise<void> {
  // This function is kept for potential future use but does nothing without a session cookie.
  cookies().delete('cxc_session');
}
