import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, CheckCircle2, Clock3, Bell, ArrowUpRight, MapPin, FileText, Phone, Filter } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { HolidayCard } from "@/components/employee/HolidayCard";
import { fetchHolidays, fetchEvents, fetchLeaves, fetchAttendance, getTodayAttendance } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type QuickAction = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
};

type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  owner: string;
  status: "Confirmed" | "Awaiting" | "Reminder";
};

type HolidayEntry = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  category: "Company" | "Event" | "Birthday";
};

const actions: QuickAction[] = [
  {
    id: "attendance",
    title: "Mark Attendance",
    description: "Clock in/out, view history, and check working hours.",
    icon: Clock3,
    actionLabel: "Open attendance",
  },
  {
    id: "leave",
    title: "Apply Leave",
    description: "Submit new leave requests and track approvals.",
    icon: Calendar,
    actionLabel: "Request leave",
  },
  {
    id: "payslip",
    title: "View Payslips",
    description: "Download your monthly salary statements anytime.",
    icon: FileText,
    actionLabel: "View payslips",
  },
] as const satisfies QuickAction[];

const events: EventItem[] = [
  {
    id: "event-1",
    title: "Pulse Check with Manager",
    date: "Today · 4:30 PM",
    location: "Zoom",
    owner: "Aisha Rahman",
    status: "Confirmed",
  },
  {
    id: "event-2",
    title: "Security Compliance Refresher",
    date: "Tomorrow · 10:00 AM",
    location: "Townhall 2F",
    owner: "IT Security",
    status: "Awaiting",
  },
  {
    id: "event-3",
    title: "Team Offsite Planning",
    date: "Fri, Sep 19 · 3:00 PM",
    location: "Board Room 3B",
    owner: "Operations",
    status: "Reminder",
  },
] as const satisfies EventItem[];

// Summary cards will be computed dynamically

const statusBadgeVariant: Record<EventItem["status"], "default" | "secondary" | "outline"> = {
  Confirmed: "default",
  Awaiting: "secondary",
  Reminder: "outline",
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [holidaySearch, setHolidaySearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"Company" | "Event" | "Birthday" | "All">("All");
  const [holidays, setHolidays] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string>("");

  // Get employee ID
  useEffect(() => {
    if (user?.employeeId) {
      setEmployeeId(user.employeeId);
    } else if (user?.email) {
      const getEmployeeId = async () => {
        try {
          const { fetchEmployees } = await import("@/lib/api");
          const employees = await fetchEmployees();
          const employee = employees.find((emp: { email: string }) => emp.email.toLowerCase() === user.email.toLowerCase());
          if (employee) {
            setEmployeeId(employee.id);
          }
        } catch (err) {
          console.error("Failed to fetch employee ID", err);
        }
      };
      void getEmployeeId();
    }
  }, [user]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!employeeId) return;
      setIsLoading(true);
      try {
        const [holidaysData, eventsData, leavesData, attendanceData, todayData] = await Promise.all([
          fetchHolidays(),
          fetchEvents(),
          fetchLeaves(),
          fetchAttendance({ employeeId }),
          getTodayAttendance(employeeId).catch(() => null),
        ]);
        setHolidays(holidaysData);
        setEvents(eventsData);
        setLeaves(leavesData);
        setAttendance(attendanceData);
        setTodayAttendance(todayData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    void loadDashboardData();
  }, [employeeId]);

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

  const holidayEntries = useMemo(() => {
    return holidays.map((holiday) => {
      const date = new Date(holiday.date);
      const dateLabel = formatDateLabel(holiday.date);
      const category: "Company" | "Event" | "Birthday" = holiday.type?.includes("Public") || holiday.type === "Company" ? "Company" : holiday.type === "Event" ? "Event" : "Birthday";
      
      return {
        id: holiday._id,
        title: holiday.name,
        dateLabel,
        timeLabel: "All Day",
        category,
        icon: Calendar,
        gradient: category === "Company" ? "from-blue-500/20 to-purple-500/20" : category === "Event" ? "from-green-500/20 to-teal-500/20" : "from-pink-500/20 to-rose-500/20",
      };
    });
  }, [holidays]);

  const filteredHolidays = useMemo(() => {
    const term = holidaySearch.trim().toLowerCase();
    return holidayEntries.filter((holiday) => {
      const matchesCategory = categoryFilter === "All" || holiday.category === categoryFilter;
      const matchesTerm =
        !term ||
        holiday.title.toLowerCase().includes(term) ||
        holiday.dateLabel.toLowerCase().includes(term) ||
        holiday.timeLabel.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [holidaySearch, categoryFilter, holidayEntries]);

  // Calculate stats
  const leaveBalance = useMemo(() => {
    const approvedLeaves = leaves.filter((l) => l.status === "Approved");
    const totalDays = approvedLeaves.reduce((sum, l) => sum + (l.days || 0), 0);
    return { used: totalDays, total: 20, remaining: Math.max(0, 20 - totalDays) };
  }, [leaves]);

  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
  const presentDays = attendance.filter((a) => a.status === "Present" || a.status === "On Time").length;

  const summaryCards = useMemo(() => [
    {
      id: "leave-balance",
      title: "Annual Leave Balance",
      value: `${leaveBalance.remaining} days`,
      helper: `${leaveBalance.used} days used`,
      progress: Math.round((leaveBalance.used / leaveBalance.total) * 100),
      accent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
      icon: CheckCircle2,
    },
    {
      id: "pending-approvals",
      title: "Pending Approvals",
      value: `${pendingLeaves} items`,
      helper: "Awaiting manager review",
      progress: pendingLeaves > 0 ? 25 : 0,
      accent: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
      icon: Bell,
    },
    {
      id: "attendance",
      title: "Present Days",
      value: `${presentDays} days`,
      helper: "This month",
      progress: Math.min(100, Math.round((presentDays / 22) * 100)),
      accent: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
      icon: Clock3,
    },
  ], [leaveBalance, pendingLeaves, presentDays]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate >= new Date() && e.status !== "completed";
      })
      .slice(0, 3)
      .map((event) => ({
        id: event._id,
        title: event.name,
        date: new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " · " + new Date(event.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        location: event.location,
        owner: event.owner || "Company",
        status: event.status === "upcoming" ? "Confirmed" : event.status === "ongoing" ? "Awaiting" : "Reminder" as const,
      }));
  }, [events]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {user?.name ?? "Team Member"}
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <Card key={card.id} className="relative overflow-hidden border-border/60">
              <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-transparent" />
              <CardContent className="relative flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.accent}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <Button size="icon" variant="ghost">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <p className="text-2xl font-semibold mt-2">{card.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.helper}</p>
                </div>
                <Progress value={card.progress} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl font-semibold leading-tight">
                  Holidays & Celebrations
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Stay updated with upcoming company events, meetings, and celebrations.
                </p>
              </div>
              <div className="mt-3 flex w-full items-center md:mt-0 md:w-auto">
                <Input
                  placeholder="Search events..."
                  value={holidaySearch}
                  onChange={(event) => setHolidaySearch(event.target.value)}
                  className="md:w-72 md:ml-auto"
                />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs">
              {(["All", "Company", "Event", "Birthday"] as const).map((category) => (
                <Button
                  key={category}
                  variant={categoryFilter === category ? "default" : "outline"}
                  size="sm"
                  className="rounded-full px-3"
                  onClick={() => setCategoryFilter(category as typeof categoryFilter)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredHolidays.map((holiday) => (
                <HolidayCard key={holiday.id} holiday={holiday} />
              ))}
              {filteredHolidays.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14">
                  <Calendar className="h-10 w-10 text-muted-foreground/70" />
                  <div className="text-center">
                    <p className="font-medium text-foreground">No matching events</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filters to see more results.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCategoryFilter("All")}>
                    Reset filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Jump into the tools you use most frequently.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="flex h-auto flex-col items-start gap-2 rounded-xl border-border/70 px-4 py-4 hover:border-primary/60"
                  onClick={() => {
                    if (action.id === "attendance") navigate("/employee/attendance");
                    else if (action.id === "leave") navigate("/employee/leave");
                    else if (action.id === "payslip") navigate("/employee/profile");
                  }}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <action.icon className="h-4 w-4 text-primary" />
                    {action.title}
                  </span>
                  <span className="text-sm text-muted-foreground">{action.description}</span>
                  <span className="text-xs text-primary font-medium">{action.actionLabel}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Upcoming Events</CardTitle>
              <p className="text-sm text-muted-foreground">
                Meetings and reminders scheduled for the next few days.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No upcoming events</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border px-4 py-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <Clock3 className="h-4 w-4" /> {event.date}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> {event.location}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant[event.status]}>{event.status}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Organiser: {event.owner}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                        Add to calendar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Need Assistance?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Reach out to People Operations for support with HR policies, IT helpdesk, or travel assistance.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="default" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call People Ops
                </Button>
                <Button size="sm" variant="outline">
                  Chat on Teams
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

