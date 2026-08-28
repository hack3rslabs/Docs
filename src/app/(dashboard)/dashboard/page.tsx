"use client";

import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatsGrid from "@/components/dashboard/StatsGrid";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <WelcomeCard />
      <StatsGrid />
    </div>
  );
};

export default Dashboard;