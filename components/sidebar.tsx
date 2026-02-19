"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  Trophy,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarProps {
  role: "admin" | "athlete";
  userName: string;
  userEmail: string;
}

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/admin/athletes", label: "Sporcular", icon: UserCheck },
  { href: "/admin/tournament-registrations", label: "Turnuva Başvuruları", icon: Trophy },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users },
];

const athleteNavItems: NavItem[] = [
  { href: "/athlete", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/athlete/profile", label: "Profilim", icon: Settings },
  { href: "/athlete/tournament", label: "Turnuva Başvurusu", icon: ClipboardList },
];

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "admin" ? adminNavItems : athleteNavItems;

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Trophy className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground leading-none">MasaTenisi</span>
          <span className="text-xs text-muted-foreground mt-0.5">Kayıt Sistemi</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            role === "admin"
              ? "bg-primary/20 text-primary"
              : "bg-green-500/20 text-green-400"
          )}
        >
          {role === "admin" ? "Yönetici" : "Sporcu"}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin" || item.href === "/athlete"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="h-3 w-3 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {userName}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {userEmail}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
