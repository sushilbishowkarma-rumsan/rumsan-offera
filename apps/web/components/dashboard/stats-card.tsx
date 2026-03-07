import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  className?: string;
}

export function StatsCard({ title, value, description, icon, className }: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0 ml-4">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
