"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.string().min(1, "Please assign the task to a user"),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.date({ required_error: "A due date is required." }),
  urgent: z.boolean().default(false),
});

export async function addTask(data: z.infer<typeof taskSchema>) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("You must be logged in to add a task.");
  }
  
  // Basic permission check
  if(currentUser.role === 'Member') {
    throw new Error("You do not have permission to create tasks.");
  }


  const validatedData = taskSchema.parse(data);

  const newTask = {
    ...validatedData,
    id: '', // Firestore will generate this
    status: "To Do",
    assignedById: currentUser.id,
    createdAt: new Date().toISOString(),
    dueDate: validatedData.dueDate.toISOString(),
    files: [],
    links: [],
  };

  const { id, ...taskData } = newTask;

  const docRef = await adminDb.collection("tasks").add(taskData);
  
  // Create a log entry
  const assignee = (await adminDb.collection('users').doc(taskData.assignedToId).get()).data();
  const logMessage = `${currentUser.name} assigned "${taskData.title}" to ${assignee?.name}.`;
  await adminDb.collection('logs').add({
    message: logMessage,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    taskId: docRef.id,
  });

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  redirect('/dashboard/tasks');
}
