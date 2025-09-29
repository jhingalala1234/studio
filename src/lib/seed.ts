import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

// IMPORTANT: Replace with your actual service account key JSON file path
// You can download this from your Firebase project settings
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.projectId,
});

const db = getFirestore();

const users = [
  {
    id: 'user-1',
    name: 'Tanish Poddar',
    username: 'Tanishpoddar.18',
    password: 'password123', // In a real app, hash this!
    email: 'tanish.poddar@cloudx.com',
    avatar: 'https://picsum.photos/seed/tanish/100/100',
    role: 'Co-founder',
    team: 'Presidium',
    subTeam: null,
    birthday: '1998-05-18',
    phone: '+1-202-555-0178',
    linkedin: 'https://linkedin.com/in/tanishpoddar',
    github: 'https://github.com/tanishpoddar'
  },
  {
    id: 'user-2',
    name: 'Sarthak Lal',
    username: 'Sarthaklal.18',
    password: 'password123',
    email: 'sarthak.lal@cloudx.com',
    avatar: 'https://picsum.photos/seed/sarthak/100/100',
    role: 'Co-founder',
    team: 'Presidium',
    subTeam: null,
    birthday: '1999-02-11',
    phone: '+1-202-555-0112',
    linkedin: 'https://linkedin.com/in/sarthaklal',
    github: 'https://github.com/sarthaklal'
  },
  {
    id: 'user-3',
    name: 'Asmi Sharma',
    username: 'Asmisharma.18',
    password: 'password123',
    email: 'asmi.sharma@cloudx.com',
    avatar: 'https://picsum.photos/seed/asmi/100/100',
    role: 'Secretary',
    team: 'Presidium',
    subTeam: null,
    birthday: '2000-09-01',
    phone: '+1-202-555-0145',
    linkedin: 'https://linkedin.com/in/asmisharma',
    github: 'https://github.com/asmisharma'
  },
  {
    id: 'user-4',
    name: 'Sukhad Kaur',
    username: 'Sukhadkaur.18',
    password: 'password123',
    email: 'sukhad.kaur@cloudx.com',
    avatar: 'https://picsum.photos/seed/sukhad/100/100',
    role: 'Chair of Directors',
    team: 'Technology',
    subTeam: null,
    birthday: '2001-11-23',
    phone: '+1-202-555-0189',
    linkedin: 'https://linkedin.com/in/sukhadkaur',
    github: 'https://github.com/sukhadkaur'
  },
  {
    id: 'user-5',
    name: 'Kavya Singh',
    username: 'Kavyasingh.18',
    password: 'password123',
    email: 'kavya.singh@cloudx.com',
    avatar: 'https://picsum.photos/seed/kavya/100/100',
    role: 'Chair of Directors',
    team: 'Corporate',
    subTeam: null,
    birthday: '2000-07-15',
    phone: '+1-202-555-0199',
    linkedin: 'https://linkedin.com/in/kavyasingh',
    github: 'https://github.com/kavyasingh'
  },
  {
    id: 'user-6',
    name: 'Saksham Gupta',
    username: 'Sakshamgupta.18',
    password: 'password123',
    email: 'saksham.gupta@cloudx.com',
    avatar: 'https://picsum.photos/seed/saksham/100/100',
    role: 'Chair of Directors',
    team: 'Creatives',
    subTeam: null,
    birthday: '2002-01-30',
    phone: '+1-202-555-0121',
    linkedin: 'https://linkedin.com/in/sakshamgupta',
    github: 'https://github.com/sakshamgupta'
  },
];


const tasks = [
    {
      id: 'task-1',
      title: 'Develop new authentication module',
      description: 'Implement JWT-based authentication for the main application.',
      status: 'In Progress',
      priority: 'High',
      urgent: true,
      assignedToId: 'user-4', // Sukhad Kaur
      assignedById: 'user-1', // Tanish Poddar
      createdAt: '2024-07-20T10:00:00Z',
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      files: [],
      links: [],
    },
];

const logs = [
    {
        id: 'log-1',
        message: 'Tanish Poddar assigned "Develop new authentication module" to Sukhad Kaur.',
        timestamp: '2024-07-20T10:00:00Z',
        userId: 'user-1',
        taskId: 'task-1'
    },
];


async function seedDatabase() {
  console.log('Starting to seed database...');

  // Seed users
  const usersCollection = db.collection('users');
  for (const user of users) {
    await usersCollection.doc(user.id).set(user);
    console.log(`Seeded user: ${user.name}`);
  }

  // Seed tasks
  const tasksCollection = db.collection('tasks');
  for (const task of tasks) {
      await tasksCollection.doc(task.id).set(task);
      console.log(`Seeded task: ${task.title}`);
  }

  // Seed logs
  const logsCollection = db.collection('logs');
  for (const log of logs) {
      await logsCollection.doc(log.id).set(log);
      console.log(`Seeded log: ${log.message}`);
  }

  console.log('Database seeding completed successfully!');
}

seedDatabase().catch(error => {
  console.error('Error seeding database:', error);
});
