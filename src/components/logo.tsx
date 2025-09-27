import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Image 
        src="/logo.png" 
        alt="CloudX Logo" 
        width={48} 
        height={48}
        className="h-12 w-auto"
      />
      <h1 className="font-headline text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
        CloudX Central
      </h1>
    </div>
  );
}
