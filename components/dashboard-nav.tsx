"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderKanban,
  AlertTriangle,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  {
    title: "Overview",
    href: "/",
    icon: BarChart3,
    roles: ["admin", "developer", "general"],
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    roles: ["admin", "developer", "general"],
  },
  {
    title: "Risks",
    href: "/risks",
    icon: AlertTriangle,
    roles: ["admin", "developer", "general"],
  },
  {
    title: "Admin",
    href: "/admin",
    icon: Settings,
    roles: ["admin"],
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<{ role: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Clear notification flag so it shows again on next login
      sessionStorage.removeItem("urgentRisksNotificationShown");
      toast({ title: "Logged out successfully" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    const allowedRoles = item.roles || [];
    return allowedRoles.includes(user.role);
  });

  // Show loading state or empty nav if no user
  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <nav className="flex items-center space-x-1">
          <div className="px-4 py-2 text-sm text-muted-foreground">
            Loading...
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <nav className="flex items-center space-x-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="flex items-center gap-2 pl-4 border-l">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
