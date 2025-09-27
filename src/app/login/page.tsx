import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(hsl(var(--accent)/0.1)_1px,transparent_1px)] [background-size:32px_32px]"></div>
      
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Use <span className="font-semibold text-foreground">demo@demo.com</span> and password <span className="font-semibold text-foreground">demodemo</span> to log in.
        </p>
      </div>
    </div>
  );
}
