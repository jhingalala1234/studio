'use server';

import { login as authLogin, logout as authLogout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export type LoginState = {
  error?: string;
  message?: string;
};

export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const validatedFields = loginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.email?.[0] || validatedFields.error.flatten().fieldErrors.password?.[0],
    };
  }
  
  const { email, password } = validatedFields.data;

  if (email !== 'demo@demo.com' || password !== 'demodemo') {
    return { error: 'Invalid email or password.' };
  }

  try {
    await authLogin(email);
  } catch (error) {
    if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: 'An unknown error occurred.' };
  }

  redirect('/dashboard');
}

export async function logout() {
  await authLogout();
  redirect('/login');
}
