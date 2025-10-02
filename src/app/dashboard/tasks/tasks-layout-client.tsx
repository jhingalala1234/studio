

'use client';

import {
  File,
  PlusCircle,
  LayoutGrid,
  Rows,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import AddTaskDialog from './add-task-dialog';


interface EnrichedTask {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  assignees: string[];
  assigner: string;
}

export default function TasksLayoutClient({ 
    canCreateTask, 
    children, 
    tasks 
}: { 
    canCreateTask: boolean, 
    children: React.ReactNode, 
    tasks: EnrichedTask[] 
}) {
  const pathname = usePathname();
  const isBoardView = pathname.includes('/board');
  const isCreateView = pathname.includes('/create');

  const handleExport = () => {
    const headers = ['Task ID', 'Title', 'Status', 'Due Date', 'Assignees', 'Assigner'];
    const rows = tasks.map(task => [
        `"${task.id}"`,
        `"${task.title.replace(/"/g, '""')}"`,
        `"${task.status}"`,
        `"${new Date(task.dueDate).toISOString()}"`,
        `"${task.assignees.join(', ')}"`,
        `"${task.assigner.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-s8," 
        + headers.join(",") + "\n"
        + rows.join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cloudx_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <div className="flex items-center">
        {!isBoardView && !isCreateView && (
            <Tabs defaultValue="all" className="mr-auto">
                 <TabsList>
                    <TabsTrigger value="all" asChild><Link href="?filter=all">All</Link></TabsTrigger>
                    <TabsTrigger value="active" asChild><Link href="?filter=active">Active</Link></TabsTrigger>
                    <TabsTrigger value="missing" asChild><Link href="?filter=missing">Missing</Link></TabsTrigger>
                    <TabsTrigger value="done" asChild><Link href="?filter=done">Done</Link></TabsTrigger>
                </TabsList>
            </Tabs>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant={!isBoardView ? 'secondary' : 'outline'} className="h-8 gap-1" asChild>
            <Link href="/dashboard/tasks">
              <Rows className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                List
              </span>
            </Link>
          </Button>
          <Button size="sm" variant={isBoardView ? 'secondary' : 'outline'} className="h-8 gap-1" asChild>
            <Link href="/dashboard/tasks/board">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Board
              </span>
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          {canCreateTask && <AddTaskDialog />}
        </div>
      </div>
      {children}
    </>
  );
}
