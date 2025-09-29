import { getAllUsers } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { UserCard } from './user-card';
import type { User, Team } from '@/types';

const TeamSection = ({ title, users }: { title: string; users: User[] }) => {
  if (users.length === 0) return null;
  return (
    <div>
      <h2 className="mb-4 font-headline text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {users.sort((a,b) => a.name.localeCompare(b.name)).map(user => <UserCard key={user.id} user={user} />)}
      </div>
    </div>
  );
};

export default async function UsersPage() {
  const users = await getAllUsers();

  const presidium = users.filter(u => u.role === 'Co-founder' || u.role === 'Secretary');
  const directors = users.filter(u => u.role === 'Chair of Directors');
  const leads = users.filter(u => u.role === 'Lead');
  const members = users.filter(u => u.role === 'Member');

  const technologyMembers = members.filter(u => u.team === 'Technology');
  const corporateMembers = members.filter(u => u.team === 'Corporate');
  const creativesMembers = members.filter(u => u.team === 'Creatives');

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
            <Input
              placeholder="Search users..."
              className="w-full max-w-sm pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <TeamSection title="Presidium" users={presidium} />
        <TeamSection title="Directors" users={directors} />
        <TeamSection title="Leads" users={leads} />
        
        {members.length > 0 && (
           <div>
            <h2 className="mb-4 font-headline text-2xl font-bold">Members</h2>
             <div className="space-y-6">
                <TeamSection title="Technology" users={technologyMembers} />
                <TeamSection title="Corporate" users={corporateMembers} />
                <TeamSection title="Creatives" users={creativesMembers} />
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
