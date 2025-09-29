import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getUserById, getTasksByAssigneeId, getAllUsers } from '@/lib/data';
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
import {
  Briefcase,
  Calendar,
  Mail,
  Users,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { differenceInHours } from 'date-fns';

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const user = await getUserById(params.id);
  
  if (!user) {
    notFound();
  }

  const assignedTasks = await getTasksByAssigneeId(user.id);
  const allUsers = await getAllUsers();

  const getAssignerName = (assignerId: string) => {
    return allUsers.find(u => u.id === assignerId)?.name || 'Unknown';
  };

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

  return (
    <div className="space-y-8">
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-3xl">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h1 className="font-headline text-3xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
              <div className="flex items-center justify-center gap-4 md:justify-start">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.team} {user.subTeam ? `(${user.subTeam})` : ''}</span>
                </div>
              </div>
               <div className="flex items-center justify-center gap-2 md:justify-start">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${user.email}`} className="text-sm text-primary hover:underline">
                    {user.email}
                  </a>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Assigned Tasks</CardTitle>
          <CardDescription>
            A list of tasks currently assigned to {user.name.split(' ')[0]}.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <TooltipProvider>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Due Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Assigned By</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {assignedTasks.map(task => (
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
                    <TableCell className="hidden lg:table-cell">{getAssignerName(task.assignedById)}</TableCell>
                    </TableRow>
                ))}
                 {assignedTasks.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No tasks assigned to this user.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
