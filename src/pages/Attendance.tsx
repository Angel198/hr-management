import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { fetchAttendance, fetchEmployees } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

type AttendanceRecord = {
  _id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  status: string;
  location?: string;
};

type Employee = {
  id: string;
  name: string;
};

const CACHE_KEY = "adminAttendancePrefetch";

const getCachedAttendance = (date: string, status: string): AttendanceRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) {
      return [];
    }
    const parsed = JSON.parse(cached);
    if (parsed.date === date && parsed.status === status && Array.isArray(parsed.data)) {
      return parsed.data as AttendanceRecord[];
    }
  } catch (error) {
    console.warn("Failed to parse cached attendance data:", error);
  }
  return [];
};

const Attendance = () => {
  const initialDate = new Date().toISOString().split("T")[0];
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const initialCachedAttendance = getCachedAttendance(initialDate, "all");

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialCachedAttendance);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(initialCachedAttendance.length === 0);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const attendanceParams: { date: string; status?: string } = { date: selectedDate };
        if (statusFilter !== "all") {
          attendanceParams.status = statusFilter;
        }
        const [attendanceData, employeesData] = await Promise.all([
          fetchAttendance(attendanceParams),
          fetchEmployees(),
        ]);
        setAttendance(attendanceData);
        setEmployees(employeesData);

        if (typeof window !== "undefined" && statusFilter === "all") {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              date: selectedDate,
              status: statusFilter,
              data: attendanceData,
              fetchedAt: new Date().toISOString(),
            }),
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load attendance");
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [selectedDate, statusFilter]);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.name || employeeId;
  };

  const filteredAttendance = useMemo(() => {
    if (statusFilter === "all") {
      return attendance;
    }
    if (statusFilter === "present") {
      return attendance.filter((a) => a.status === "Present" || a.status === "On Time");
    }
    if (statusFilter === "absent") {
      return attendance.filter((a) => a.status === "Absent");
    }
    return attendance.filter((a) => a.status === statusFilter);
  }, [attendance, statusFilter]);

  const stats = useMemo(() => {
    const present = attendance.filter((a) => a.status === "Present" || a.status === "On Time").length;
    const onLeave = attendance.filter((a) => a.status === "On Leave").length;
    const absent = attendance.filter((a) => a.status === "Absent").length;
    const late = attendance.filter((a) => a.status === "Late").length;
    return { present, onLeave, absent, late };
  }, [attendance]);

  const buildExportRows = () =>
    filteredAttendance.map((record) => ({
      date: record.date ? format(new Date(record.date), "yyyy-MM-dd") : selectedDate,
      employee: getEmployeeName(record.employeeId),
      employeeId: record.employeeId,
      checkIn: record.checkIn || "",
      checkOut: record.checkOut || "",
      totalHours: record.workHours || "",
      status: record.status,
    }));

  const handleExport = () => {
    const rows = buildExportRows();
    if (rows.length === 0) {
      toast.info("No attendance records to export.");
      return;
    }

    const headers = ["Date", "Employee", "Employee ID", "Check In", "Check Out", "Total Hours", "Status"];
    const escapeValue = (value: string) => `"${(value ?? "").toString().replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        [
          escapeValue(row.date),
          escapeValue(row.employee),
          escapeValue(row.employeeId),
          escapeValue(row.checkIn),
          escapeValue(row.checkOut),
          escapeValue(row.totalHours),
          escapeValue(row.status),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} attendance record${rows.length > 1 ? "s" : ""}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Loading attendance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground mt-2">Track and manage employee attendance</p>
        </div>
        <div className="flex gap-2">
          <div className="hidden md:flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Present</p>
              <h3 className="text-3xl font-bold mt-2 text-success">{stats.present}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {employees.length > 0 ? Math.round((stats.present / employees.length) * 100) : 0}% of workforce
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">On Leave</p>
              <h3 className="text-3xl font-bold mt-2 text-warning">{stats.onLeave}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {employees.length > 0 ? Math.round((stats.onLeave / employees.length) * 100) : 0}% of workforce
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Absent</p>
              <h3 className="text-3xl font-bold mt-2 text-destructive">{stats.absent}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {employees.length > 0 ? Math.round((stats.absent / employees.length) * 100) : 0}% of workforce
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Late Arrivals</p>
              <h3 className="text-3xl font-bold mt-2 text-warning">{stats.late}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {employees.length > 0 ? Math.round((stats.late / employees.length) * 100) : 0}% of workforce
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Today&apos;s Attendance - {new Date(selectedDate).toLocaleDateString()}
            </CardTitle>
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Attendance</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground" htmlFor="sheet-date">
                      Date
                    </label>
                    <input
                      id="sheet-date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Late">Late</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter className="mt-6">
                  <Button onClick={() => setIsFilterOpen(false)} className="w-full">
                    Apply Filters
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No attendance records found for this date{statusFilter !== "all" ? ` with status: ${statusFilter}` : ""}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttendance.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell className="font-medium">{getEmployeeName(record.employeeId)}</TableCell>
                    <TableCell className="text-muted-foreground">{record.employeeId}</TableCell>
                    <TableCell>{record.checkIn || "—"}</TableCell>
                    <TableCell>{record.checkOut || "—"}</TableCell>
                    <TableCell>{record.workHours || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          record.status === "Present" || record.status === "On Time"
                            ? "default"
                            : record.status === "Late"
                              ? "secondary"
                              : record.status === "On Leave"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
