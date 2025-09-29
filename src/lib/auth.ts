// This is a server-side file.
'use server';
import { cookies } from 'next/headers';
import { adminDb } from './firebase-admin';
import type { User } from '@/types';
import {unstable_cache as cache} from 'next/cache';

const SESSION_COOKIE_NAME = 'cxc_session';

export async function getCurrentUser(): Promise<User | null> {
    const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedToken = JSON.parse(sessionCookie);
        const userId = decodedToken.userId;

        if (!userId) {
            return null;
        }

        const user = await cache(
            async (id: string) => {
                const userDoc = await adminDb.collection('users').doc(id).get();
                if (!userDoc.exists) {
                    return null;
                }
                return { id: userDoc.id, ...userDoc.data() } as User;
            },
            [`user-${userId}`], // Cache key
            { revalidate: 3600 } // Revalidate every hour
        )(userId);
        
        return user;
    } catch (error) {
        console.error('Error decoding session cookie:', error);
        return null;
    }
}

export async function login(email: string, password: string):Promise<void> {
    const usersRef = adminDb.collection("users");
    const q = usersRef.where("email", "==", email);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
        throw new Error("Invalid email or password.");
    }

    const userDoc = querySnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as User;

    // In a real app, you MUST hash passwords.
    // This is a major security vulnerability.
    if (user.password !== password) {
        throw new Error("Invalid email or password.");
    }
    
    const sessionData = { 
        userId: user.id,
        loggedInAt: Date.now()
    };
    
    cookies().set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // One week
        path: '/',
    });
}


export async function logout(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME);
}
