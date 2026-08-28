"use client";

import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface StatCardProps {
  title: string;
  value: string | number;
  percentage: number;
  color: 'purple' | 'teal' | 'coral' | 'blue';
}

const StatCard = ({ title, value, percentage, color }: StatCardProps) => {
  const colorClasses = {
    purple: 'text-blue-600',
    teal: 'text-green-600', 
    coral: 'text-orange-600',
    blue: 'text-zinc-900',
  };

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <Card className="p-6 bg-white shadow-sm border border-zinc-100 rounded-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-black text-zinc-900 mb-1">{value}</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{title}</div>
        </div>
      </div>
    </Card>
  );
};

const StatsGrid = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.stats;
    },
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-pulse">
    {[1,2,3,4].map(i => <div key={i} className="h-32 bg-zinc-100 rounded-2xl"></div>)}
  </div>;

  const displayStats = [
    { title: "Total Leads", value: stats?.totalLeads || 0, percentage: 100, color: 'purple' as const },
    { title: "Verified Leads", value: stats?.totalEmployees || 0, percentage: stats?.conversionRate || 0, color: 'teal' as const },
    { title: "Pending Leads", value: stats?.pendingToVerify || 0, percentage: 100, color: 'coral' as const },
    { title: "Total Revenue", value: `₹${(stats?.totalWorth || 0).toLocaleString('en-IN')}`, percentage: 100, color: 'blue' as const },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {displayStats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsGrid;
