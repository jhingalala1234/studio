import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser } from '@/lib/auth';
import type { User, Notification } from '@/types';
import { getAllUsers, getNotificationsForUser } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import Link from 'next/link';

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'TASK_ASSIGNED':
            return <Bell className="h-5 w-5 text-blue-500" />;
        case 'STATUS_UPDATED':
            return <Bell className="h-5 w-5 text-green-500" />;
        case 'COMMENT_ADDED':
            return <Bell className="h-5 w-5 text-purple-500" />;
        case 'DEADLINE_APPROACHING':
            return <Bell className="h-5 w-5 text-yellow-500" />;
        default:
            return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
}


export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const notifications = await getNotificationsForUser(currentUser.id);
  const users = await getAllUsers();

  const enrichedNotifications = notifications
    .map(notification => {
      const actor = users.find(u => u.id === notification.actorId);
      return {
        ...notification,
        actorName: actor?.name || 'System',
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Recent updates and alerts relevant to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4">
            {enrichedNotifications.map((notification, index) => (
              <div key={notification.id}>
                <div className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-lg">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 space-y-1">
                        <Link href={notification.link} className="hover:underline">
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: notification.message }} />
                        </Link>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                {index < enrichedNotifications.length - 1 && <Separator />}
              </div>
            ))}
             {enrichedNotifications.length === 0 && (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                    You have no new notifications.
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
