import type { User, Task, Log } from '@/types';

export const users: User[] = [
  // Presidium
  {
    id: 'user-1',
    name: 'Sarah Lee',
    email: 'sarah.lee@cloudx.com',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    role: 'Co-founder',
    team: 'Presidium',
    subTeam: null,
  },
  {
    id: 'user-2',
    name: 'David Kim',
    email: 'david.kim@cloudx.com',
    avatar: 'https://picsum.photos/seed/david/100/100',
    role: 'Co-founder',
    team: 'Presidium',
    subTeam: null,
  },
    {
    id: 'user-8',
    name: 'Jessica Chen',
    email: 'jessica.chen@cloudx.com',
    avatar: 'https://picsum.photos/seed/jessica/100/100',
    role: 'Secretary',
    team: 'Presidium',
    subTeam: null,
  },
  // Chair of Directors
  {
    id: 'user-3',
    name: 'Alex Johnson',
    email: 'demo@demo.com', // Director of Technology - for login
    avatar: 'https://picsum.photos/seed/alex/100/100',
    role: 'Chair of Directors',
    team: 'Technology',
    subTeam: null,
  },
  {
    id: 'user-4',
    name: 'Maria Garcia',
    email: 'maria.garcia@cloudx.com',
    avatar: 'https://picsum.photos/seed/maria/100/100',
    role: 'Chair of Directors',
    team: 'Corporate',
    subTeam: null,
  },
  {
    id: 'user-5',
    name: 'James Smith',
    email: 'james.smith@cloudx.com',
    avatar: 'https://picsum.photos/seed/james/100/100',
    role: 'Chair of Directors',
    team: 'Creatives',
    subTeam: null,
  },
  // Leads - Technology
  {
    id: 'user-6',
    name: 'Emily White',
    email: 'emily.white@cloudx.com',
    avatar: 'https://picsum.photos/seed/emily/100/100',
    role: 'Lead',
    team: 'Technology',
    subTeam: 'dev',
  },
  {
    id: 'user-7',
    name: 'Michael Brown',
    email: 'michael.brown@cloudx.com',
    avatar: 'https://picsum.photos/seed/michael/100/100',
    role: 'Lead',
    team: 'Technology',
    subTeam: 'ui-ux',
  },
   // Members
  {
    id: 'user-9',
    name: 'Chris Green',
    email: 'chris.green@cloudx.com',
    avatar: 'https://picsum.photos/seed/chris/100/100',
    role: 'Member',
    team: 'Technology',
    secondaryTeam: 'Creatives',
    subTeam: 'dev',
  },
  {
    id: 'user-10',
    name: 'Linda Hall',
    email: 'linda.hall@cloudx.com',
    avatar: 'https://picsum.photos/seed/linda/100/100',
    role: 'Member',
    team: 'Corporate',
    subTeam: 'events',
  },
];

export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Develop new authentication module',
    description: 'Implement JWT-based authentication for the main application.',
    status: 'In Progress',
    priority: 'High',
    urgent: true,
    assignedToId: 'user-6',
    assignedById: 'user-3',
    createdAt: '2024-07-20T10:00:00Z',
    dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // Due in 12 hours
    files: [],
    links: [],
  },
  {
    id: 'task-2',
    title: 'Design marketing page mockups',
    description: 'Create high-fidelity mockups for the new product marketing page.',
    status: 'To Do',
    priority: 'Medium',
    urgent: false,
    assignedToId: 'user-7',
    assignedById: 'user-3',
    createdAt: '2024-07-21T11:30:00Z',
    dueDate: '2024-07-28T23:59:59Z',
    files: [],
    links: [],
  },
  {
    id: 'task-3',
    title: 'Organize Q3 tech summit',
    description: 'Plan and organize the logistics for the upcoming Q3 technology summit.',
    status: 'Done',
    priority: 'High',
    urgent: false,
    assignedToId: 'user-4',
    assignedById: 'user-1',
    createdAt: '2024-06-15T09:00:00Z',
    dueDate: '2024-07-15T23:59:59Z',
    files: ['/path/to/final_plan.pdf'],
    links: ['https://summit.example.com'],
  },
  {
    id: 'task-4',
    title: 'Refactor legacy API endpoints',
    description: 'Improve performance and readability of legacy API endpoints.',
    status: 'To Do',
    priority: 'Low',
    urgent: false,
    assignedToId: 'user-9',
    assignedById: 'user-6',
    createdAt: '2024-07-22T14:00:00Z',
    dueDate: '2024-08-15T23:59:59Z',
    files: [],
    links: [],
  },
  {
    id: 'task-5',
    title: 'Create social media campaign assets',
    description: 'Design all visual assets for the upcoming social media campaign.',
    status: 'In Progress',
    priority: 'Medium',
    urgent: false,
    assignedToId: 'user-5',
    assignedById: 'user-2',
    createdAt: '2024-07-18T16:00:00Z',
    dueDate: '2024-07-25T23:59:59Z',
    files: [],
    links: [],
  },
  {
    id: 'task-6',
    title: 'Finalize budget for next quarter',
    description: 'Review all department budget proposals and finalize the budget for the next quarter.',
    status: 'To Do',
    priority: 'High',
    urgent: true,
    assignedToId: 'user-8',
    assignedById: 'user-1',
    createdAt: '2024-07-25T09:00:00Z',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 days
    files: [],
    links: [],
  }
];

export const logs: Log[] = [
    {
        id: 'log-1',
        message: 'Sarah Lee assigned "Organize Q3 tech summit" to Maria Garcia.',
        timestamp: '2024-06-15T09:00:00Z',
        userId: 'user-1',
        taskId: 'task-3'
    },
    {
        id: 'log-2',
        message: 'James Smith updated status of "Create social media campaign assets" to In Progress.',
        timestamp: '2024-07-19T10:00:00Z',
        userId: 'user-5',
        taskId: 'task-5'
    },
    {
        id: 'log-3',
        message: 'Alex Johnson assigned "Develop new authentication module" to Emily White.',
        timestamp: '2024-07-20T10:00:00Z',
        userId: 'user-3',
        taskId: 'task-1'
    },
    {
        id: 'log-4',
        message: 'Emily White updated status of "Develop new authentication module" to In Progress.',
        timestamp: '2024-07-21T09:30:00Z',
        userId: 'user-6',
        taskId: 'task-1'
    },
    {
        id: 'log-5',
        message: 'Alex Johnson assigned "Design marketing page mockups" to Michael Brown.',
        timestamp: '2024-07-21T11:30:00Z',
        userId: 'user-3',
        taskId: 'task-2'
    },
    {
        id: 'log-6',
        message: 'Emily White assigned "Refactor legacy API endpoints" to Chris Green.',
        timestamp: '2024-07-22T14:00:00Z',
        userId: 'user-6',
        taskId: 'task-4'
    },
    {
        id: 'log-7',
        message: 'Sarah Lee assigned "Finalize budget for next quarter" to Jessica Chen.',
        timestamp: '2024-07-25T09:00:00Z',
        userId: 'user-1',
        taskId: 'task-6'
    }
]
