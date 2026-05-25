"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Database, Zap } from "lucide-react";

const ActivitySection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-8 bg-white shadow-sm border border-zinc-100 rounded-2xl">
        <h3 className="text-lg font-black text-zinc-900 mb-6 uppercase tracking-tight flex items-center gap-2">
          🚀 System Status
        </h3>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Security Active</p>
              <p className="text-[11px] text-zinc-500 font-medium">Bcrypt hashing and JWT authorization are fully operational.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Database Ready</p>
              <p className="text-[11px] text-zinc-500 font-medium">Production SQLite environment synced with latest Prisma schema.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Automation Engine</p>
              <p className="text-[11px] text-zinc-500 font-medium">PDFKit generator is primed for all 10 corporate document types.</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 bg-white shadow-sm border border-zinc-100 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
        
        <h3 className="text-lg font-black text-zinc-900 mb-6 uppercase tracking-tight">
          📈 Production Overview
        </h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">MNC Compliance</span>
              <span className="text-sm font-black text-blue-600">100%</span>
            </div>
            <div className="w-full bg-zinc-50 rounded-full h-2 border border-zinc-100">
              <div className="bg-blue-600 h-2 rounded-full shadow-sm" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">System Integrity</span>
              <span className="text-sm font-black text-green-600">Stable</span>
            </div>
            <div className="w-full bg-zinc-50 rounded-full h-2 border border-zinc-100">
              <div className="bg-green-600 h-2 rounded-full shadow-sm" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-50">
            <div className="flex items-center gap-2 text-zinc-500 italic text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Your system is cleared and ready for real employee data.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ActivitySection;
