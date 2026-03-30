"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dumbbell, LayoutDashboard, ClipboardList, TrendingUp,
  User, BookOpen, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { InstagramIcon } from "@/components/icons";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Resumen" },
  { href: "/dashboard/plan", icon: ClipboardList, label: "Mi Plan" },
  { href: "/dashboard/progreso", icon: TrendingUp, label: "Progreso" },
  { href: "/dashboard/ejercicios", icon: BookOpen, label: "Ejercicios" },
  { href: "/dashboard/perfil", icon: User, label: "Perfil" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR Desktop */}
      <aside className="hidden md:flex w-64 glass-card border-r border-card-border flex-col fixed h-screen">
        <div className="p-6 border-b border-card-border">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <div>
              <p className="font-bold text-sm leading-tight">PABLO SCARLATTO</p>
              <p className="text-xs text-muted">ENTRENAMIENTOS</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-card-border space-y-2">
          <a
            href="https://instagram.com/pabloscarlattoentrenamientos"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <InstagramIcon className="h-5 w-5" />
            Instagram
          </a>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-danger hover:bg-danger/5 w-full transition-all">
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed top-0 w-full z-50 glass-card border-b border-card-border">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">PS ENTRENAMIENTOS</span>
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="p-4 space-y-1 border-t border-card-border bg-background">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* MAIN */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
