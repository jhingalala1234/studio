'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export async function createAnnouncement(data: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("You must be logged in.");
  }
  
  const allowedRoles: (string | undefined)[] = ['Co-founder', 'Secretary', 'Chair of Directors'];
  if (!allowedRoles.includes(currentUser.role)) {
      throw new Error("You do not have permission to create announcements.");
  }
  
  const validatedFields = announcementSchema.safeParse({
    title: data.get('title'),
    content: data.get('content'),
  });

  if (!validatedFields.success) {
    throw new Error("Invalid announcement data.");
  }
  
  const { title, content } = validatedFields.data;

  const newAnnouncement = {
    title,
    content,
    authorId: currentUser.id,
    createdAt: new Date().toISOString(),
  };

  await adminDb.collection("announcements").add(newAnnouncement);

  revalidatePath("/dashboard");
}
