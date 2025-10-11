
'use server';

import { login as authLogin, logout as authLogout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import crypto from 'crypto';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().default(false).optional(),
});

export async function login(data: unknown) {
  const validatedFields = loginSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields!',
    };
  }

  const { email, password, remember } = validatedFields.data;

  try {
    await authLogin(email, password, remember);
  } catch (error) {
    if (error instanceof Error) {
      return {
        error: error.message,
      };
    }
    return {
      error: 'An unknown error occurred.',
    };
  }
  
  redirect('/dashboard');
}

export async function logout() {
  await authLogout();
  redirect('/login');
}

export async function sendPasswordResetLink(email: string) {
  if (!adminDb || !adminAuth) {
    console.error('Firebase Admin not initialized.');
    return { error: 'Server configuration error. Please contact an administrator.' };
  }

  try {
    // 1. Check if user exists in your Firestore database
    const usersRef = adminDb.collection("users");
    const q = usersRef.where("email", "==", email);
    const querySnapshot = await q.get();

    // 2. If user doesn't exist, return success to prevent email enumeration, but do nothing.
    if (querySnapshot.empty) {
      console.log(`Password reset requested for non-existent user: ${email}`);
      return { success: true };
    }

    // 3. User exists, so generate a password reset link with Firebase Auth
    const user = querySnapshot.docs[0].data();
    console.log(`Generating password reset link for: ${user.email}`);
    
    // This is a placeholder for sending the email.
    // In a real app, you would use a service like Nodemailer or a dedicated email provider.
    // For this example, we will just log the action.
    console.log(`(Simulated) Password reset email sent to ${email}.`);


  } catch (error) {
    console.error('Error in sendPasswordResetLink:', error);
    // Return a generic error to the client
    return { error: 'Could not send reset email. Please try again later.' };
  }

  return { success: true };
}
