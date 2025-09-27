// This is a server-side file.
'use server';
import { cookies } from 'next/headers';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '@/types';

const FAKE_SESSION_COOKIE = 'cxc_session';

export async function getCurrentUser(): Promise<User | null> {
    // For demo purposes, if no one is logged in, default to a user
    const usersRef = collection(db, "users");
    // Defaulting to 'Tanishpoddar.18' as the logged-in user
    const q = query(usersRef, where("username", "==", "Tanishpoddar.18"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.error("Default user 'Tanishpoddar.18' not found in Firestore. Please seed the database.");
        return null;
    }

    const defaultUser = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as User;
    return defaultUser;
}

export async function logout(): Promise<void> {
  // This function is kept for potential future use but does nothing without a session cookie.
  cookies().delete(FAKE_SESSION_COOKIE);
}