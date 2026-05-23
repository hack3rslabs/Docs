import { Card } from "@/components/ui/card";

const ActivitySection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 bg-white shadow-card border-0">
        <h3 className="text-lg font-semibold text-foreground mb-4">Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <span className="text-sm text-muted-foreground">New user registration completed</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Database backup completed successfully</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-zinc-300 rounded-full"></div>
            <span className="text-sm text-muted-foreground">System maintenance scheduled</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-zinc-200 rounded-full"></div>
            <span className="text-sm text-muted-foreground">New feature deployment completed</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white shadow-card border border-zinc-100">
        <h3 className="text-lg font-semibold text-black mb-4">Lead Target</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Monthly Target</span>
            <span className="text-sm font-semibold">85%</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2">
            <div className="bg-black h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Weekly Target</span>
            <span className="text-sm font-semibold">92%</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2">
            <div className="bg-zinc-500 h-2 rounded-full" style={{ width: '92%' }}></div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ActivitySection;