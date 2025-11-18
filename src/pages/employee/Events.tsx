import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CalendarClock, MapPin, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchEvents } from "@/lib/api";
import { toast } from "sonner";

type Event = {
  _id?: string;
  name?: string;
  date?: string;
  location?: string;
  status?: string;
  description?: string;
  [key: string]: unknown;
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("upcoming");

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching events from API...");
        const data = await fetchEvents();
        console.log("Events data received:", data);
        if (Array.isArray(data)) {
          setEvents(data);
          console.log(`Successfully loaded ${data.length} events`);
        } else {
          setEvents([]);
          console.warn("Invalid events data format:", data);
        }
      } catch (err) {
        console.error("Error loading events:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load events";
        if (errorMessage.includes("Network error") || errorMessage.includes("fetch") || errorMessage.includes("connect")) {
          toast.error("Cannot connect to server. Please ensure the backend server is running on port 5050.");
        } else {
          toast.error(`Failed to load events: ${errorMessage}`);
        }
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    void loadEvents();
  }, []);

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return "Date TBD";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDateOnly = new Date(date);
    eventDateOnly.setHours(0, 0, 0, 0);
    
    let dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (eventDateOnly.getTime() === today.getTime()) {
      dateLabel = "Today";
    } else if (eventDateOnly.getTime() === today.getTime() + 86400000) {
      dateLabel = "Tomorrow";
    }
    
    return dateLabel + " · " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const filteredEvents = useMemo(() => {
    let filtered = events.filter((e) => e && e.name && e.date);

    // Filter by date (upcoming/past/all)
    if (dateFilter === "upcoming") {
      filtered = filtered.filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate >= new Date() && e.status !== "completed";
      });
    } else if (dateFilter === "past") {
      filtered = filtered.filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate < new Date() || e.status === "completed";
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((e) => {
        const name = (e.name || "").toLowerCase();
        const location = (e.location || "").toLowerCase();
        const description = (e.description || "").toLowerCase();
        const dateStr = formatEventDate(e.date).toLowerCase();
        return name.includes(term) || location.includes(term) || description.includes(term) || dateStr.includes(term);
      });
    }

    // Sort by date (upcoming first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [events, dateFilter, statusFilter, searchTerm]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(events.map((e) => e.status).filter(Boolean));
    return Array.from(statuses);
  }, [events]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Events & Learning</h1>
            <p className="text-sm text-muted-foreground">
              Discover upcoming sessions curated for your growth and collaboration.
            </p>
          </div>
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-4 items-center">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {uniqueStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Events & Sessions</CardTitle>
          <CardDescription>
            {dateFilter === "upcoming" 
              ? "Upcoming sessions aligned to your team's priorities."
              : dateFilter === "past"
              ? "Past events and completed sessions."
              : "All events and sessions."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 py-16">
              <CalendarClock className="h-10 w-10 text-muted-foreground/70" />
              <p className="font-medium text-foreground">No events found</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your search or filter settings."
                  : "No events available at the moment."}
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event._id} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-foreground">{event.name}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        {formatEventDate(event.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {event.location}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <Badge
                      variant={
                        event.status === "upcoming"
                          ? "default"
                          : event.status === "ongoing"
                            ? "secondary"
                            : event.status === "completed"
                            ? "outline"
                            : "default"
                      }
                    >
                      {event.status || "Scheduled"}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Add to calendar
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardHeader>
          <CardTitle>Suggest an Event</CardTitle>
          <CardDescription>
            Have an idea for a workshop or team engagement? Let the People Operations team know.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Separator />
          <Button variant="default" className="self-start">
            Submit your idea
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Events;
