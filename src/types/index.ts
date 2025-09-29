export type UserRole = 'Co-founder' | 'Secretary' | 'Chair of Directors' | 'Lead' | 'Member';

export type Team = 'Technology' | 'Corporate' | 'Creatives' | 'Presidium';

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
  username: string;
  password?: string; // Should be handled securely, not stored plaintext
  email: string;
  avatar: string;
  role: UserRole;
  team: Team | null;
  secondaryTeam?: Team | null;
  subTeam: SubTeam | null;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Cancelled';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  urgent: boolean;
  assignedToId: string;
  assignedById: string;
  createdAt: string;
  dueDate: string;
  files: string[];
  links: string[];
}

export interface Log {
    id: string;
    message: string;
    timestamp: string;
    userId: string;
    taskId?: string;
}
