import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchHolidays } from "@/lib/api";
import { toast } from "sonner";

type HolidayType = "Company" | "Celebration" | "Event";

type HolidayEntry = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  type: HolidayType;
  highlight: string;
};

type Holiday = {
  _id?: string;
  name?: string;
  date?: string;
  category?: string;
  [key: string]: unknown;
};

const categories: Array<HolidayType | "All"> = ["All", "Company", "Event", "Celebration"];

const Holidays = () => {
  const [selectedCategory, setSelectedCategory] = useState<HolidayType | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");
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

  const holidayEntries: HolidayEntry[] = useMemo(() => {
    return holidays
      .filter((holiday) => holiday && holiday.name && holiday.date)
      .map((holiday) => {
        const holidayType = holiday.type || "";
        let type: HolidayType = "Celebration";
        let highlight = "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200";

        if (holidayType.includes("Public") || holidayType === "Company" || holidayType.includes("Holiday")) {
          type = "Company";
          highlight = "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200";
        } else if (holidayType === "Event" || holidayType.includes("Event")) {
          type = "Event";
          highlight = "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200";
        } else if (holidayType.includes("Birthday") || holidayType.includes("Celebration")) {
          type = "Celebration";
          highlight = "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-200";
        }

        return {
          id: holiday._id || holiday.id || Math.random().toString(),
          title: holiday.name,
          dateLabel: formatDateLabel(holiday.date),
          timeLabel: "All Day",
          type,
          highlight,
        };
      })
      .sort((a, b) => {
        // Sort by date (upcoming first)
        const dateA = new Date(holidays.find((h) => h._id === a.id || h.id === a.id)?.date || 0);
        const dateB = new Date(holidays.find((h) => h._id === b.id || h.id === b.id)?.date || 0);
        return dateA.getTime() - dateB.getTime();
      });
  }, [holidays]);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return holidayEntries.filter((entry) => {
      const matchesCategory = selectedCategory === "All" || entry.type === selectedCategory;
      const matchesSearch =
        !term ||
        entry.title.toLowerCase().includes(term) ||
        entry.dateLabel.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm, holidayEntries]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <p className="text-muted-foreground">Loading holidays...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Holidays & Celebrations</h1>
            <p className="text-sm text-muted-foreground">
              Company-wide events, key celebrations, and upcoming meetings curated for you.
            </p>
          </div>
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or date..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition",
              selectedCategory === category
                ? "border-primary bg-primary text-primary-foreground shadow"
                : "border-border bg-background hover:border-primary/40 hover:text-primary"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Upcoming Schedule</CardTitle>
          <CardDescription>
            Stay informed about what&apos;s happening across the organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[520px] pr-4">
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-sm transition hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{entry.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{entry.timeLabel}</p>
                    </div>
                    <Badge className={entry.highlight}>{entry.type}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{entry.dateLabel}</span>
                    <button className="flex items-center gap-1 text-primary text-xs font-medium hover:underline">
                      <Sparkles className="h-3.5 w-3.5" />
                      Save to calendar
                    </button>
                  </div>
                </div>
              ))}
              {filteredEntries.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 py-16">
                  <CalendarDays className="h-10 w-10 text-muted-foreground/70" />
                  <p className="font-medium text-foreground">No events found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter settings.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Holidays;
