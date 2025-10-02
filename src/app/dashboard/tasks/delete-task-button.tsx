"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash, Trash2 } from "lucide-react";
import { deleteTask } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DeleteTaskButtonProps {
  taskId: string;
  asIcon?: boolean;
}

export default function DeleteTaskButton({ taskId, asIcon = false }: DeleteTaskButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteTask(taskId);
      } catch (error) {
        // The `redirect` function in a server action throws a special `NEXT_REDIRECT` error.
        // We can safely ignore it here, as the navigation will still happen.
        // Any other error will be caught and displayed in a toast.
        if (
          error instanceof Error &&
          error.message.includes("NEXT_REDIRECT")
        ) {
          return;
        }

        toast({
          variant: "destructive",
          title: "Error deleting task",
          description:
            error instanceof Error ? error.message : "An unknown error occurred.",
        });
      }
    });
  };

  const triggerButton = asIcon ? (
     <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Delete Task</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  ) : (
    <Button variant="destructive" size="sm">
        <Trash className="mr-2 h-4 w-4" />
        Delete Task
    </Button>
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {triggerButton}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the task
            and all associated logs, comments, and subtasks.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending ? "Deleting..." : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
