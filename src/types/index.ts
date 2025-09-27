export type UserRole = 'Presidium' | 'Chair of Directors' | 'Lead' | 'Member';

export type Team = 'Technology' | 'Corporate' | 'Creatives';

export type SubTeam =
  | 'dev'
  | 'ui-ux'
  | 'aiml'
  | 'cloud'
  | 'iot'
  | 'events'
  | 'ops'
  | 'pr'
  | 'sponsorship'
  | 'digital-design'
  | 'media';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  team: Team | null;
  subTeam: SubTeam | null;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Cancelled';

export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string;
  assignedById: string;
  createdAt: string;
  dueDate: string;
}

export interface Log {
    id: string;
    message: string;
    timestamp: string;
    userId: string;
    taskId?: string;
}
