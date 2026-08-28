"use client";

import { useState, useEffect } from "react";
import React from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-collapse sidebar on mobile, keep open on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Handles its own mobile visibility */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      {/* Floating Menu Button (visible when sidebar is closed) */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        className={cn(
          "fixed top-4 left-4 z-[60] bg-white text-black shadow-md border-zinc-200 transition-all duration-300 hover:bg-zinc-100",
          sidebarOpen ? "opacity-0 invisible" : "opacity-100 visible"
        )}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 w-full",
          sidebarOpen ? "md:ml-56" : "ml-0"
        )}
      >

        {/* Page Content */}
        <main className="flex-1 p-4 pt-16 md:pt-6 md:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
