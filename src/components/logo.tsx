import { Layers3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2 text-primary backdrop-blur-sm">
        <Layers3 className="h-6 w-6" />
      </div>
      <h1 className="font-headline text-2xl font-bold tracking-tight text-white">
        CloudX Central
      </h1>
    </div>
  );
}
