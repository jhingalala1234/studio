// This is a server-side file.
'use server';

import type { User, Task, Log } from '@/types';
import { adminDb } from './firebase-admin';
import { cache } from 'react';

export const getAllUsers = cache(async (): Promise<User[]> => {
    const usersSnapshot = await adminDb.collection('users').get();
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
});

export const getAllTasks = cache(async (): Promise<Task[]> => {
    const tasksSnapshot = await adminDb.collection('tasks').orderBy('createdAt', 'desc').get();
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
    const logsSnapshot = await adminDb.collection('logs').get();
    return logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
});