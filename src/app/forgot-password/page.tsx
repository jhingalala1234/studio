
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
import { useTransition, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { sendPasswordResetLink } from '../actions';
import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      router.push('/login');
    }
    return () => clearTimeout(timer);
  }, [countdown, router]);


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
        const result = await sendPasswordResetLink(data.email);
        if (result?.error) {
          setError(result.error);
        } else {
          setSuccess('If an account exists for this email, a password reset link has been sent. Please check your inbox.');
          form.reset();
          setCountdown(5);
        }
      } catch (error: any) {
        console.error("Password reset failed:", error);
        setError('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
        <Card className="glass">
          <CardContent className="flex items-center justify-center p-6">
            <Logo />
          </CardContent>
        </Card>
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
                {error && !success && (
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
                {countdown !== null && (
                   <div className="text-center text-sm text-muted-foreground">
                        Redirecting you to the login page in {countdown}...
                    </div>
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
                        placeholder="ab1234@srmist.edu.in"
                        {...field}
                        disabled={isPending || countdown !== null}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isPending || countdown !== null}>
                {isPending ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button variant="link" asChild>
                    <Link href="/login">⬅️ Back to Login!</Link>
                </Button>
            </CardFooter>
            </form>
        </Form>
        </Card>
    </main>
  );
}
