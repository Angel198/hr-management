import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock3, MapPin, Share2 } from "lucide-react";
import { fetchEvents } from "@/lib/api";
import { toast } from "sonner";

type Event = {
  _id?: string;
  name?: string;
  date?: string;
  location?: string;
  status?: string;
  [key: string]: unknown;
};

export default function EmployeeEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatEventTime = (dateStr: string) => {
    if (!dateStr) return "Time TBD";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Time";
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const filteredEvents = events
    .filter((event) => event && event.name && event.date)
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">Events & Communities</h2>
          <p className="text-muted-foreground">
            Explore upcoming sessions curated for learning, wellness, and celebrations.
          </p>
        </div>
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Events & Communities</h2>
        <p className="text-muted-foreground">
          Explore upcoming sessions curated for learning, wellness, and celebrations.
        </p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Upcoming highlights</CardTitle>
          <CardDescription>
            RSVP or share an invite directly with your teammates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/70" />
              <div>
                <p className="font-medium text-foreground">No events found</p>
                <p className="text-sm text-muted-foreground">
                  No events available at the moment.
                </p>
              </div>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event._id || event.id}
                className="flex flex-col gap-4 rounded-xl border border-border/70 bg-background/80 p-4 transition hover:border-primary/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{event._id || event.id}</span>
                    {event.status && (
                      <>
                        <span>•</span>
                        <span>{event.status}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{event.name}</h3>
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formatEventDate(event.date)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      {formatEventTime(event.date)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
                  {event.status && (
                    <Badge variant="outline" className="w-fit">
                      {event.status}
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-2">
                      RSVP
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}


