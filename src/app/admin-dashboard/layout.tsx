"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Building,
  User,
  FileText,
  LogOut,
  Settings
} from "lucide-react";
import { TITLES, BUTTONS } from "@/constants/text";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
        return;
      }

      const role = profile?.role?.name || user?.user_metadata?.type;
      if (role !== "admin") {
        router.push("/");
      }
    }
  }, [user, profile, loading, router]);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        Loading...
      </div>
    );
  }

  if (
    !user ||
    (profile?.role?.name !== "admin" && user?.user_metadata?.type !== "admin")
  ) {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    {
      href: "/admin-dashboard/overview",
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "Overview"
    },
    {
      href: "/admin-dashboard/users",
      icon: <Users className="w-5 h-5" />,
      label: "Users"
    },
    {
      href: "/admin-dashboard/companies",
      icon: <Building className="w-5 h-5" />,
      label: "Companies"
    },
    {
      href: "/admin-dashboard/candidates",
      icon: <User className="w-5 h-5" />,
      label: "Candidates"
    },
    {
      href: "/admin-dashboard/interviews",
      icon: <FileText className="w-5 h-5" />,
      label: "Interviews"
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-700 bg-slate-900/50 backdrop-blur-xl hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {TITLES.ADMIN_PANEL}
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            {BUTTONS.LOGOUT}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-slate-700 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10 md:hidden">
          <span className="font-bold text-lg">{TITLES.ADMIN_PANEL}</span>
          {/* Mobile menu could go here */}
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
