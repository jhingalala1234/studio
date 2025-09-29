"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { differenceInHours } from 'date-fns';
import type { TaskStatus, Subtask } from "@/types";
import {FieldValue} from 'firebase-admin/firestore';

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.string().min(1, "Please assign the task to a user"),
  dueDate: z.date({ required_error: "A due date is required." }),
  links: z.array(z.string().url().or(z.literal(''))).optional(),
});

async function createNotification(
  userId: string,
  actorId: string,
  type: 'TASK_ASSIGNED' | 'STATUS_UPDATED' | 'COMMENT_ADDED' | 'DEADLINE_APPROACHING',
  message: string,
  link: string
) {
    await adminDb.collection('notifications').add({
        userId,
        actorId,
        type,
        message,
        link,
        isRead: false,
        createdAt: new Date().toISOString(),
    });
}

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
    
    const notifMessage = `<strong>${currentUser.name}</strong> assigned a new task to you: <strong>${newTask.title}</strong>`;
    await createNotification(
      newTask.assignedToId,
      currentUser.id,
      'TASK_ASSIGNED',
      notifMessage,
      `/dashboard/tasks/${docRef.id}`
    );


  } catch (error) {
    console.error("Failed to create task:", error);
    if (error instanceof Error && !error.message.includes('NEXT_REDIRECT')) {
        throw new Error(error.message);
    }
  }


  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/my-week");
  revalidatePath("/dashboard/tasks/board");
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
        await taskRef.delete();
        console.log(`Successfully deleted task with ID: ${taskId}`);

        const collectionsToDelete = ['logs', 'comments', 'subtasks', 'notifications'];
        for (const collection of collectionsToDelete) {
            const snapshot = await adminDb.collection(collection).where("taskId", "==", taskId).get();
            if (!snapshot.empty) {
                const batch = adminDb.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log(`Deleted ${snapshot.size} associated documents from ${collection}.`);
            }
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
    revalidatePath("/dashboard/my-week");
    revalidatePath("/dashboard/tasks/board");
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

        const notifMessage = `<strong>${currentUser.name}</strong> updated the status of <strong>${task.title}</strong> to <strong>${status}</strong>`;
        await createNotification(
            task.assignedById,
            currentUser.id,
            'STATUS_UPDATED',
            notifMessage,
            `/dashboard/tasks/${taskId}`
        );

        
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
    revalidatePath("/dashboard/my-week");
    revalidatePath("/dashboard/tasks/board");
}

const addLinkSchema = z.object({
    taskId: z.string(),
    link: z.string().url("Please enter a valid URL."),
});

export async function addLink(formData: FormData) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("You must be logged in.");
    }

    const validatedFields = addLinkSchema.safeParse({
        taskId: formData.get('taskId'),
        link: formData.get('link'),
    });
    
    if (!validatedFields.success) {
        const error = validatedFields.error.flatten().fieldErrors.link?.[0];
        throw new Error(error || "Invalid data provided.");
    }

    const { taskId, link } = validatedFields.data;
    
    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
        throw new Error("Task not found.");
    }
    const task = taskDoc.data();

    if (task?.assignedToId !== currentUser.id) {
        throw new Error("You do not have permission to add links to this task.");
    }

    try {
        await taskRef.update({
            links: FieldValue.arrayUnion(link)
        });

        const logMessage = `${currentUser.name} added a link to "${task.title}".`;
        await adminDb.collection('logs').add({
            message: logMessage,
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            taskId: taskId,
        });

    } catch (error) {
        console.error("Failed to add link:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while adding the link.");
    }
    revalidatePath(`/dashboard/tasks/${taskId}`);
    revalidatePath("/dashboard/logs");
}

const addCommentSchema = z.object({
    taskId: z.string(),
    comment: z.string().min(1, "Comment cannot be empty."),
});

export async function addComment(formData: FormData) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("You must be logged in.");
    }

    const validatedFields = addCommentSchema.safeParse({
        taskId: formData.get('taskId'),
        comment: formData.get('comment'),
    });

    if (!validatedFields.success) {
        throw new Error("Invalid comment data.");
    }

    const { taskId, comment } = validatedFields.data;
    
    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) throw new Error("Task not found.");
    const task = taskDoc.data();
    if (!task) throw new Error("Task data not found.");

    const commentData = {
        taskId,
        userId: currentUser.id,
        message: comment,
        createdAt: new
 Date().toISOString(),
    };

    await adminDb.collection('comments').add(commentData);
    
    const logMessage = `${currentUser.name} commented on "${task.title}".`;
    await adminDb.collection('logs').add({
        message: logMessage,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        taskId: taskId,
    });
    
    const recipientId = currentUser.id === task.assignedById ? task.assignedToId : task.assignedById;
    const notifMessage = `<strong>${currentUser.name}</strong> left a comment on <strong>${task.title}</strong>`;
    await createNotification(
        recipientId,
        currentUser.id,
        'COMMENT_ADDED',
        notifMessage,
        `/dashboard/tasks/${taskId}`
    );


    revalidatePath(`/dashboard/tasks/${taskId}`);
    revalidatePath("/dashboard/logs");
}

export async function addSubtask(taskId: string, title: string): Promise<Subtask | null> {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("You must be logged in.");

    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data()?.assignedToId !== currentUser.id) {
        throw new Error("You do not have permission to modify this task.");
    }
    
    const subtasksRef = adminDb.collection('subtasks');
    const snapshot = await subtasksRef.where('taskId', '==', taskId).get();
    const order = snapshot.size;

    const newSubtask = {
        taskId,
        title,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        order,
    };
    const docRef = await subtasksRef.add(newSubtask);

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { id: docRef.id, ...newSubtask };
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("You must be logged in.");

    const subtaskRef = adminDb.collection('subtasks').doc(subtaskId);
    // Add permission check if needed
    await subtaskRef.update({ isCompleted });

    revalidatePath(`/dashboard/tasks/${(await subtaskRef.get()).data()?.taskId}`);
}

export async function updateSubtaskOrder(taskId: string, subtaskOrder: string[]) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("You must be logged in.");
    
    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data()?.assignedToId !== currentUser.id) {
        throw new Error("You do not have permission to modify this task.");
    }
    
    const batch = adminDb.batch();
    subtaskOrder.forEach((subtaskId, index) => {
        const subtaskRef = adminDb.collection('subtasks').doc(subtaskId);
        batch.update(subtaskRef, { order: index });
    });

    await batch.commit();
    revalidatePath(`/dashboard/tasks/${taskId}`);
}
