'use client';

import {
  File,
  ListFilter,
  AlertTriangle,
  Flame,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { differenceInHours } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Task, User } from '@/types';

export default function TasksClient({ currentUser, users, allTasks: tasks }: { currentUser: User, users: User[], allTasks: Task[] }) {
  const getTaskWithAssignee = (task: Task) => {
    const assignee = users.find(u => u.id === task.assignedToId);
    return {
      ...task,
      assigneeName: assignee?.name || 'Unassigned',
      assigneeAvatar: assignee?.avatar,
    };
  };

  const allTasks = tasks.map(getTaskWithAssignee);

  const priorityBadgeVariant = {
    'High': 'destructive',
    'Medium': 'secondary',
    'Low': 'outline',
  } as const;

  const statusBadgeVariant = {
    'To Do': 'outline',
    'In Progress': 'secondary',
    Done: 'default',
    Cancelled: 'destructive',
  } as const;

  const isDeadlineApproaching = (dueDate: string) => {
    const hoursLeft = differenceInHours(new Date(dueDate), new Date());
    return hoursLeft >= 0 && hoursLeft < 24;
  }

  const canCreateTask = currentUser?.role !== 'Member';

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
          <TabsTrigger value="archived" className="hidden sm:flex">
            Archived
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Done</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Archived
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          {canCreateTask && (
             <Button size="sm" className="h-8 gap-1" asChild>
                <Link href="/dashboard/tasks/create">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Task
                    </span>
                </Link>
             </Button>
          )}
        </div>
      </div>
      <TabsContent value="all">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              Manage and track all tasks assigned across CloudX.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTasks.map(task => (
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
                        <Badge variant={priorityBadgeVariant[task.priority]}>{task.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assigneeAvatar} />
                              <AvatarFallback>{task.assigneeName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{task.assigneeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
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
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}