// This is a server-side file.
'use server';
import { cookies } from 'next/headers';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from '@/types';

const FAKE_SESSION_COOKIE = 'cxc_session';

export async function getCurrentUser(): Promise<User | null> {
    const sessionCookie = cookies().get(FAKE_SESSION_COOKIE);

    if (sessionCookie) {
        try {
            const user = JSON.parse(sessionCookie.value) as User;
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("id", "==", user.id));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return null;
            }
            
            const currentUser = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as User;
            return currentUser || null;
        } catch {
            // Invalid cookie, treat as logged out
            return null;
        }
    }
    
    // For demo purposes, if no one is logged in, default to a user
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", "Tanishpoddar.18"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const defaultUser = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as User;
    return defaultUser;
}

export async function logout(): Promise<void> {
  cookies().delete(FAKE_SESSION_COOKIE);
}
