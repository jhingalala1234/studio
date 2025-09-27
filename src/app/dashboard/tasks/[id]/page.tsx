import { notFound } from 'next/navigation';
import { getTaskById, getAllUsers } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CalendarIcon,
  User,
  Tag,
  ClipboardList,
  AlertTriangle,
  Flame,
  Paperclip,
  Link as LinkIcon,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';

export default async function TaskDetailsPage({ params }: { params: { id: string } }) {
  const task = await getTaskById(params.id);
  const users = await getAllUsers();

  if (!task) {
    notFound();
  }

  const assignee = users.find((u) => u.id === task.assignedToId);
  const assigner = users.find((u) => u.id === task.assignedById);

  const priorityBadgeVariant = {
    High: 'destructive',
    Medium: 'secondary',
    Low: 'outline',
  } as const;

  const statusBadgeVariant = {
    'To Do': 'outline',
    'In Progress': 'secondary',
    Done: 'default',
    Cancelled: 'destructive',
  } as const;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-4">
          <h1 className="font-headline text-3xl font-bold md:text-4xl">{task.title}</h1>
          {task.urgent && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Flame className="h-6 w-6 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>This task is marked as urgent.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-muted-foreground">
          Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })} by {assigner?.name || 'Unknown'}
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Task Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{task.description || 'No description provided.'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>Files and links submitted for this task.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className='flex items-center gap-3'>
                    <Paperclip className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Files</span>
                        {task.files.length > 0 ? task.files.map(file => (
                            <Link key={file} href={file} target="_blank" className="text-sm text-primary hover:underline">{file.split('/').pop()}</Link>
                        )) : <p className='text-sm text-muted-foreground'>No files attached.</p>}
                    </div>
                </div>
                <Separator />
                 <div className='flex items-center gap-3'>
                    <LinkIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Links</span>
                        {task.links.length > 0 ? task.links.map(link => (
                            <Link key={link} href={link} target="_blank" className="text-sm text-primary hover:underline">{link}</Link>
                        )) : <p className='text-sm text-muted-foreground'>No links attached.</p>}
                    </div>
                </div>
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <ClipboardList className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={statusBadgeVariant[task.status]} className="w-fit">{task.status}</Badge>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Priority</span>
                  <Badge variant={priorityBadgeVariant[task.priority]} className="w-fit">{task.priority}</Badge>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Due Date</span>
                  <span className="text-sm">{format(new Date(task.dueDate), 'PPP')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Assignee</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={assignee?.avatar} />
                      <AvatarFallback>{assignee?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{assignee?.name || 'Unassigned'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
