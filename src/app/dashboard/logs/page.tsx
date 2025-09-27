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
import { getAllUsers, getAllTasks, getAllLogs } from '@/lib/data';

// Helper function to get all subordinates of a manager (recursively)
const getSubordinates = (managerId: string, allUsers: User[]): string[] => {
  const directSubordinates = allUsers.filter(user => {
    // A Chair's subordinates are Leads in their team
    const manager = allUsers.find(u => u.id === managerId);
    if (manager?.role === 'Chair of Directors') {
      return user.role === 'Lead' && user.team === manager.team;
    }
    // A Lead's subordinates are Members in their sub-team
    if (manager?.role === 'Lead') {
      return user.role === 'Member' && user.subTeam === manager.subTeam;
    }
    return false;
  });

  const subordinateIds = directSubordinates.map(s => s.id);
  
  return [
    ...subordinateIds,
    ...subordinateIds.flatMap(id => getSubordinates(id, allUsers))
  ];
};


export default async function LogsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const users = await getAllUsers();
  const tasks = await getAllTasks();
  const allLogs = await getAllLogs();

  const getVisibleLogs = () => {
    const userRole = currentUser.role;

    if (userRole === 'Co-founder' || userRole === 'Secretary') {
      // Presidium can see all logs
      return allLogs;
    }
    
    const tasksAssignedToMe = tasks.filter(t => t.assignedToId === currentUser.id).map(t => t.id);
    const logsAboutMyTasks = allLogs.filter(log => log.taskId && tasksAssignedToMe.includes(log.taskId));
    const logsByMe = allLogs.filter(log => log.userId === currentUser.id);

    if (userRole === 'Member') {
      // Members see logs for tasks assigned to them, or actions they took.
      const relevantLogs = [...logsAboutMyTasks, ...logsByMe];
      return Array.from(new Set(relevantLogs.map(l => l.id))).map(id => relevantLogs.find(l => l.id === id)!);
    }
    
    let subordinates: string[] = [];
    if (userRole === 'Chair of Directors' || userRole === 'Lead') {
      subordinates = getSubordinates(currentUser.id, users);
    }

    // Chair of Directors also see logs from members in their team
    if (userRole === 'Chair of Directors') {
        const teamMembers = users.filter(u => u.team === currentUser.team && u.role === 'Member').map(u => u.id);
        subordinates = [...subordinates, ...teamMembers];
    }
    
    const logsBySubordinates = allLogs.filter(log => subordinates.includes(log.userId));

    // Combine and deduplicate
    const relevantLogs = [...logsAboutMyTasks, ...logsByMe, ...logsBySubordinates];
    return Array.from(new Set(relevantLogs.map(l => l.id))).map(id => relevantLogs.find(l => l.id === id)!);
  };

  const filteredLogs = getVisibleLogs();


  const enrichedLogs = filteredLogs
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
            {enrichedLogs.map((log, index) => (
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
                {index < enrichedLogs.length - 1 && <Separator />}
              </div>
            ))}
             {enrichedLogs.length === 0 && (
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
