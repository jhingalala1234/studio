"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { differenceInHours } from 'date-fns';
import type { TaskStatus } from "@/types";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.string().min(1, "Please assign the task to a user"),
  dueDate: z.date({ required_error: "A due date is required." }),
  links: z.array(z.string().url().or(z.literal(''))).optional(),
});

export async function addTask(data: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("You must be logged in to add a task.");
  }
  
  if(currentUser.role === 'Member') {
    throw new Error("You do not have permission to create tasks.");
  }

  try {
    const rawData = {
      title: data.get('title') || '',
      description: data.get('description') || '',
      assignedToId: data.get('assignedToId') || '',
      dueDate: new Date(data.get('dueDate') as string),
      links: data.getAll('links[]').map(l => l.toString()).filter(l => l),
    };

    const validatedFields = taskSchema.safeParse(rawData);

    if (!validatedFields.success) {
      console.error('Validation Errors:', validatedFields.error.flatten().fieldErrors);
      throw new Error("Invalid fields provided.");
    }

    const { title, description, assignedToId, dueDate, links } = validatedFields.data;
    
    const isUrgent = differenceInHours(dueDate, new Date()) < 30;

    const newTask = {
      title,
      description: description || '',
      assignedToId,
      dueDate: dueDate.toISOString(),
      status: "To Do",
      assignedById: currentUser.id,
      createdAt: new Date().toISOString(),
      links: links || [],
      urgent: isUrgent,
    };

    const docRef = await adminDb.collection("tasks").add(newTask);
    console.log("Successfully created task with ID:", docRef.id);
    
    const assigneeSnapshot = await adminDb.collection('users').doc(newTask.assignedToId).get();
    if (!assigneeSnapshot.exists) {
        throw new Error("Could not find the assigned user in the database.");
    }
    const assignee = assigneeSnapshot.data();

    const logMessage = `${currentUser.name} assigned "${newTask.title}" to ${assignee?.name}.`;
    await adminDb.collection('logs').add({
      message: logMessage,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      taskId: docRef.id,
    });

  } catch (error) {
    console.error("Failed to create task:", error);
    if (error instanceof Error && !error.message.includes('NEXT_REDIRECT')) {
        throw new Error(error.message);
    }
  }


  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  redirect('/dashboard/tasks');
}


export async function deleteTask(taskId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("You must be logged in to delete a task.");
    }

    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
        throw new Error("Task not found.");
    }

    const task = taskDoc.data();

    if (task?.assignedById !== currentUser.id) {
        throw new Error("You do not have permission to delete this task.");
    }

    try {
        // Delete the task
        await taskRef.delete();
        console.log(`Successfully deleted task with ID: ${taskId}`);

        // Delete associated logs
        const logsQuery = adminDb.collection("logs").where("taskId", "==", taskId);
        const logsSnapshot = await logsQuery.get();
        
        if (!logsSnapshot.empty) {
            const batch = adminDb.batch();
            logsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`Deleted ${logsSnapshot.size} associated logs.`);
        }

    } catch (error) {
        console.error("Failed to delete task:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while deleting the task.");
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/logs");
    revalidatePath("/dashboard");
    redirect('/dashboard/tasks');
}

const updateStatusSchema = z.object({
    taskId: z.string(),
    status: z.enum(['To Do', 'In Progress', 'Done', 'Cancelled']),
});

export async function updateTaskStatus(formData: FormData) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("You must be logged in.");
    }

    const validatedFields = updateStatusSchema.safeParse({
        taskId: formData.get('taskId'),
        status: formData.get('status'),
    });
    
    if (!validatedFields.success) {
        throw new Error("Invalid data provided.");
    }

    const { taskId, status } = validatedFields.data;
    
    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
        throw new Error("Task not found.");
    }

    const task = taskDoc.data();
    if (task?.assignedToId !== currentUser.id) {
        throw new Error("You do not have permission to update this task's status.");
    }
    
    const oldStatus = task.status;

    try {
        await taskRef.update({ status: status });

        const logMessage = `${currentUser.name} updated the status of "${task.title}" from "${oldStatus}" to "${status}".`;
        await adminDb.collection('logs').add({
            message: logMessage,
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            taskId: taskId,
        });
        
    } catch (error) {
        console.error("Failed to update task status:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while updating the task status.");
    }

    revalidatePath(`/dashboard/tasks/${taskId}`);
    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/logs");
}
