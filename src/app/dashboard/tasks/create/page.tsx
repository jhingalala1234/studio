"use client";

import { useForm } from "react-hook-form";
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
import { Switch } from '@/components/ui/switch';
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { addTask } from "../actions";
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';
import { getAllUsers } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';


const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.string().min(1, "Please assign the task to a user"),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.date({ required_error: "A due date is required." }),
  urgent: z.boolean().default(false),
});

type TaskFormValues = z.infer<typeof taskSchema>;


export default function CreateTaskPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const { toast } = useToast();
    const router = useRouter();
    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
        priority: "Medium",
        urgent: false,
        },
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [user, users] = await Promise.all([getCurrentUser(), getAllUsers()]);
                setCurrentUser(user);
                setAllUsers(users);

                if (user) {
                     const getAssignable = () => {
                        switch (user.role) {
                            case 'Co-founder':
                            case 'Secretary':
                                return users;
                            
                            case 'Chair of Directors':
                                return users.filter(u => u.team === user.team && (u.role === 'Lead' || u.role === 'Member'));

                            case 'Lead':
                                return users.filter(u => u.subTeam === user.subTeam && u.role === 'Member');

                            default:
                                return [];
                        }
                    }
                    setAssignableUsers(getAssignable());
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to load necessary data." });
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [toast]);


  const onSubmit = async (data: TaskFormValues) => {
    try {
      await addTask(data);
      toast({
        title: "Success",
        description: "Task created successfully.",
      });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create task. Please try again.";
        toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
        });
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        "w-full pl-3 text-left font-normal",
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
                                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                            control={form.control}
                            name="urgent"
                            render={({ field }) => (
                                <FormItem className="flex flex-col rounded-lg border p-4">
                                     <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Mark as Urgent
                                        </FormLabel>
                                        <FormDescription>
                                            Urgent tasks will be flagged for immediate attention.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="self-start mt-2"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                            />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting} className="ml-auto">
                        {form.formState.isSubmitting ? 'Creating...' : 'Create Task'}
                    </Button>
                </CardFooter>
            </form>
        </Form>
     </Card>
  );
};
