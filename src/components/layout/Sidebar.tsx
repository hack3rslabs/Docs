"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  X,
  BriefcaseBusiness,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { jwtDecode } from "jwt-decode";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", href: "/leads", icon: Users },
  { title: "Employees", href: "/employee", icon: BriefcaseBusiness },
  { title: "Settings", href: "/settings", icon: Settings },
];

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token");
      if (!token) return setIsLoggedIn(false);
      try {
        const decoded: any = jwtDecode(token);
        const expired = decoded.exp * 1000 < Date.now();
        setIsLoggedIn(!expired);
        if (expired) localStorage.removeItem("token");
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkToken();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-all duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={onToggle}
      />

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-[#09090b] text-white z-[70] w-56 transform transition-all duration-300 ease-in-out border-r border-zinc-800 shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-black/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-[10px] font-black italic">TW</span>
              </div>
              <span className="text-sm font-black tracking-tighter uppercase">Techwell</span>
            </div>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={onToggle}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-6 space-y-3 mt-4">
            <p className="px-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Main Menu</p>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => { if (window.innerWidth < 768) onToggle(); }}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-5 py-3 rounded-xl text-sm font-bold transition-all group",
                      isActive 
                        ? "bg-white text-black shadow-lg shadow-white/5" 
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-black" : "text-zinc-500 group-hover:text-zinc-300")} />
                    {item.title}
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer (Logout) */}
          <div className="p-4 border-t border-zinc-800 bg-black/20">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-zinc-400 hover:bg-red-600/10 hover:text-red-500 font-bold transition-all h-11"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
