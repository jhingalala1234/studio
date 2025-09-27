import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image 
        src="/logo.png" 
        alt="CloudX Logo" 
        width={40} 
        height={40}
        className="h-10 w-auto"
      />
      <h1 className="font-headline text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
        CloudX Central
      </h1>
    </div>
  );
}
