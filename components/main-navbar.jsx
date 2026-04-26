"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/reports", label: "Reports", icon: FileText },
];

export default function MainNavbar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-1.5 rounded-2xl border px-1.5 py-1.5 bg-white/40 shadow-sm transition-all duration-300 hover:bg-white/60"
      style={{ borderColor: "rgba(221, 228, 229, 0.6)" }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 relative group overflow-hidden",
              isActive ? "text-white shadow-md" : "hover:bg-slate-100/80"
            )}
            style={
              isActive
                ? {
                    background:
                      "linear-gradient(to bottom right, #32484F, #233A41)",
                  }
                : { color: "#32484F" }
            }
          >
            <span className="relative z-10">{item.label}</span>
            {isActive && (
               <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50"></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
