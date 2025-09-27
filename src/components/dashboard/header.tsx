'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Home,
  ListTodo,
  FileClock,
  Menu,
  Search,
  BotMessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { logout } from '@/app/actions';
import { Logo } from '@/components/logo';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/tasks', label: 'Tasks' },
  { href: '/dashboard/logs', label: 'Logs' },
];

export function Header({ user }: { user: User }) {
  const userInitials = user.name.split(' ').map(n => n[0]).join('');
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-lg md:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <Logo />
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'transition-colors hover:text-foreground',
              pathname === href ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks, users..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-transparent"
            />
          </div>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>New task assigned: "Deploy to Production"</DropdownMenuItem>
            <DropdownMenuItem>Team member completed a task.</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout}>
              <button type="submit" className="w-full text-left">
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Logo />
              </Link>
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'transition-colors hover:text-foreground',
                     pathname === href ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
