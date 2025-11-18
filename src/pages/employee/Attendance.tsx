import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck, Clock3, MapPin, Download, Search, LogIn, LogOut } from "lucide-react";
import { fetchAttendance, checkIn, checkOut, getTodayAttendance, fetchEmployees } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type AttendanceRecord = {
  _id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  status: "On Time" | "Late" | "Absent" | "Present";
  location: string;
};

type TodayAttendance = {
  _id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  status: string;
  location?: string;
} | null;

const statusVariant: Record<AttendanceRecord["status"], "default" | "secondary" | "destructive"> = {
  "On Time": "default",
  Present: "default",
  Late: "secondary",
  Absent: "destructive",
};

const Attendance = () => {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [filteredStatus, setFilteredStatus] = useState<AttendanceRecord["status"] | "All">("All");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance>(null);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get employee ID (from auth or fallback to lookup)
  useEffect(() => {
    if (user?.employeeId) {
      console.log("Employee ID from auth:", user.employeeId);
      setEmployeeId(user.employeeId);
      return;
    }

    const getEmployeeId = async () => {
      if (!user?.email) {
        console.warn("No email found in user object");
        return;
      }
      try {
        console.log("Looking up employee by email:", user.email);
        const employees = await fetchEmployees();
        const employee = employees.find(
          (emp: { email: string }) => emp.email.toLowerCase() === user.email.toLowerCase()
        );
        if (employee) {
          console.log("Found employee:", employee.id);
          setEmployeeId(employee.id);
        } else {
          console.warn("No employee found with email:", user.email);
        }
      } catch (err) {
        console.error("Failed to fetch employee ID", err);
        toast.error("Failed to load employee information");
      }
    };
    void getEmployeeId();
  }, [user]);

  // Load today's attendance and history
  useEffect(() => {
    const loadAttendance = async () => {
      if (!employeeId) {
        console.log("No employeeId, skipping attendance load");
        setIsLoading(false); // Set loading to false if no employeeId
        return;
      }
      
      console.log("Loading attendance for employeeId:", employeeId);
      setIsLoading(true);
      
      try {
        // Fetch both in parallel, but handle errors separately
        const todayPromise = getTodayAttendance(employeeId).catch((err) => {
          console.error("Error fetching today's attendance:", err);
          // If it's a network error, rethrow it
          if (err?.message?.includes("Network error") || err?.message?.includes("fetch")) {
            throw err;
          }
          // Otherwise, no record for today is fine - return null
          return null;
        });

        const historyPromise = fetchAttendance({ employeeId }).catch((err) => {
          console.error("Error fetching attendance history:", err);
          // If it's a network error, rethrow it
          if (err?.message?.includes("Network error") || err?.message?.includes("fetch")) {
            throw err;
          }
          // Otherwise, return empty array
          return [];
        });

        const [todayData, historyData] = await Promise.all([todayPromise, historyPromise]);
        
        console.log("Today's attendance:", todayData);
        console.log("Attendance history count:", Array.isArray(historyData) ? historyData.length : 0);
        
        setTodayAttendance(todayData);
        setAttendance(Array.isArray(historyData) ? historyData : []);
      } catch (err) {
        console.error("Failed to load attendance:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load attendance";
        
        if (errorMessage.includes("Network error") || errorMessage.includes("fetch") || errorMessage.includes("connect")) {
          toast.error("Cannot connect to server. Please ensure the backend server is running on port 5050. Check the terminal for server status.");
        } else {
          toast.error(`Failed to load attendance: ${errorMessage}`);
        }
        
        // Set empty state on error
        setAttendance([]);
        setTodayAttendance(null);
      } finally {
        setIsLoading(false);
      }
    };
    void loadAttendance();
  }, [employeeId]);

  // Set loading to false if employeeId lookup fails after a timeout
  useEffect(() => {
    if (!employeeId && user) {
      const timeout = setTimeout(() => {
        if (!employeeId) {
          console.warn("EmployeeId not found after timeout, setting loading to false");
          setIsLoading(false);
        }
      }, 5000); // 5 second timeout
      return () => clearTimeout(timeout);
    }
  }, [employeeId, user]);

  const handleCheckIn = async () => {
    if (!employeeId) {
      toast.error("Employee ID not found. Please log out and log in again.");
      console.error("Employee ID is missing. User:", user);
      return;
    }
    
    if (todayAttendance?.checkIn) {
      toast.error("You have already checked in today.");
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Checking in with employeeId:", employeeId);
      const result = await checkIn(employeeId, "Office");
      console.log("Check-in result:", result);
      
      if (result) {
        // Reload today's attendance and history
        const [updatedTodayData, historyData] = await Promise.all([
          getTodayAttendance(employeeId).catch(() => result),
          fetchAttendance({ employeeId }),
        ]);
        
        setTodayAttendance(updatedTodayData || result);
        setAttendance(historyData);
        
        const checkInTime = result.checkIn || updatedTodayData?.checkIn || "now";
        toast.success(`Checked in at ${checkInTime}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Check-in error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to check in. Please ensure the server is running on port 5050.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!employeeId) {
      toast.error("Employee ID not found. Please log out and log in again.");
      console.error("Employee ID is missing. User:", user);
      return;
    }

    if (!todayAttendance?.checkIn) {
      toast.error("Please check in first before checking out.");
      return;
    }

    if (todayAttendance?.checkOut) {
      toast.error("You have already checked out today.");
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Checking out with employeeId:", employeeId);
      const result = await checkOut(employeeId);
      console.log("Check-out result:", result);
      
      if (result) {
        // Reload today's attendance and history
        const [updatedTodayData, historyData] = await Promise.all([
          getTodayAttendance(employeeId).catch(() => result),
          fetchAttendance({ employeeId }),
        ]);
        
        setTodayAttendance(updatedTodayData || result);
        setAttendance(historyData);
        
        const checkOutTime = result.checkOut || updatedTodayData?.checkOut || "now";
        const workHours = result.workHours || updatedTodayData?.workHours || "0h 00m";
        toast.success(`Checked out at ${checkOutTime}. Work hours: ${workHours}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Check-out error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to check out. Please ensure the server is running on port 5050.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return attendance.filter((record) => {
      const matchesStatus = filteredStatus === "All" || record.status === filteredStatus;
      const dateStr = new Date(record.date).toLocaleDateString();
      const matchesTerm =
        !term ||
        dateStr.toLowerCase().includes(term) ||
        record.location?.toLowerCase().includes(term) ||
        record.status.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [attendance, search, filteredStatus]);

  const presentCount = attendance.filter((r) => r.status === "On Time" || r.status === "Present").length;
  const totalDays = attendance.length || 1;
  const presentPercentage = Math.round((presentCount / totalDays) * 100);

  const avgWorkHours = useMemo(() => {
    const hours = attendance
      .filter((r) => r.workHours)
      .map((r) => {
        const match = r.workHours.match(/(\d+)h\s*(\d+)?m?/);
        if (match) {
          const h = parseInt(match[1] || "0", 10);
          const m = parseInt(match[2] || "0", 10);
          return h + m / 60;
        }
        return 0;
      });
    if (hours.length === 0) return "0h 00m";
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    const h = Math.floor(avg);
    const m = Math.round((avg - h) * 60);
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  }, [attendance]);

  const summary = [
    {
      id: "present",
      title: "Present days",
      value: presentCount.toString(),
      helper: `Out of ${totalDays} working days`,
      icon: CalendarCheck,
    },
    {
      id: "hours",
      title: "Avg. work hours",
      value: avgWorkHours,
      helper: "This billing cycle",
      icon: Clock3,
    },
    {
      id: "location",
      title: "Preferred location",
      value: "Hybrid · 60% office",
      helper: "Updated this month",
      icon: MapPin,
    },
  ] as const;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Loading attendance...</p>
      </div>
    );
  }

  const canCheckIn = !todayAttendance || !todayAttendance.checkIn;
  const canCheckOut = todayAttendance && todayAttendance.checkIn && !todayAttendance.checkOut;

  // Show error if employeeId is missing and we're not loading
  if (!employeeId && !isLoading && user) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">Attendance Overview</h2>
          <p className="text-muted-foreground">
            Monitor daily check-ins, track working hours, and download your attendance history.
          </p>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-destructive font-medium">Employee ID not found</p>
              <p className="text-sm text-muted-foreground">
                Unable to load your employee information. Please check:
              </p>
              <ul className="text-sm text-muted-foreground text-left list-disc list-inside space-y-1">
                <li>Your employee record exists in the system</li>
                <li>The backend server is running</li>
                <li>Your email matches your employee record</li>
              </ul>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.reload()} variant="outline">
                  Reload Page
                </Button>
                <Button onClick={() => {
                  logout();
                  window.location.href = "/auth";
                }} variant="default">
                  Logout & Login Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Attendance Overview</h2>
        <p className="text-muted-foreground">
          Monitor daily check-ins, track working hours, and download your attendance history.
        </p>
      </div>

      {/* Check-in/Check-out Card */}
      <Card className="border-border/60 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle>Today&apos;s Attendance</CardTitle>
          <CardDescription>Check in when you arrive and check out when you leave</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in Time</p>
                  <p className="text-lg font-semibold">
                    {todayAttendance?.checkIn || "Not checked in"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out Time</p>
                  <p className="text-lg font-semibold">
                    {todayAttendance?.checkOut || "Not checked out"}
                  </p>
                </div>
                {todayAttendance?.workHours && (
                  <div>
                    <p className="text-sm text-muted-foreground">Work Hours</p>
                    <p className="text-lg font-semibold">{todayAttendance.workHours}</p>
                  </div>
                )}
              </div>
              {todayAttendance?.status && (
                <div>
                  <Badge variant={statusVariant[todayAttendance.status as AttendanceRecord["status"]] || "default"}>
                    {todayAttendance.status}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCheckIn}
                disabled={!canCheckIn || isProcessing}
                className="gap-2"
                size="lg"
              >
                <LogIn className="h-4 w-4" />
                Check In
              </Button>
              <Button
                onClick={handleCheckOut}
                disabled={!canCheckOut || isProcessing}
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <LogOut className="h-4 w-4" />
                Check Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.id} className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <item.icon className="h-5 w-5 text-primary" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Download className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <p className="mt-2 text-xl font-semibold text-foreground">{item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Check-in Log</CardTitle>
              <CardDescription>
                Recent attendance events with arrival time, hours logged, and location.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by date, location..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                {(["All", "On Time", "Late", "Absent"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filteredStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilteredStatus(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No attendance entries match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => {
                  const date = new Date(record.date);
                  const day = date.toLocaleDateString("en-US", { weekday: "long" });
                  return (
                    <TableRow key={record._id}>
                      <TableCell className="font-medium">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell>{day}</TableCell>
                      <TableCell>{record.checkIn || "—"}</TableCell>
                      <TableCell>{record.checkOut || "—"}</TableCell>
                      <TableCell>{record.workHours || "0h 00m"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[record.status]}>{record.status}</Badge>
                      </TableCell>
                      <TableCell>{record.location || "—"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardContent className="border-t border-border/60">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Attendance Score</p>
              <p className="text-xs text-muted-foreground">
                Based on on-time arrivals and approved leave this month.
              </p>
            </div>
            <div className="flex min-w-[200px] items-center gap-3">
              <span className="text-sm font-semibold text-foreground">{presentPercentage}%</span>
              <Progress value={presentPercentage} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
