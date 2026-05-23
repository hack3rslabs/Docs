"use client";

import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatsGrid from "@/components/dashboard/StatsGrid";
import ActivitySection from "@/components/dashboard/ActivitySection";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <WelcomeCard />
      <StatsGrid />
      <ActivitySection />
    </div>
  );
};

export default Dashboard;