'use client';

import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame, AlertTriangle } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import Link from 'next/link';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface KanbanCardProps {
  task: Task & { assigneeName: string; assigneeAvatar?: string };
  index: number;
}

export function KanbanCard({ task, index }: KanbanCardProps) {

  const isDeadlineApproaching = (dueDate: string) => {
    const hoursLeft = differenceInHours(new Date(dueDate), new Date());
    return hoursLeft >= 0 && hoursLeft < 24;
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <TooltipProvider>
            <Card className="glass hover:border-primary/50 transition-colors">
                <CardHeader className="p-4">
                    <div className="flex items-start justify-between">
                         <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline">
                            <CardTitle className="text-base font-semibold">{task.title}</CardTitle>
                         </Link>
                         <div className="flex items-center gap-2">
                            {task.urgent && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Flame className="h-4 w-4 text-destructive" />
                                    </TooltipTrigger>
                                    <TooltipContent><p>This task is urgent.</p></TooltipContent>
                                </Tooltip>
                            )}
                             {isDeadlineApproaching(task.dueDate) && task.status !== 'Done' && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                    </TooltipTrigger>
                                    <TooltipContent><p>Deadline within 24 hours.</p></TooltipContent>
                                </Tooltip>
                             )}
                         </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <Avatar className="h-6 w-6">
                                <AvatarImage src={task.assigneeAvatar} />
                                <AvatarFallback>{task.assigneeName.charAt(0)}</AvatarFallback>
                             </Avatar>
                             <span className="text-sm text-muted-foreground">{task.assigneeName}</span>
                         </div>
                         <p className="text-xs text-muted-foreground">
                            Due: {format(new Date(task.dueDate), 'MMM d')}
                        </p>
                    </div>
                </CardContent>
            </Card>
          </TooltipProvider>
        </div>
      )}
    </Draggable>
  );
}
