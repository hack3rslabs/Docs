"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { jwtDecode } from "jwt-decode";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hasSubmenu?: boolean;
  submenu?: { title: string; href: string }[];
}

const menuItems: MenuItem[] = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
    hasSubmenu: true,
    submenu: [{ title: "Dashboard", href: "/dashboard" }],
  },
  { title: "Leads", href: "/leads", icon: Users },
  { title: "Employee", href: "/employee", icon: Users },
  { title: "Settings", href: "/settings", icon: Settings },
];

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Check session (token validity)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return setIsLoggedIn(false);

    try {
      const decoded: any = jwtDecode(token);
      const expired = decoded.exp * 1000 < Date.now();
      setIsLoggedIn(!expired);
      if (expired) localStorage.removeItem("token");
    } catch {
      setIsLoggedIn(false);
      localStorage.removeItem("token");
    }
  }, []);

  // ✅ Toggle submenu open/close
  const toggleSubmenu = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!isLoggedIn) return null; // Hide sidebar if not logged in

  return (
    <>
      {/* Overlay (for mobile) */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={onToggle}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-black z-30 w-64 transform transition-transform duration-300 md:translate-x-0 border-r border-white/10",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="p-4 space-y-2 mt-16 md:mt-0">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const isExpanded = expandedItems.includes(item.title);
            const hasActiveSubmenu = item.submenu?.some(
              (sub) => pathname === sub.href
            );

            return (
              <div key={item.title}>
                <div className="relative">
                  {/* Menu item with submenu */}
                  {item.hasSubmenu ? (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-dashboard-sidebar-text hover:bg-dashboard-sidebar-hover hover:text-white transition-smooth",
                        (isActive || hasActiveSubmenu) &&
                          "bg-dashboard-sidebar-active text-white"
                      )}
                      onClick={() => toggleSubmenu(item.title)}
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  ) : (
                    <Link href={item.href} onClick={onToggle}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-zinc-400 hover:bg-zinc-900 hover:text-white transition-smooth",
                          isActive && "bg-white text-black hover:bg-white hover:text-black"
                        )}
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.title}
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Submenu section */}
                {item.hasSubmenu && isExpanded && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.submenu?.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={onToggle}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start text-dashboard-sidebar-secondary hover:bg-dashboard-sidebar-hover hover:text-white transition-smooth",
                              isSubActive &&
                                "bg-dashboard-sidebar-active text-white"
                            )}
                          >
                            <div className="w-2 h-2 rounded-full bg-current mr-3 opacity-50" />
                            {subItem.title}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* 🔴 Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-dashboard-sidebar-text hover:bg-red-600 hover:text-white mt-6 transition-all"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </Button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
