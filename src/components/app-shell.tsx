"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Boxes,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Settings,
  SlidersHorizontal,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/client";

const primaryNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
];

const operationsNavigation = [
  { label: "Receipts", href: "/operations/receipts", icon: ArrowDownToLine },
  { label: "Deliveries", href: "/operations/deliveries", icon: ArrowUpFromLine },
  { label: "Transfers", href: "/operations/transfers", icon: ArrowLeftRight },
  { label: "Adjustments", href: "/operations/adjustments", icon: SlidersHorizontal },
];

const secondaryNavigation = [
  { label: "Move History", href: "/move-history", icon: ClipboardList },
  { label: "Warehouses", href: "/warehouses", icon: Warehouse },
  { label: "Locations", href: "/locations", icon: MapPin },
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavItem({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      )}
    >
      <Icon className={cn("size-4.5", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} strokeWidth={1.8} />
      {label}
    </Link>
  );
}

function Navigation({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav className="space-y-1">
      {primaryNavigation.map((item) => (
        <NavItem key={item.href} {...item} onNavigate={onNavigate} />
      ))}
      <div className="pt-5">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Operations</p>
        {operationsNavigation.map((item) => (
          <NavItem key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="pt-5">
        {secondaryNavigation.map((item) => (
          <NavItem key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const [profileName, setProfileName] = useState("Account owner");

  useEffect(() => {
    let mounted = true;
    void createClient().auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const name = typeof data.user?.user_metadata?.name === "string" && data.user.user_metadata.name.trim() ? data.user.user_metadata.name : data.user?.email?.split("@")[0] ?? "Account owner";
      setProfileName(name);
    });
    const handleNameUpdate = (event: Event) => { const name = (event as CustomEvent<string>).detail; if (name) setProfileName(name); };
    window.addEventListener("stocksense-profile-name-updated", handleNameUpdate);
    return () => { mounted = false; window.removeEventListener("stocksense-profile-name-updated", handleNameUpdate); };
  }, []);

  const initials = profileName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-19 items-center justify-between border-b border-slate-100 px-5">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Boxes className="size-5" strokeWidth={2.2} />
          </span>
          <span>
            <span className="block text-[17px] font-bold tracking-tight text-slate-950">StockSense</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Inventory OS</span>
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <Navigation onNavigate={onNavigate} />
      </div>
      <div className="border-t border-slate-100 p-3">
        <div className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-slate-50">
          <Link href="/profile" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">{initials}</span>
            <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-800">{profileName}</span>
            <span className="block truncate text-xs text-slate-400">Operations manager</span>
            </span>
          </Link>
          <ChevronDown className="size-4 text-slate-400" />
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();

  if (["/login", "/signup", "/forgot-password"].includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell flex min-h-screen bg-[#f7f9f8] text-slate-950">
      <div className="app-shell-sidebar hidden lg:block">
        <Sidebar onNavigate={() => setIsMobileNavOpen(false)} />
      </div>
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setIsMobileNavOpen(false)} />
      )}
      <div className={cn("app-shell-sidebar fixed inset-y-0 left-0 z-50 transition-transform lg:hidden", isMobileNavOpen ? "translate-x-0" : "-translate-x-full")}>
        <Sidebar onNavigate={() => setIsMobileNavOpen(false)} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-shell-header flex h-19 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setIsMobileNavOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-400">Workspace</p>
              <p className="text-sm font-semibold text-slate-800">Main warehouse network</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">System operational</span>
            <Button variant="ghost" size="icon" aria-label="Close navigation" className="lg:hidden" onClick={() => setIsMobileNavOpen(false)}>
              <X className="size-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
