'use client';

import {
  AlertTriangle,
  Flame,
} from 'lucide-react';
import Link from 'next/link';
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
import {
  Tabs,
  TabsContent,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { differenceInHours, format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Task, User } from '@/types';
import { useMemo } from 'react';

// Helper function to get all subordinates of a manager (recursively)
const getSubordinates = (managerId: string, allUsers: User[]): string[] => {
  const manager = allUsers.find(u => u.id === managerId);
  if (!manager) return [];

  let directSubordinates: User[] = [];

  // A Chair's subordinates are Leads and Members in their team
  if (manager.role === 'Chair of Directors') {
    directSubordinates = allUsers.filter(user => user.team === manager.team && (user.role === 'Lead' || user.role === 'Member'));
  }
  // A Lead's subordinates are Members in their sub-team
  else if (manager.role === 'Lead') {
    directSubordinates = allUsers.filter(user => user.subTeam === manager.subTeam && user.role === 'Member');
  }

  const subordinateIds = directSubordinates.map(s => s.id);

  // Recursively find subordinates of the direct subordinates (for Chairs overseeing Leads)
  const nestedSubordinates = subordinateIds.flatMap(id => getSubordinates(id, allUsers));
  
  return [...subordinateIds, ...nestedSubordinates];
};


export default function TasksClient({ currentUser, users, allTasks: initialTasks }: { currentUser: User, users: User[], allTasks: Task[] }) {
  
  const visibleTasks = useMemo(() => {
    const { role, id } = currentUser;

    if (role === 'Co-founder' || role === 'Secretary') {
        return initialTasks;
    }

    if (role === 'Member') {
        return initialTasks.filter(task => task.assignedToId === id);
    }
    
    if (role === 'Chair of Directors' || role === 'Lead') {
        const subordinateIds = getSubordinates(id, users);
        const teamMemberIds = new Set([id, ...subordinateIds]);
      
        return initialTasks.filter(task => 
            teamMemberIds.has(task.assignedToId) || task.assignedById === id
        );
    }

    return [];
  }, [currentUser, users, initialTasks]);

  const getTaskWithAssignee = (task: Task) => {
    const assignee = users.find(u => u.id === task.assignedToId);
    return {
      ...task,
      assigneeName: assignee?.name || 'Unassigned',
      assigneeAvatar: assignee?.avatar,
      assigneeId: assignee?.id,
    };
  };

  const allTasks = visibleTasks.map(getTaskWithAssignee);
  const activeTasks = allTasks.filter(t => t.status === 'To Do' || t.status === 'In Progress');
  const doneTasks = allTasks.filter(t => t.status === 'Done' || t.status === 'Cancelled');


  const statusBadgeVariant = {
    'To Do': 'outline',
    'In Progress': 'secondary',
    'Done': 'default',
    'Cancelled': 'destructive',
  } as const;

  const isDeadlineApproaching = (dueDate: string) => {
    const hoursLeft = differenceInHours(new Date(dueDate), new Date());
    return hoursLeft >= 0 && hoursLeft < 24;
  }

  const renderTable = (tasks: (Task & { assigneeName: string; assigneeAvatar: string | undefined; assigneeId: string | undefined; })[]) => (
     <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead className="hidden md:table-cell">Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline">
                  <div className="flex items-center gap-2">
                    {task.title}
                    {task.urgent && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Flame className="h-4 w-4 text-destructive" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This task is marked as urgent.</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant[task.status]}>{task.status}</Badge>
              </TableCell>
              <TableCell>
                  {task.assigneeId ? (
                    <Link href={`/dashboard/users/${task.assigneeId}`} className="flex items-center gap-2 group">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assigneeAvatar} />
                            <AvatarFallback>{task.assigneeName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="group-hover:underline">{task.assigneeName}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <span>{task.assigneeName}</span>
                    </div>
                  )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <span>{format(new Date(task.dueDate), "PPP")}</span>
                  {isDeadlineApproaching(task.dueDate) && task.status !== 'Done' && (
                      <Tooltip>
                      <TooltipTrigger>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Deadline is approaching (less than 24 hours left).</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  )

  return (
    <Tabs defaultValue="all">
      <TabsContent value="all">
        <Card className="glass">
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>
              Manage and track all relevant tasks for you and your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderTable(allTasks)}
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="active">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
            <CardDescription>
              Tasks that are currently 'To Do' or 'In Progress'.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderTable(activeTasks)}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="done">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Completed & Cancelled Tasks</CardTitle>
            <CardDescription>
              Tasks that have been marked as 'Done' or 'Cancelled'.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderTable(doneTasks)}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
