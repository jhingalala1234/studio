import Link from 'next/link';
import { getAllUsers } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { UserCard } from './user-card';

export default async function UsersPage() {
  const users = await getAllUsers();
  
  // Group users by team
  const teams = users.reduce((acc, user) => {
    const team = user.team || 'No Team';
    if (!acc[team]) {
      acc[team] = [];
    }
    acc[team].push(user);
    return acc;
  }, {} as Record<string, typeof users>);

  const presidium = teams['Presidium'] || [];
  const technology = teams['Technology'] || [];
  const corporate = teams['Corporate'] || [];
  const creatives = teams['Creatives'] || [];


  return (
    <div className="space-y-8">
      <Card className="glass">
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>
            Browse and find members of the CloudX organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-8 w-full max-w-sm" />
            </div>
        </CardContent>
      </Card>
      
      <div className="space-y-8">
        {presidium.length > 0 && (
          <div>
            <h2 className="mb-4 font-headline text-2xl font-bold">Presidium</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {presidium.map(user => <UserCard key={user.id} user={user} />)}
            </div>
          </div>
        )}

        {technology.length > 0 && (
            <div>
                <h2 className="mb-4 font-headline text-2xl font-bold">Technology</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {technology.map(user => <UserCard key={user.id} user={user} />)}
                </div>
            </div>
        )}

        {corporate.length > 0 && (
            <div>
                <h2 className="mb-4 font-headline text-2xl font-bold">Corporate</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {corporate.map(user => <UserCard key={user.id} user={user} />)}
                </div>
            </div>
        )}

        {creatives.length > 0 && (
            <div>
                <h2 className="mb-4 font-headline text-2xl font-bold">Creatives</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {creatives.map(user => <UserCard key={user.id} user={user} />)}
                </div>
            </div>
        )}
      </div>

    </div>
  );
}
