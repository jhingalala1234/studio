import type { ReactNode } from 'react';
import TasksLayoutClient from './tasks-layout-client';
import { getCurrentUser } from '@/lib/auth';

export default async function TasksLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  const canCreateTask = !!currentUser;

  return (
    <div className="flex flex-col gap-4">
      <TasksLayoutClient canCreateTask={canCreateTask}>
        {children}
      </TasksLayoutClient>
    </div>
  );
}
