import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Filter, Download } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchLeaves, approveLeave, rejectLeave, fetchEmployees } from "@/lib/api";
import { toast } from "sonner";

type LeaveRequest = {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
  approver?: string;
  notes?: string;
  employeeId?: string;
  createdAt?: string;
};

type Employee = {
  id: string;
  name: string;
  email: string;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [employeeNameFilter, setEmployeeNameFilter] = useState<string>("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [leavesData, employeesData] = await Promise.all([
          fetchLeaves(),
          fetchEmployees(),
        ]);
        setLeaves(leavesData);
        setEmployees(employeesData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load leave requests");
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, []);

  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId) return "Unknown";
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.name || employeeId;
  };

  const uniqueLeaveTypes = useMemo(() => {
    const types = new Set(leaves.map((l) => l.type));
    return Array.from(types).sort();
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    let filtered = leaves;

    // Filter by employee name
    if (employeeNameFilter.trim()) {
      const searchTerm = employeeNameFilter.trim().toLowerCase();
      filtered = filtered.filter((leave) => {
        const employeeName = getEmployeeName(leave.employeeId).toLowerCase();
        return employeeName.includes(searchTerm);
      });
    }

    // Filter by leave type
    if (leaveTypeFilter !== "all") {
      filtered = filtered.filter((leave) => leave.type === leaveTypeFilter);
    }

    return filtered;
  }, [leaves, employeeNameFilter, leaveTypeFilter, employees]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const updated = await approveLeave(id, "Admin");
      setLeaves((prev) => prev.map((l) => (l.id === id ? updated : l)));
      toast.success("Leave request approved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve leave");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const updated = await rejectLeave(id, "Admin");
      setLeaves((prev) => prev.map((l) => (l.id === id ? updated : l)));
      toast.success("Leave request rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject leave");
    } finally {
      setProcessingId(null);
    }
  };

  const stats = useMemo(() => {
    const pending = leaves.filter((l) => l.status === "Pending").length;
    const approved = leaves.filter((l) => l.status === "Approved").length;
    const rejected = leaves.filter((l) => l.status === "Rejected").length;
    const today = new Date().toISOString().split("T")[0];
    const onLeaveToday = leaves.filter(
      (l) => l.status === "Approved" && l.from <= today && l.to >= today
    ).length;
    return { pending, approved, rejected, onLeaveToday };
  }, [leaves]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground mt-2">Manage employee leave requests and policies</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <h3 className="text-3xl font-bold mt-2">{stats.pending}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <h3 className="text-3xl font-bold mt-2">{stats.approved}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <h3 className="text-3xl font-bold mt-2">{stats.rejected}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Leave Today</p>
                <h3 className="text-3xl font-bold mt-2">{stats.onLeaveToday}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Leave Requests</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name..."
                className="pl-10"
                value={employeeNameFilter}
                onChange={(e) => setEmployeeNameFilter(e.target.value)}
              />
            </div>
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                {uniqueLeaveTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No leave requests found{employeeNameFilter || leaveTypeFilter !== "all" ? " matching filters" : ""}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeaves.map((request) => {
                  const employeeName = getEmployeeName(request.employeeId);
                  const initials = employeeName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employeeName}</p>
                            <p className="text-xs text-muted-foreground">{request.employeeId || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{request.type}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {formatDate(request.from)} - {formatDate(request.to)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{request.days} days</TableCell>
                      <TableCell className="text-muted-foreground">
                        {request.createdAt ? formatDate(request.createdAt) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === "Pending"
                              ? "secondary"
                              : request.status === "Approved"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.status === "Pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(request.id)}
                              disabled={processingId === request.id}
                            >
                              {processingId === request.id ? "Processing..." : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(request.id)}
                              disabled={processingId === request.id}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {request.status !== "Pending" && (
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveManagement;
