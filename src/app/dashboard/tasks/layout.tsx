import type { ReactNode } from 'react';
import TasksLayoutClient from './tasks-layout-client';
import { getCurrentUser } from '@/lib/auth';
import { getAllTasks, getAllUsers } from '@/lib/data';
import { getSubordinates } from '@/lib/hierarchy';


export default async function TasksLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();
  const allTasks = await getAllTasks();
  const allUsers = await getAllUsers();
  
  if(!currentUser) return null;

  const canCreateTask = !!currentUser;
  
  const getVisibleTasks = async () => {
    const { role, id } = currentUser;

    if (role === 'Co-founder' || role === 'Secretary') {
      return allTasks;
    }

    if (role === 'Member') {
      return allTasks.filter(task => (task.assignedToIds || []).includes(id));
    }

    if (role === 'Chair of Directors') {
      const subordinateIds = await getSubordinates(id, allUsers);
      const teamMemberIds = new Set([id, ...subordinateIds]);

      return allTasks.filter(task =>
        (task.assignedToIds || []).some(assigneeId => teamMemberIds.has(assigneeId)) ||
        task.assignedById === id
      );
    }

    if (role === 'Lead') {
      const subordinateIds = await getSubordinates(id, allUsers);
      const subTeamMemberIds = new Set([id, ...subordinateIds]);

      return allTasks.filter(task =>
        (task.assignedToIds || []).some(assigneeId => subTeamMemberIds.has(assigneeId)) ||
        task.assignedById === id
      );
    }
    
    return [];
  };

  const visibleTasks = await getVisibleTasks();
  
  const enrichedTasks = visibleTasks.map(task => {
    const assignees = allUsers.filter(u => (task.assignedToIds || []).includes(u.id));
    const assigner = allUsers.find(u => u.id === task.assignedById);
    return {
      ...task,
      assignees: assignees.length > 0 ? assignees.map(a => a.name) : ['Unassigned'],
      assigner: assigner?.name || 'System',
    };
  });


  return (
    <div className="flex flex-col gap-4">
      <TasksLayoutClient canCreateTask={canCreateTask} tasks={enrichedTasks}>
        {children}
      </TasksLayoutClient>
    </div>
  );
}
