import type { ReactNode } from 'react';
import { Header } from '@/components/dashboard/header';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/'); 
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header user={user} />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
