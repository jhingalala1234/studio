'use client';

import Link from 'next/link';
import type { User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function UserCard({ user }: { user: User }) {
  const userInitials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <Link href={`/dashboard/users/${user.id}`} className="group">
        <Card className="glass h-full transition-all duration-300 ease-in-out group-hover:border-primary group-hover:shadow-lg group-hover:-translate-y-1">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <Avatar className="h-20 w-20 border-2 border-muted-foreground group-hover:border-accent transition-colors">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                    {user.subTeam && <Badge variant="secondary" className="mt-2">{user.subTeam}</Badge>}
                </div>
            </CardContent>
        </Card>
    </Link>
  );
}
