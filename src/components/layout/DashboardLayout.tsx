"use client";

import { useState } from "react";
import React from "react";
import TopNavigation from "./TopNavigation";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-dashboard-bg overflow-hidden">
      {/* Top Navigation with Mobile Hamburger */}
      <div className="relative z-40">
        <TopNavigation />
        {/* Hamburger for mobile */}
        <div className="absolute left-4 top-4 md:hidden">
          <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className={`flex-1 overflow-auto transition-all duration-300 md:ml-64`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
