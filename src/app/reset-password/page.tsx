
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
import { useTransition, useState, Suspense, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Logo } from '@/components/logo';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});


type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordComponent() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid or missing password reset code in the URL.");
      return;
    }
    const auth = getAuth(app);
    verifyPasswordResetCode(auth, oobCode).catch((error) => {
      setError("Your password reset link is invalid or has expired. Please request a new one.");
      console.error("Verification error:", error);
    });
  }, [oobCode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      router.push('/login');
    }
    return () => clearTimeout(timer);
  }, [countdown, router]);


  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    setError(null);
    if (!oobCode) {
        setError('No reset token found. Please request a new link.');
        return;
    }
    startTransition(async () => {
      try {
        const auth = getAuth(app);
        await confirmPasswordReset(auth, oobCode, data.password);
        toast({
          title: 'Password Reset Successful',
          description: 'You can now log in with your new password.',
        });
        setCountdown(5);
      } catch (error: any) {
        console.error("Reset failed", error);
        setError(error.message || 'Failed to reset password. The link may be expired.');
        toast({
          variant: 'destructive',
          title: 'Reset Failed',
          description: error.message || 'The link may be expired or invalid.',
        });
      }
    });
  };

  if (!oobCode) {
      return (
          <Card className="w-full max-w-sm glass">
            <CardHeader>
                <CardTitle>Invalid Link</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || "The password reset link is missing or invalid. Please request a new one."}</AlertDescription>
                </Alert>
            </CardContent>
             <CardFooter>
                <Button asChild className="w-full">
                    <Link href="/forgot-password">Request a new link</Link>
                </Button>
            </CardFooter>
          </Card>
      )
  }

  return (
    <Card className="w-full max-w-sm glass">
      <CardHeader>
        <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>
          Enter your new password below.
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
            {countdown !== null && (
              <div className="text-center text-sm text-muted-foreground">
                Redirecting you to the login page in {countdown}...
              </div>
            )}
             <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <div className="relative">
                        <FormControl>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
                            disabled={isPending || countdown !== null}
                            className="pr-10"
                        />
                        </FormControl>
                        <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        disabled={isPending || countdown !== null}
                        >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                     <div className="relative">
                        <FormControl>
                        <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
                            disabled={isPending || countdown !== null}
                            className="pr-10"
                        />
                        </FormControl>
                        <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        disabled={isPending || countdown !== null}
                        >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isPending || countdown !== null}>
              {isPending ? 'Resetting...' : 'Set New Password'}
            </Button>
            <Button variant="link" asChild>
              <Link href="/login">⬅️ Back to Login!</Link>
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}


export default function ResetPasswordPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
            <Card className="glass">
                <CardContent className="flex items-center justify-center p-6">
                    <Logo />
                </CardContent>
            </Card>
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordComponent />
            </Suspense>
        </main>
    )
}
