import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ListTodo,
  Users,
  XCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCurrentUser } from '@/lib/auth';
import { TaskChart } from './task-chart';
import { getAllTasks, getAllUsers, getAllLogs } from '@/lib/data';
import type { Task, User, Log } from '@/types';

export default async function Dashboard() {
  const user = await getCurrentUser();

  const users = await getAllUsers();
  const tasks = await getAllTasks();
  const logs = await getAllLogs();

  const myTasks = tasks.filter(t => t.assignedToId === user?.id);
  const teamTasks = tasks.filter(t => {
    const assignedToUser = users.find(u => u.id === t.assignedToId);
    return assignedToUser?.team === user?.team && t.assignedToId !== user?.id;
  });

  const recentLogs = logs.slice(0, 5).map(log => {
      const logUser = users.find(u => u.id === log.userId);
      return {...log, userName: logUser?.name, userAvatar: logUser?.avatar}
  });

  const chartData = [
    { name: 'To Do', total: tasks.filter(t => t.status === 'To Do').length, fill: 'hsl(var(--chart-2))' },
    { name: 'In Progress', total: tasks.filter(t => t.status === 'In Progress').length, fill: 'hsl(var(--chart-4))' },
    { name: 'Done', total: tasks.filter(t => t.status === 'Done').length, fill: 'hsl(var(--chart-1))' },
    { name: 'Cancelled', total: tasks.filter(t => t.status === 'Cancelled').length, fill: 'hsl(var(--chart-5))' },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {myTasks.filter(t => t.status === 'To Do').length} pending
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Tasks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamTasks.length}</div>
            <p className="text-xs text-muted-foreground">Across your teams and leads</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{tasks.filter(t => t.status === 'Done').length}</div>
            <p className="text-xs text-muted-foreground">
              Total tasks completed
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'In Progress').length}</div>
            <p className="text-xs text-muted-foreground">Tasks currently in progress</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2 glass">
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
            <CardDescription>A summary of all tasks by status.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <TaskChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Updates on tasks from you and your team.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {recentLogs.map(log => (
                <div key={log.id} className="flex items-center gap-4">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={log.userAvatar} alt="Avatar" data-ai-hint="person portrait" />
                        <AvatarFallback>{log.userName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">
                            {log.userName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {log.message.length > 50 ? `${log.message.substring(0,50)}...` : log.message}
                        </p>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
