// This is a server-side file.
'use server';

import type { User, Task, Log, Comment, Subtask, TimeLog, Notification } from '@/types';
import { adminDb } from './firebase-admin';
import { cache } from 'react';

export const getAllUsers = cache(async (): Promise<User[]> => {
    const usersSnapshot = await adminDb.collection('users').get();
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
});

export const getUserById = cache(async (id: string): Promise<User | null> => {
    const userDoc = await adminDb.collection('users').doc(id).get();
    if (!userDoc.exists) {
        return null;
    }
    return { id: userDoc.id, ...userDoc.data() } as User;
});

export const getAllTasks = cache(async (): Promise<Task[]> => {
    const tasksSnapshot = await adminDb.collection('tasks').orderBy('createdAt', 'desc').get();
    return tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
});

export const getTasksByAssigneeId = cache(async (assigneeId: string): Promise<Task[]> => {
    const tasksSnapshot = await adminDb.collection('tasks').where('assignedToId', '==', assigneeId).orderBy('createdAt', 'desc').get();
    return tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
});

export const getTaskById = cache(async (id: string): Promise<Task | null> => {
    const taskDoc = await adminDb.collection('tasks').doc(id).get();
    if (!taskDoc.exists) {
        return null;
    }
    return { id: taskDoc.id, ...taskDoc.data() } as Task;
});

export const getAllLogs = cache(async (): Promise<Log[]> => {
    const logsSnapshot = await adminDb.collection('logs').orderBy('timestamp', 'desc').get();
    return logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
});

export const getCommentsForTask = cache(async (taskId: string): Promise<Comment[]> => {
    const commentsSnapshot = await adminDb.collection('comments').where('taskId', '==', taskId).orderBy('createdAt', 'asc').get();
    return commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
});

export const getSubtasksForTask = cache(async (taskId: string): Promise<Subtask[]> => {
    const subtasksSnapshot = await adminDb.collection('subtasks').where('taskId', '==', taskId).orderBy('order', 'asc').get();
    return subtasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtask));
});

export const getTimeLogsForTask = cache(async (taskId: string): Promise<TimeLog[]> => {
    const timeLogsSnapshot = await adminDb.collection('timelogs').where('taskId', '==', taskId).orderBy('startTime', 'desc').get();
    return timeLogsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeLog));
});

export const getNotificationsForUser = cache(async (userId: string): Promise<Notification[]> => {
    const notificationsSnapshot = await adminDb.collection('notifications').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(50).get();
    return notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
});
