import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  CalendarCheck,
  Clock3,
  Home,
  Laptop,
  Laptop2,
  MapPin,
  PhoneCall,
  Search,
} from "lucide-react";

type RemoteDay = {
  id: string;
  date: string;
  day: string;
  hours: string;
  purpose: string;
  status: "Approved" | "Pending";
};

const remoteSchedule: RemoteDay[] = [
  {
    id: "WFH-1042",
    date: "Sep 16, 2025",
    day: "Tuesday",
    hours: "9:30 AM – 6:00 PM",
    purpose: "Client calls with APAC teams",
    status: "Approved",
  },
  {
    id: "WFH-1043",
    date: "Sep 20, 2025",
    day: "Friday",
    hours: "10:00 AM – 6:00 PM",
    purpose: "Deep work for Q4 planning",
    status: "Pending",
  },
  {
    id: "WFH-1028",
    date: "Aug 28, 2025",
    day: "Thursday",
    hours: "9:00 AM – 5:30 PM",
    purpose: "Recuperating post vaccination",
    status: "Approved",
  },
] as const;

const summaryCards = [
  {
    id: "allowance",
    title: "Monthly allowance",
    value: "4 of 8 days used",
    helper: "Hybrid policy resets on Oct 1",
    icon: Home,
    progress: 50,
  },
  {
    id: "upcoming",
    title: "Next remote day",
    value: "Sep 16, 2025",
    helper: "Client sync from home",
    icon: CalendarCheck,
  },
  {
    id: "compliance",
    title: "Equipment check",
    value: "VPN & headset ready",
    helper: "Last verified · 3 days ago",
    icon: Laptop,
  },
] as const;

const statusVariant: Record<RemoteDay["status"], "default" | "secondary"> = {
  Approved: "default",
  Pending: "secondary",
};

const WorkFromHome = () => {
  const [search, setSearch] = useState("");

  const filteredSchedule = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return remoteSchedule;
    }
    return remoteSchedule.filter((item) =>
      [item.id, item.date, item.day, item.purpose, item.status]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Work From Home</h2>
          <p className="text-sm text-muted-foreground">
            Plan remote days, track approvals, and stay compliant with hybrid work policies.
          </p>
        </div>
        <Button className="gap-2">
          <Laptop2 className="h-4 w-4" />
          Request remote day
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.id} className="border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <card.icon className="h-5 w-5" />
                </div>
                {card.progress !== undefined ? (
                  <span className="text-xs font-medium text-muted-foreground">
                    {card.progress}% used
                  </span>
                ) : null}
              </div>
              <CardTitle className="text-base mt-4">{card.title}</CardTitle>
              <CardDescription>{card.helper}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <span className="text-lg font-semibold text-foreground">{card.value}</span>
              {card.progress !== undefined ? <Progress value={card.progress} /> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Remote schedule</CardTitle>
            <CardDescription>Upcoming work-from-home days and their approval status.</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search schedule..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {filteredSchedule.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/70 p-4 transition hover:border-primary/60 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-xs uppercase text-muted-foreground tracking-wide">{item.id}</p>
                <h3 className="text-lg font-semibold text-foreground">{item.date}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.day} · {item.hours}
                </p>
                <p className="text-sm text-muted-foreground">{item.purpose}</p>
              </div>
              <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
                <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <PhoneCall className="h-4 w-4" />
                  <span>Notify manager</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Home office · Bengaluru</span>
                </div>
              </div>
            </div>
          ))}
          {filteredSchedule.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No remote days matched your search query.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Hybrid policy tips</CardTitle>
          <CardDescription>Quick reminders to keep your remote work compliant.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <TipTile
            title="Daily stand-up"
            description="Join the 9:45 AM check-in when working remotely."
          />
          <TipTile
            title="Status updates"
            description="Log your end-of-day summary on Microsoft Teams."
          />
          <TipTile
            title="Seat booking"
            description="Reserve office desks two days in advance when coming onsite."
          />
        </CardContent>
      </Card>
    </div>
  );
};

const TipTile = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-xl border border-border/70 bg-background/70 p-4">
    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
  </div>
);

export default WorkFromHome;
