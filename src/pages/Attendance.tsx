import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Filter } from "lucide-react";
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
import { fetchAttendance, fetchEmployees } from "@/lib/api";
import { toast } from "sonner";

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

const getCachedAttendance = (date: string): AttendanceRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const cached = sessionStorage.getItem("adminAttendancePrefetch");
    if (!cached) {
      return [];
    }
    const parsed = JSON.parse(cached);
    if (parsed.date === date && Array.isArray(parsed.data)) {
      return parsed.data as AttendanceRecord[];
    }
  } catch (error) {
    console.warn("Failed to parse cached attendance data:", error);
  }
  return [];
};

const Attendance = () => {
  const initialDate = new Date().toISOString().split("T")[0];
  const initialCachedAttendance = getCachedAttendance(initialDate);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialCachedAttendance);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(initialCachedAttendance.length === 0);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [attendanceData, employeesData] = await Promise.all([
          fetchAttendance({ date: selectedDate }),
          fetchEmployees(),
        ]);
        setAttendance(attendanceData);
        setEmployees(employeesData);

         if (typeof window !== "undefined") {
           sessionStorage.setItem(
             "adminAttendancePrefetch",
             JSON.stringify({
               date: selectedDate,
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
  }, [selectedDate]);

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
          <Button variant="outline" className="gap-2">
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
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
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
