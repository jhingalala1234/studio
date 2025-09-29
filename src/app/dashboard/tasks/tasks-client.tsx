'use client';

import {
  AlertTriangle,
  Flame,
  Users,
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
        return initialTasks.filter(task => task.assignedToIds.includes(id));
    }
    
    if (role === 'Chair of Directors') {
        const subordinateIds = getSubordinates(id, users);
        const teamMemberIds = new Set([id, ...subordinateIds]);
        
        return initialTasks.filter(task => 
            task.assignedToIds.some(assigneeId => teamMemberIds.has(assigneeId)) || task.assignedById === id
        );
    }
    
    if (role === 'Lead') {
        const subordinateIds = getSubordinates(id, users);
        const subTeamMemberIds = new Set([id, ...subordinateIds]);

        return initialTasks.filter(task => 
            task.assignedToIds.some(assigneeId => subTeamMemberIds.has(assigneeId)) || task.assignedById === id
        );
    }

    return [];
  }, [currentUser, users, initialTasks]);

  const enrichTask = (task: Task) => {
    const assignees = users.filter(u => task.assignedToIds.includes(u.id));
    const assigner = users.find(u => u.id === task.assignedById);
    return {
      ...task,
      assignees: assignees.length > 0 ? assignees : [{ id: 'unassigned', name: 'Unassigned', avatar: '' }],
      assignerName: assigner?.name || 'System',
      assignerAvatar: assigner?.avatar,
      assignerId: assigner?.id,
    };
  };

  const allTasks = visibleTasks.map(enrichTask);
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

  const renderTable = (tasks: (ReturnType<typeof enrichTask>)[]) => (
     <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignees</TableHead>
            <TableHead>Assigner</TableHead>
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
                 <div className="flex items-center">
                    {task.assignees.slice(0, 2).map((assignee, index) => (
                        <Tooltip key={assignee.id}>
                            <TooltipTrigger asChild>
                                <Link href={`/dashboard/users/${assignee.id}`} className="-ml-2 first:ml-0">
                                    <Avatar className="h-7 w-7 border-2 border-background">
                                        <AvatarImage src={assignee.avatar} />
                                        <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{assignee.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    {task.assignees.length > 2 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="-ml-2">
                                     <Avatar className="h-7 w-7 border-2 border-background bg-muted text-muted-foreground flex items-center justify-center">
                                        <span className="text-xs">+{task.assignees.length - 2}</span>
                                    </Avatar>
                                </div>
                            </TooltipTrigger>
                             <TooltipContent>
                                {task.assignees.slice(2).map(a => <p key={a.id}>{a.name}</p>)}
                            </TooltipContent>
                        </Tooltip>
                    )}
                     {task.assignees[0].id === 'unassigned' && (
                         <div className="flex items-center gap-2 text-muted-foreground">
                             <Users className="h-4 w-4" />
                            <span>Unassigned</span>
                         </div>
                     )}
                </div>
              </TableCell>
              <TableCell>
                  {task.assignerId ? (
                    <Link href={`/dashboard/users/${task.assignerId}`} className="flex items-center gap-2 group">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignerAvatar} />
                            <AvatarFallback>{task.assignerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="group-hover:underline">{task.assignerName}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <span>{task.assignerName}</span>
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
