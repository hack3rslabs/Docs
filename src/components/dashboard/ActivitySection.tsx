"use client";

import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { UserPlus, Briefcase, Activity } from "lucide-react";

const ActivitySection = () => {
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-64 bg-zinc-100 rounded-2xl"></div>
        <div className="h-64 bg-zinc-100 rounded-2xl"></div>
      </div>
    );
  }

  const activities = stats?.activities || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-8 bg-white shadow-sm border border-zinc-100 rounded-2xl">
        <h3 className="text-lg font-black text-zinc-900 mb-6 uppercase tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Recent Activity
        </h3>
        {activities.length > 0 ? (
          <div className="space-y-6">
            {activities.map((activity: any, index: number) => (
              <div key={index} className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${activity.type === 'employee' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  {activity.type === 'employee' ? <Briefcase className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    {activity.type === 'employee' ? 'New Employee Enrolled' : 'New Lead Captured'}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    {activity.name} {activity.type === 'employee' && activity.jobType ? `(${activity.jobType})` : ''} - {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No recent activity.</p>
        )}
      </Card>

      <Card className="p-8 bg-white shadow-sm border border-zinc-100 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
        
        <h3 className="text-lg font-black text-zinc-900 mb-6 uppercase tracking-tight">
          📈 Production Overview
        </h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Conversion Rate</span>
              <span className="text-sm font-black text-blue-600">{stats?.conversionRate || 0}%</span>
            </div>
            <div className="w-full bg-zinc-50 rounded-full h-2 border border-zinc-100">
              <div className="bg-blue-600 h-2 rounded-full shadow-sm transition-all" style={{ width: `${stats?.conversionRate || 0}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Employees Enrolled</span>
              <span className="text-sm font-black text-green-600">{stats?.totalEmployees || 0}</span>
            </div>
            <div className="w-full bg-zinc-50 rounded-full h-2 border border-zinc-100">
              <div className="bg-green-600 h-2 rounded-full shadow-sm" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-50">
            <div className="flex items-center gap-2 text-zinc-500 italic text-[11px]">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Real-time production data from your application.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ActivitySection;
