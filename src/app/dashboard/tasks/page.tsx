import { getAllTasks, getAllUsers } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import TasksClient from './tasks-client';


export default async function TasksPage() {
  const currentUser = await getCurrentUser();
  const users = await getAllUsers();
  const allTasks = await getAllTasks();

  if (!currentUser) return null;

  return <TasksClient currentUser={currentUser} users={users} allTasks={allTasks} />;
}
