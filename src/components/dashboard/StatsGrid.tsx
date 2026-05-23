import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  percentage: number;
  color: 'purple' | 'teal' | 'coral' | 'blue';
}

const StatCard = ({ title, value, percentage, color }: StatCardProps) => {
  const colorClasses = {
    purple: 'text-black',
    teal: 'text-black', 
    coral: 'text-black',
    blue: 'text-black',
  };

  const bgClasses = {
    purple: 'bg-black',
    teal: 'bg-black',
    coral: 'bg-black', 
    blue: 'bg-black',
  };

  // Calculate stroke-dasharray for the circle
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <Card className="p-6 bg-white shadow-card border-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
        </div>
        <div className="relative">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 80 80">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                className={colorClasses[color]}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-semibold ${colorClasses[color]}`}>
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const StatsGrid = () => {
  const stats = [
    { title: "Contact", value: "2020", percentage: 80, color: 'purple' as const },
    { title: "Deals", value: "400", percentage: 70, color: 'teal' as const },
    { title: "Campaign", value: "350", percentage: 75, color: 'coral' as const },
    { title: "Worth", value: "$6060", percentage: 85, color: 'blue' as const },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsGrid;