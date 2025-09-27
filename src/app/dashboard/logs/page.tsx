import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser } from '@/lib/auth';
import type { User, Log, Task } from '@/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper function to get all subordinates of a manager (recursively)
const getSubordinates = (managerId: string, allUsers: User[]): string[] => {
  const subordinates = allUsers.filter(user => {
    const directManager = (user.subTeam && allUsers.find(u => u.role === 'Lead' && u.subTeam === user.subTeam)?.id) ||
                         (user.team && allUsers.find(u => u.role === 'Chair of Directors' && u.team === user.team)?.id);
    return directManager === managerId;
  });

  const subordinateIds = subordinates.map(s => s.id);

  return [
    ...subordinateIds,
    ...subordinateIds.flatMap(id => getSubordinates(id, allUsers))
  ];
};


export default async function LogsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const usersSnapshot = await getDocs(collection(db, "users"));
  const users: User[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  
  const tasksSnapshot = await getDocs(collection(db, "tasks"));
  const tasks: Task[] = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

  const logsSnapshot = await getDocs(collection(db, "logs"));
  const logs: Log[] = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));


  const getVisibleUserIds = () => {
    switch (currentUser.role) {
      case 'Co-founder':
      case 'Secretary':
        // Presidium can see everything
        return users.map(u => u.id);
      
      case 'Chair of Directors':
        // Can see their own logs, and logs of their directs and sub-directs.
        const directorSubordinates = getSubordinates(currentUser.id, users);
        const teamMemberIds = users.filter(u => u.team === currentUser.team).map(u => u.id);
        return Array.from(new Set([currentUser.id, ...directorSubordinates, ...teamMemberIds]));

      case 'Lead':
        // Can see their own logs and logs of their sub-team members.
        const leadSubordinates = getSubordinates(currentUser.id, users);
        const subTeamMemberIds = users.filter(u => u.subTeam === currentUser.subTeam).map(u => u.id);
        return Array.from(new Set([currentUser.id, ...leadSubordinates, ...subTeamMemberIds]));

      case 'Member':
        // Can only see logs related to tasks assigned to them.
        return [currentUser.id];

      default:
        return [];
    }
  };

  const visibleUserIds = getVisibleUserIds();
  
  const tasksAssignedToMember = tasks.filter(t => t.assignedToId === currentUser.id).map(t => t.id);

  const filteredLogs = logs.filter(log => {
    if (currentUser.role === 'Member') {
        // Members see logs about tasks assigned to them, or actions they took.
        return (log.taskId && tasksAssignedToMember.includes(log.taskId)) || log.userId === currentUser.id;
    }
    // Other roles see logs based on the user who performed the action.
    return visibleUserIds.includes(log.userId);
  });


  const allLogs = filteredLogs
    .map(log => {
      const user = users.find(u => u.id === log.userId);
      return {
        ...log,
        userName: user?.name || 'System',
        userAvatar: user?.avatar,
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <CardDescription>
          A history of relevant actions and updates based on your role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4">
            {allLogs.map((log, index) => (
              <div key={log.id}>
                <div className="flex items-start gap-4 p-4">
                    <Avatar className="h-10 w-10">
                    <AvatarImage src={log.userAvatar} alt={log.userName} />
                    <AvatarFallback>
                        {log.userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">{log.userName}</p>
                        <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {log.message}
                    </p>
                    </div>
                </div>
                {index < allLogs.length - 1 && <Separator />}
              </div>
            ))}
             {allLogs.length === 0 && (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No logs to display.
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
