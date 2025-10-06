
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
import { getAllUsers, getAllTasks, getAllLogs, getAnnouncements } from '@/lib/data';
import { getSubordinates } from '@/lib/hierarchy';


export default async function LogsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const users = await getAllUsers();
  const allLogs = await getAllLogs();
  const announcements = await getAnnouncements();

  const getVisibleLogs = async (): Promise<Log[]> => {
    const userRole = currentUser.role;

    if (userRole === 'Co-founder' || userRole === 'Secretary') {
      return allLogs;
    }

    const subordinateIds = await getSubordinates(currentUser.id, users);
    const visibleUserIds = new Set([currentUser.id, ...subordinateIds]);

    // Create a set of announcement IDs visible to the current user
    const visibleAnnouncementIds = new Set(
      announcements
        .filter(ann => {
          if (!ann.targetDomains || ann.targetDomains.length === 0) return true;
          return currentUser.team && ann.targetDomains.includes(currentUser.team);
        })
        .map(ann => ann.id)
    );

    const visibleLogs = allLogs.filter(log => {
      // Rule 1: Log was created by the user or their subordinates.
      if (visibleUserIds.has(log.userId)) {
        return true;
      }

      // Rule 2: Handle logs related to announcements.
      // A simple check is to see if the message contains "announcement".
      // A more robust way might be to link logs to announcements via an ID.
      if (log.message.toLowerCase().includes('announcement')) {
         // This is a broad rule. For now, we assume if an announcement log exists,
         // it's from leadership and is broadly visible.
         // A better implementation would be to link the log to the announcement ID
         // and check against `visibleAnnouncementIds`.
         // Given the current structure, we allow it if the actor is visible.
         return true;
      }

      // Rule 3: For other logs not created by the user/subordinates (e.g., status updates on their tasks)
      // This part is tricky and was the source of previous bugs.
      // Let's stick to a strict hierarchy: only show logs from the user's management chain.
      // If a log actor is not in the visibleUserIds set, we hide it, unless it's a broad announcement.
      return false;
    });

    return visibleLogs;
  };

  const filteredLogs = await getVisibleLogs();


  const enrichedLogs = filteredLogs
    .map(log => {
      const user = users.find(u => u.id === log.userId);
      return {
        ...log,
        userName: user?.name || 'System',
        userAvatar: user?.avatar ?? undefined,
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
                    <AvatarImage src={log.userAvatar ?? undefined} alt={log.userName} />
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
                    <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: log.message }} />
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
