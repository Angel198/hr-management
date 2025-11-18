import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, RefreshCw, CalendarDays, Sparkles, Users, ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EmployeeHoliday, EmployeeHolidayCategory } from "@/data/employee-holidays";
import { HolidayCard } from "@/components/employee/HolidayCard";
import { fetchHolidays } from "@/lib/api";
import { toast } from "sonner";

type Holiday = {
  _id?: string;
  name?: string;
  date?: string;
  category?: string;
  [key: string]: unknown;
};

const FILTERS: Array<EmployeeHolidayCategory | "All"> = ["All", "Company", "Event", "Birthday"];

export default function EmployeeHolidays() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<EmployeeHolidayCategory | "All">("All");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHolidays = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching holidays from API...");
        const data = await fetchHolidays();
        console.log("Holidays data received:", data);
        if (Array.isArray(data)) {
          setHolidays(data);
          console.log(`Successfully loaded ${data.length} holidays`);
        } else {
          setHolidays([]);
          console.warn("Invalid holidays data format:", data);
        }
      } catch (err) {
        console.error("Error loading holidays:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load holidays";
        if (errorMessage.includes("Network error") || errorMessage.includes("fetch") || errorMessage.includes("connect")) {
          toast.error("Cannot connect to server. Please ensure the backend server is running on port 5050.");
        } else {
          toast.error(`Failed to load holidays: ${errorMessage}`);
        }
        setHolidays([]);
      } finally {
        setIsLoading(false);
      }
    };
    void loadHolidays();
  }, []);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return "Today";
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const formatTimeLabel = () => {
    // Holidays are typically all-day events
    return "All Day";
  };

  const getCategoryAndIcon = (type: string): { category: EmployeeHolidayCategory; icon: LucideIcon; gradient: string } => {
    const typeLower = (type || "").toLowerCase();
    
    if (typeLower.includes("birthday") || typeLower.includes("celebration")) {
      return {
        category: "Birthday",
        icon: Sparkles,
        gradient: "from-purple-100 via-purple-50 to-transparent dark:from-purple-900/30 dark:via-purple-900/10",
      };
    } else if (typeLower.includes("event")) {
      return {
        category: "Event",
        icon: CalendarDays,
        gradient: "from-indigo-100 via-indigo-50 to-transparent dark:from-indigo-900/30 dark:via-indigo-900/10",
      };
    } else {
      // Default to Company
      return {
        category: "Company",
        icon: Users,
        gradient: "from-primary/15 via-primary/10 to-transparent",
      };
    }
  };

  const transformedHolidays: EmployeeHoliday[] = useMemo(() => {
    return holidays
      .filter((holiday) => holiday && holiday.name && holiday.date)
      .map((holiday) => {
        const { category, icon, gradient } = getCategoryAndIcon(holiday.type || "");
        
        return {
          id: holiday._id || holiday.id || Math.random().toString(),
          title: holiday.name,
          dateLabel: formatDateLabel(holiday.date),
          timeLabel: formatTimeLabel(),
          icon,
          category,
          gradient,
        };
      })
      .sort((a, b) => {
        // Sort by date (upcoming first)
        const holidayA = holidays.find((h) => h._id === a.id || h.id === a.id);
        const holidayB = holidays.find((h) => h._id === b.id || h.id === b.id);
        const dateA = new Date(holidayA?.date || 0);
        const dateB = new Date(holidayB?.date || 0);
        return dateA.getTime() - dateB.getTime();
      });
  }, [holidays]);

  const filteredHolidays = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return transformedHolidays.filter((holiday) => {
      const matchesFilter = activeFilter === "All" || holiday.category === activeFilter;
      const matchesTerm =
        !term ||
        holiday.title.toLowerCase().includes(term) ||
        holiday.dateLabel.toLowerCase().includes(term) ||
        holiday.timeLabel.toLowerCase().includes(term);
      return matchesFilter && matchesTerm;
    });
  }, [searchTerm, activeFilter, transformedHolidays]);

  const handleReset = () => {
    setActiveFilter("All");
    setSearchTerm("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">Holidays & Celebrations</h2>
          <p className="text-muted-foreground">
            Company happenings, birthdays, and milestones to keep on your radar.
          </p>
        </div>
        <p className="text-muted-foreground">Loading holidays...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Holidays & Celebrations</h2>
        <p className="text-muted-foreground">
          Company happenings, birthdays, and milestones to keep on your radar.
        </p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Upcoming calendar</CardTitle>
            <CardDescription>Stay informed with events from across the company.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
            <div className="relative lg:w-64">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-border/70 bg-background px-1 py-1 text-xs">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-3 py-1 transition ${
                    activeFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredHolidays.map((holiday) => (
              <HolidayCard key={holiday.id} holiday={holiday} />
            ))}
          </div>
          {filteredHolidays.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/70" />
              <div>
                <p className="font-medium text-foreground">No events found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || activeFilter !== "All"
                    ? "Try a different keyword or switch back to the \"All\" filter."
                    : "No holidays available at the moment."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


