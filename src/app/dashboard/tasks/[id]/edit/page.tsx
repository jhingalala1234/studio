
import { getTaskById, getAllUsers, } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import TaskForm from "../../task-form";

interface EditTaskPageProps {
    params: { id: string };
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
    const [task, users, currentUser] = await Promise.all([
        getTaskById(params.id),
        getAllUsers(),
        getCurrentUser(),
    ]);

    if (!task || !currentUser) {
        notFound();
    }

    const isAssigner = currentUser.id === task.assignedById;
    const isPresidium = currentUser.role === 'Co-founder' || currentUser.role === 'Secretary';

    if (!isAssigner && !isPresidium) {
        // Redirect or show an error message if the user doesn't have permission
        redirect('/dashboard/tasks');
    }

    return (
        <TaskForm 
            formType="edit"
            task={task}
            allUsers={users}
            currentUser={currentUser}
        />
    );
}
