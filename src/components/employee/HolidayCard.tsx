import { memo } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EmployeeHoliday } from "@/data/employee-holidays";

type HolidayCardProps = {
  holiday: EmployeeHoliday;
  onViewDetails?: (holiday: EmployeeHoliday) => void;
  onQuickAction?: (holiday: EmployeeHoliday) => void;
};

export const HolidayCard = memo(({ holiday, onViewDetails, onQuickAction }: HolidayCardProps) => {
  const handleViewDetails = () => {
    onViewDetails?.(holiday);
  };

  const handleQuickAction = () => {
    onQuickAction?.(holiday);
  };

  const Icon = holiday.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/60 shadow-sm transition hover:shadow-md">
      <div className={`absolute inset-0 bg-gradient-to-r ${holiday.gradient}`} />
      <div className="relative flex h-full flex-col gap-6 p-6">
        <div className="flex items-start justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" />
            {holiday.category}
          </span>
          <Badge variant="secondary">{holiday.dateLabel}</Badge>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{holiday.title}</h3>
          <p className="text-sm text-muted-foreground mt-2">{holiday.timeLabel}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" className="w-full" onClick={handleViewDetails}>
            View details
          </Button>
          <Button variant="ghost" size="icon" onClick={handleQuickAction}>
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

HolidayCard.displayName = "HolidayCard";


