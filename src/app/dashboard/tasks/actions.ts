"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { differenceInHours } from 'date-fns';
import { getDownloadURL } from 'firebase-admin/storage';


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
      title: data.get('title'),
      description: data.get('description'),
      assignedToId: data.get('assignedToId'),
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

    // File uploads
    const files = data.getAll('files') as File[];
    const fileUrls: string[] = [];

    if (files.length > 0) {
      const bucket = adminStorage.bucket(`gs://${process.env.FIREBASE_STORAGE_BUCKET}`);
      for (const file of files) {
        if (file && file.size > 0) {
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          const filePath = `tasks/${Date.now()}-${file.name}`;
          const fileRef = bucket.file(filePath);
          await fileRef.save(fileBuffer, {
              metadata: { contentType: file.type }
          });
          const downloadUrl = await getDownloadURL(fileRef);
          fileUrls.push(downloadUrl);
        }
      }
    }


    const newTask = {
      title,
      description: description || '',
      assignedToId,
      dueDate: dueDate.toISOString(),
      status: "To Do",
      assignedById: currentUser.id,
      createdAt: new Date().toISOString(),
      files: fileUrls,
      links: links || [],
      urgent: isUrgent,
    };

    const docRef = await adminDb.collection("tasks").add(newTask);
    
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
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while creating the task.");
  }


  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  redirect('/dashboard/tasks');
}
