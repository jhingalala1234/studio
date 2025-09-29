"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, setHours, setMinutes } from "date-fns";
import type { User, Team, UserRole } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { addTask } from "../actions";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from 'react';
import { getAllUsers } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { Checkbox } from "@/components/ui/checkbox";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.string().min(1, "Please assign the task to a user"),
  dueDate: z.date({ required_error: "A due date is required." }),
  dueDateTime: z.object({
      hour: z.string(),
      minute: z.string()
  }),
  links: z.array(z.object({ value: z.string().url("Must be a valid URL unless empty").or(z.literal(''))})).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;


export default function CreateTaskPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters for Presidium
    const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);


    const { toast } = useToast();
    const router = useRouter();
    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            assignedToId: '',
            dueDateTime: { hour: '23', minute: '59' },
            links: [{value: ''}]
        }
    });
    
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "links"
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [user, users] = await Promise.all([getCurrentUser(), getAllUsers()]);
                setCurrentUser(user);
                setAllUsers(users);

            } catch (error) {
                console.error("Failed to fetch data", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to load necessary data." });
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [toast]);

    const assignableUsers = useMemo(() => {
        if (!currentUser) return [];

        const userRole = currentUser.role;

        if (userRole === 'Co-founder' || userRole === 'Secretary') {
             if (selectedTeams.length === 0 && selectedRoles.length === 0) {
                return allUsers.filter(u => u.team !== 'Presidium');
             }

            return allUsers.filter(user => {
                const teamMatch = selectedTeams.length === 0 || (user.team && selectedTeams.includes(user.team));
                const roleMatch = selectedRoles.length === 0 || selectedRoles.includes(user.role);
                return user.team !== 'Presidium' && teamMatch && roleMatch;
            });
        }
        if (userRole === 'Chair of Directors') {
            return allUsers.filter(u => u.team === currentUser.team && (u.role === 'Lead' || u.role === 'Member'));
        }
        if (userRole === 'Lead') {
            return allUsers.filter(u => u.subTeam === currentUser.subTeam && u.role === 'Member');
        }
        return [];

    }, [currentUser, allUsers, selectedTeams, selectedRoles]);
    
    const handleTeamFilterChange = (team: Team) => {
        setSelectedTeams(prev => 
            prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
        );
    }

    const handleRoleFilterChange = (role: UserRole) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    }


  const onSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      const combinedDateTime = setMinutes(setHours(data.dueDate, parseInt(data.dueDateTime.hour, 10)), parseInt(data.dueDateTime.minute, 10));
      
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('assignedToId', data.assignedToId);
      formData.append('dueDate', combinedDateTime.toISOString());
      
      if (data.links) {
        data.links.forEach(link => {
            if(link.value) formData.append('links[]', link.value);
        });
      }

      await addTask(formData);

      toast({
        title: "Success",
        description: "Task created successfully.",
      });
      router.push('/dashboard/tasks');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create task. Please try again.";
        toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
      return (
          <Card className="max-w-3xl mx-auto">
              <CardHeader>
                  <CardTitle>Loading...</CardTitle>
                  <CardDescription>
                      Fetching user data, please wait.
                  </CardDescription>
              </CardHeader>
          </Card>
      )
  }

  if (!currentUser || currentUser.role === 'Member') {
        return (
            <Card className="max-w-3xl mx-auto">
                 <CardHeader>
                    <CardTitle>Permission Denied</CardTitle>
                    <CardDescription>
                       You do not have the required permissions to create a new task.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

  return (
     <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
          <CardDescription>
            Fill out the details below to create a new task.
          </CardDescription>
        </CardHeader>
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Design new homepage" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Add a more detailed description..."
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="assignedToId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assign To</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a team member" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {assignableUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name} ({user.role})
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         {(currentUser.role === 'Co-founder' || currentUser.role === 'Secretary') && (
                            <div className="p-4 border rounded-lg space-y-4">
                               <FormLabel>Filter Assignees</FormLabel>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">By Team</p>
                                        {(['Technology', 'Corporate', 'Creatives'] as Team[]).map(team => (
                                            <div key={team} className="flex items-center space-x-2">
                                                <Checkbox id={`team-${team}`} checked={selectedTeams.includes(team)} onCheckedChange={() => handleTeamFilterChange(team)} />
                                                <label htmlFor={`team-${team}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{team}</label>
                                            </div>
                                        ))}
                                    </div>
                                     <div className="space-y-2">
                                        <p className="text-sm font-medium">By Role</p>
                                        {(['Lead', 'Member'] as UserRole[]).map(role => (
                                            <div key={role} className="flex items-center space-x-2">
                                                <Checkbox id={`role-${role}`} checked={selectedRoles.includes(role)} onCheckedChange={() => handleRoleFilterChange(role)} />
                                                <label htmlFor={`role-${role}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{role}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>
                     <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                             <FormDescription>
                                Tasks with deadlines under 30 hours will be marked as urgent automatically.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="dueDateTime"
                            render={() => (
                                <FormItem>
                                <FormLabel>Due Time</FormLabel>
                                <div className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name="dueDateTime.hour"
                                        render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Hour" />
                                                    </Trigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Array.from({length: 24}, (_, i) => i.toString().padStart(2,'0')).map(hour => <SelectItem key={hour} value={hour}>{hour}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}/>
                                     <FormField
                                        control={form.control}
                                        name="dueDateTime.minute"
                                        render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Minute" />
                                                    </Trigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Array.from({length: 60}, (_, i) => i.toString().padStart(2,'0')).map(min => <SelectItem key={min} value={min}>{min}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}/>
                                </div>
                                 <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>

                    <div className="space-y-4">
                        <FormLabel>Reference Links</FormLabel>
                        {fields.map((field, index) => (
                            <FormField
                                key={field.id}
                                control={form.control}
                                name={`links.${index}.value`}
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Input {...field} placeholder="https://example.com" />
                                            </FormControl>
                                            {index > 0 && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                    <Trash className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                         <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ value: "" })}
                            >
                            Add Link
                        </Button>
                    </div>

                </CardContent>
                <CardFooter>
                    <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="ml-auto">
                        {isSubmitting ? 'Creating...' : 'Create Task'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
     </Card>
  );
};
