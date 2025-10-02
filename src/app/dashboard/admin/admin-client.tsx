
'use client';

import { useState, useTransition } from 'react';
import type { User, UserRole, Team, SubTeam } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateUser, seedUsers } from './actions';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const roles: UserRole[] = ['Co-founder', 'Secretary', 'Chair of Directors', 'Lead', 'Member'];
const teams: (Team | null)[] = ['Presidium', 'Technology', 'Corporate', 'Creatives', null];
const subTeams: (SubTeam | null)[] = [
    'dev', 'ui-ux', 'aiml', 'cloud', 'iot', 
    'events', 'ops', 'pr', 'sponsorship', 
    'digital-design', 'media', null
];
const NONE_VALUE = "__NONE__";

export default function AdminClient({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleInputChange = (userId: string, field: keyof User, value: string | null) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, [field]: value === NONE_VALUE ? null : value } : user
      )
    );
  };

  const handleSaveChanges = (userId: string) => {
    const userToSave = users.find(u => u.id === userId);
    if (!userToSave) return;

    startTransition(async () => {
      try {
        await updateUser(userToSave);
        toast({
          title: 'User Updated',
          description: `${userToSave.name}'s data has been saved.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update user.',
        });
        // Revert changes on error if needed
        setUsers(initialUsers);
      }
    });
  };

  const handleSeedDatabase = () => {
    startTransition(async () => {
      try {
        const newUsers = await seedUsers();
        setUsers(newUsers);
        toast({
          title: 'Database Seeded',
          description: 'User data has been reset to the initial seed.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to seed database.',
        });
      }
    });
  };

  return (
    <Card className="glass">
      <CardContent className="pt-6">
        <div className="flex justify-end mb-4">
           <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isPending}>
                  {isPending ? 'Seeding...' : 'Seed Database'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all existing user data and replace it with the initial seed data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSeedDatabase}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Sub-Team</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Birthday</TableHead>
              <TableHead>LinkedIn</TableHead>
              <TableHead>GitHub</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <Input
                    value={user.name}
                    onChange={e => handleInputChange(user.id, 'name', e.target.value)}
                    className="w-40"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={user.username}
                    onChange={e => handleInputChange(user.id, 'username', e.target.value)}
                    className="w-40"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="email"
                    value={user.email}
                    onChange={e => handleInputChange(user.id, 'email', e.target.value)}
                    className="w-48"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value: UserRole) => handleInputChange(user.id, 'role', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.team || NONE_VALUE}
                    onValueChange={(value: string) => handleInputChange(user.id, 'team', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team || 'null'} value={team || NONE_VALUE}>
                          {team || 'None'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                 <TableCell>
                  <Select
                    value={user.subTeam || NONE_VALUE}
                    onValueChange={(value: string) => handleInputChange(user.id, 'subTeam', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select sub-team" />
                    </SelectTrigger>
                    <SelectContent>
                      {subTeams.map(subTeam => (
                        <SelectItem key={subTeam || 'null'} value={subTeam || NONE_VALUE}>
                          {subTeam || 'None'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={user.phone || ''}
                    onChange={e => handleInputChange(user.id, 'phone', e.target.value)}
                    className="w-36"
                    placeholder="e.g. +1-..."
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={user.birthday || ''}
                    onChange={e => handleInputChange(user.id, 'birthday', e.target.value)}
                    className="w-32"
                    placeholder="YYYY-MM-DD"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={user.linkedin || ''}
                    onChange={e => handleInputChange(user.id, 'linkedin', e.target.value)}
                    className="w-48"
                    placeholder="LinkedIn URL"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={user.github || ''}
                    onChange={e => handleInputChange(user.id, 'github', e.target.value)}
                    className="w-48"
                    placeholder="GitHub URL"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => handleSaveChanges(user.id)} disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
