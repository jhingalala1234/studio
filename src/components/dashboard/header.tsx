'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Search } from 'lucide-react';
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
  const userInitials = user.name.split(' ').map((n) => n[0]).join('');
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 flex flex-col items-center border-b border-white/10 bg-black/50 backdrop-blur-lg">
      
       {/* Top Row: Logo and Navigation */}
      <div className="w-full border-b border-white/10 px-4 md:px-6">
        <div className="relative flex h-16 items-center justify-center">
            {/* Mobile Nav Trigger (Left) */}
            <div className="md:hidden absolute left-0">
            <Sheet>
                <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-background/95">
                <nav className="grid gap-6 text-lg font-medium">
                    <Link
                    href="/dashboard"
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
                        pathname === href
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                    >
                        {label}
                    </Link>
                    ))}
                </nav>
                </SheetContent>
            </Sheet>
            </div>
            
            {/* Centered Logo */}
            <div className="absolute left-1/2 -translate-x-1/2">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <Logo />
                </Link>
            </div>
        </div>
      </div>
      
       {/* Second Row: Navigation Links */}
      <nav className="flex w-full items-center justify-center border-b border-white/10 px-4 py-2 md:px-6">
          {/* Desktop Navigation Links (Centered) */}
          <div className="hidden items-center justify-center gap-6 md:flex">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative rounded-md px-3 py-1 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-white/10 hover:text-white',
                  pathname === href && 'text-white'
                )}
              >
                {label}
                {pathname === href && (
                  <span className="absolute inset-x-1 -bottom-2 h-0.5 rounded-full bg-primary transition-all"></span>
                )}
              </Link>
            ))}
          </div>
      </nav>

      {/* Bottom Row: Welcome & Actions */}
      <div className="w-full max-w-7xl px-4 py-3 md:px-6">
        <div className="flex items-center justify-between">
          {/* Welcome Message (Left) */}
          <div className="flex flex-col">
              <h1 className="font-headline text-2xl font-bold md:text-3xl text-white">
                Welcome back, {user?.name.split(' ')[0]}!
              </h1>
              <p className="text-md text-muted-foreground">You are the {user?.role} at CloudX.</p>
          </div>

          {/* Right-aligned Actions */}
          <div className="flex items-center justify-end gap-2">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-lg bg-background/80 pl-8 md:w-[200px] lg:w-[250px]"
                />
              </div>
            </form>

            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Toggle notifications</span>
            </Button>

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
          </div>
        </div>
      </div>

    </header>
  );
}
