import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LoginPageClient from './login-page-client';
import { Logo } from '@/components/logo';

export default async function LoginPage() {
    const user = await getCurrentUser();

    if (user) {
        redirect('/dashboard');
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
            <div className="mb-8">
                <Logo />
            </div>
            <LoginPageClient />
        </main>
    );
}
