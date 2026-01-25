"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RiskAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    // Refresh risks every 5 minutes to check for new task deadlines
    const interval = setInterval(async () => {
      try {
        await fetch("/api/risks/auto-generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        // Refresh the page to show updated risks
        router.refresh();
      } catch (error) {
        console.error("Failed to auto-refresh risks:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [router]);

  return null;
}

