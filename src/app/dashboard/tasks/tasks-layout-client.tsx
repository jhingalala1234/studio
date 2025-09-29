
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

export default function TasksLayoutClient({ canCreateTask, children }: { canCreateTask: boolean, children: React.ReactNode }) {
  const pathname = usePathname();
  const isBoardView = pathname.includes('/board');

  return (
    <>
      <div className="flex items-center">
        {!isBoardView && (
            <Tabs defaultValue="all" className="mr-auto">
                 <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="done">Done</TabsTrigger>
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
      {children}
    </>
  );
}
