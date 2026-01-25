"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";

export function DashboardHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ role: string } | null>(null);
  const isAdminPage = pathname.startsWith("/admin");

  useEffect(() => {
    if (!isAdminPage) {
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((data) => setUser(data.user));
    }
  }, [isAdminPage]);

  // Don't show navigation on admin pages
  if (isAdminPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                A
              </span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none">Alogza</h1>
              <p className="text-xs text-muted-foreground">
                2026 Plan Dashboard
              </p>
            </div>
          </div>
        </div>
        <DashboardNav />
      </div>
    </header>
  );
}
