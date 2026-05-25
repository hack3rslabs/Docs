"use client";

import { useState } from "react";
import React from "react";
import TopNavigation from "./TopNavigation";
import Sidebar from "./Sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Handles its own mobile visibility */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300 w-full">
        {/* Top Navigation - Fixed at top of main content */}
        <div className="sticky top-0 z-[50] w-full shadow-sm">
          <TopNavigation onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
