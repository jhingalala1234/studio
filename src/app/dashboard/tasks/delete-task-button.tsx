
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DeleteTaskButtonProps {
  taskId: string;
  asIcon?: boolean;
  onDeleted: () => void;
  isDeleting: boolean;
}

export default function DeleteTaskButton({ taskId, asIcon = false, onDeleted, isDeleting }: DeleteTaskButtonProps) {
  const triggerButton = asIcon ? (
     <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Delete Task</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  ) : (
    <Button variant="destructive" size="sm" disabled={isDeleting}>
        <Trash className="mr-2 h-4 w-4" />
        {isDeleting ? "Deleting..." : "Delete Task"}
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
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDeleted} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
            {isDeleting ? "Deleting..." : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
