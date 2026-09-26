"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    if (!hasSupabaseConfig()) {
      router.replace("/login");
      return;
    }
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label="Log out" title="Log out" disabled={isLoading} onClick={handleLogout}>
      <LogOut className="size-4" />
    </Button>
  );
}
