
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useTransition, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/lib/firebase';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: EmailFormValues) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const auth = getAuth(app);
        await sendPasswordResetEmail(auth, data.email, {
            url: `${process.env.NEXT_PUBLIC_APP_URL}/login` // Redirect back to login after reset
        });
        setSuccess('If an account exists for this email, a password reset link has been sent. Please check your inbox.');
        form.reset();
      } catch (error: any) {
        console.error("Password reset email failed to send:", error);
        // We still show a generic success message to prevent user enumeration
        setSuccess('If an account exists for this email, a password reset link has been sent. Please check your inbox.');
      }
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-sm glass">
        <CardHeader>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
            Enter your email and we'll send you a link to reset your password.
            </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
                {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                )}
                {success && (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                        disabled={isPending}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button variant="link" asChild>
                    <Link href="/login">Back to login</Link>
                </Button>
            </CardFooter>
            </form>
        </Form>
        </Card>
    </main>
  );
}
