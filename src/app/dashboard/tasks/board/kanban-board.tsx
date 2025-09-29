'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import type { Task, User, TaskStatus } from '@/types';
import { KanbanColumn } from './kanban-column';
import { updateTaskStatus } from '../actions';
import { useToast } from '@/hooks/use-toast';

type AssigneeInfo = { name: string; avatar?: string };

type EnrichedTask = Task & { 
    assignees: AssigneeInfo[];
};

type ColumnData = {
  id: TaskStatus;
  title: string;
  taskIds: string[];
};

type BoardState = {
  tasks: Record<string, EnrichedTask>;
  columns: Record<TaskStatus, ColumnData>;
  columnOrder: TaskStatus[];
};

const getSubordinates = (managerId: string, allUsers: User[]): string[] => {
  const manager = allUsers.find(u => u.id === managerId);
  if (!manager) return [];

  let directSubordinates: User[] = [];

  if (manager.role === 'Chair of Directors') {
    directSubordinates = allUsers.filter(user => user.team === manager.team && (user.role === 'Lead' || user.role === 'Member'));
  }
  else if (manager.role === 'Lead') {
    directSubordinates = allUsers.filter(user => user.subTeam === manager.subTeam && user.role === 'Member');
  }

  const subordinateIds = directSubordinates.map(s => s.id);
  const nestedSubordinates = subordinateIds.flatMap(id => getSubordinates(id, allUsers));
  
  return [...subordinateIds, ...nestedSubordinates];
};


export default function KanbanBoard({
  initialTasks,
  users,
  currentUser,
}: {
  initialTasks: Task[];
  users: User[];
  currentUser: User;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const visibleTasks = useMemo(() => {
    const { role, id } = currentUser;

    if (role === 'Co-founder' || role === 'Secretary') {
      return initialTasks;
    }
    
    if (role === 'Member') {
      return initialTasks.filter(task => task.assignedToIds.includes(id));
    }
    
    if (role === 'Chair of Directors' || role === 'Lead') {
        const subordinateIds = getSubordinates(id, users);
        const teamMemberIds = new Set([id, ...subordinateIds]);
      
        return initialTasks.filter(task => 
            task.assignedToIds.some(assigneeId => teamMemberIds.has(assigneeId)) || task.assignedById === id
        );
    }

    return [];
  }, [currentUser, users, initialTasks]);

  const initialState: BoardState = useMemo(() => {
    const enrichedTasks = visibleTasks.map(task => {
        const assignees = users
            .filter(u => task.assignedToIds.includes(u.id))
            .map(u => ({ name: u.name, avatar: u.avatar }));
        
        return {
            ...task,
            assignees: assignees.length > 0 ? assignees : [{ name: 'Unassigned', avatar: '' }],
        }
    });

    const tasksById = enrichedTasks.reduce((acc, task) => {
        acc[task.id] = task;
        return acc;
    }, {} as Record<string, EnrichedTask>);

    const columns: Record<TaskStatus, ColumnData> = {
      'To Do': { id: 'To Do', title: 'To Do', taskIds: [] },
      'In Progress': { id: 'In Progress', title: 'In Progress', taskIds: [] },
      'Done': { id: 'Done', title: 'Done', taskIds: [] },
      'Cancelled': { id: 'Cancelled', title: 'Cancelled', taskIds: [] },
    };

    enrichedTasks.forEach(task => {
      if (columns[task.status]) {
        columns[task.status].taskIds.push(task.id);
      }
    });
    
    const columnOrder: TaskStatus[] = ['To Do', 'In Progress', 'Done'];


    return {
      tasks: tasksById,
      columns,
      columnOrder,
    };
  }, [visibleTasks, users]);

  const [boardState, setBoardState] = useState(initialState);
  
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = boardState.columns[source.droppableId as TaskStatus];
    const endColumn = boardState.columns[destination.droppableId as TaskStatus];
    const task = boardState.tasks[draggableId];

    if (!task.assignedToIds.includes(currentUser.id)) {
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You can only change the status of tasks assigned to you.",
        });
        return;
    }

    if (startColumn === endColumn) {
        const newTaskIds = Array.from(startColumn.taskIds);
        newTaskIds.splice(source.index, 1);
        newTaskIds.splice(destination.index, 0, draggableId);

        const newColumn = {
            ...startColumn,
            taskIds: newTaskIds,
        };

        setBoardState({
            ...boardState,
            columns: {
            ...boardState.columns,
            [newColumn.id]: newColumn,
            },
        });
        return;
    }

    // Moving from one list to another
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStartColumn = {
      ...startColumn,
      taskIds: startTaskIds,
    };

    const endTaskIds = Array.from(endColumn.taskIds);
    endTaskIds.splice(destination.index, 0, draggableId);
    const newEndColumn = {
      ...endColumn,
      taskIds: endTaskIds,
    };
    
    const newBoardState: BoardState = {
        ...boardState,
        columns: {
            ...boardState.columns,
            [newStartColumn.id]: newStartColumn,
            [newEndColumn.id]: newEndColumn,
        },
        tasks: {
            ...boardState.tasks,
            [draggableId]: {
                ...task,
                status: destination.droppableId as TaskStatus,
            }
        }
    }
    
    setBoardState(newBoardState);

    startTransition(async () => {
        try {
            const formData = new FormData();
            formData.append('taskId', draggableId);
            formData.append('status', destination.droppableId as TaskStatus);
            await updateTaskStatus(formData);

            toast({
                title: "Task Updated",
                description: `Moved "${boardState.tasks[draggableId].title}" to ${destination.droppableId}.`,
            });
        } catch (error) {
            setBoardState(boardState); // Revert on error
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error instanceof Error ? error.message : "Could not update task status.",
            });
        }
    });

  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 items-start">
        {boardState.columnOrder.map(columnId => {
          const column = boardState.columns[columnId];
          const tasks = column.taskIds.map(taskId => boardState.tasks[taskId]);

          return (
            <KanbanColumn key={column.id} column={column} tasks={tasks} />
          );
        })}
      </div>
    </DragDropContext>
  );
}
