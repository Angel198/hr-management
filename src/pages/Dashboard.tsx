import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/Dashboard/MetricCard";
import { Users, Clock, Calendar, TrendingUp, Award, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchEmployees, fetchAttendance, fetchLeaves, approveLeave, rejectLeave } from "@/lib/api";
import { toast } from "sonner";

type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  status: string;
};

type LeaveRequest = {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: string;
  employeeId?: string;
  createdAt?: string;
};

type AttendanceRecord = {
  employeeId: string;
  date: string;
  status: string;
};

const Dashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const [employeesData, leavesData, attendanceData] = await Promise.all([
          fetchEmployees(),
          fetchLeaves(),
          fetchAttendance({ date: today }),
        ]);
        setEmployees(employeesData);
        setLeaves(leavesData);
        setAttendance(attendanceData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, []);

  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.status === "Active").length;
    
    const today = new Date().toISOString().split("T")[0];
    const presentToday = attendance.filter(
      (a) => a.status === "Present" || a.status === "On Time" || a.status === "Late"
    ).length;
    
    const onLeaveToday = leaves.filter((l) => {
      if (l.status !== "Approved") return false;
      const fromDate = new Date(l.from).toISOString().split("T")[0];
      const toDate = new Date(l.to).toISOString().split("T")[0];
      return today >= fromDate && today <= toDate;
    }).length;
    
    const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
    
    const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    return {
      totalEmployees,
      activeEmployees,
      presentToday,
      attendanceRate,
      onLeaveToday,
      pendingLeaves,
    };
  }, [employees, attendance, leaves]);

  const pendingLeaveRequests = useMemo(() => {
    return leaves
      .filter((l) => l.status === "Pending")
      .slice(0, 4)
      .map((leave) => {
        const employee = employees.find((e) => e.id === leave.employeeId);
        return {
          ...leave,
          employeeName: employee?.name || leave.employeeId || "Unknown",
        };
      });
  }, [leaves, employees]);

  const departmentStats = useMemo(() => {
    const deptMap = new Map<string, { total: number; present: number }>();
    
    employees.forEach((emp) => {
      if (!deptMap.has(emp.department)) {
        deptMap.set(emp.department, { total: 0, present: 0 });
      }
      const dept = deptMap.get(emp.department)!;
      dept.total++;
      
      const today = new Date().toISOString().split("T")[0];
      const empAttendance = attendance.find(
        (a) => a.employeeId === emp.id && a.date === today
      );
      if (empAttendance && (empAttendance.status === "Present" || empAttendance.status === "On Time")) {
        dept.present++;
      }
    });

    return Array.from(deptMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [employees, attendance]);

  const handleApproveLeave = async (leaveId: string) => {
    try {
      const updated = await approveLeave(leaveId, "Admin");
      setLeaves((prev) => prev.map((l) => (l.id === leaveId ? updated : l)));
      toast.success("Leave request approved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve leave");
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    try {
      const updated = await rejectLeave(leaveId, "Admin");
      setLeaves((prev) => prev.map((l) => (l.id === leaveId ? updated : l)));
      toast.success("Leave request rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject leave");
    }
  };

  const formatDateRange = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const fromStr = fromDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const toStr = toDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return fromStr === toStr ? fromStr : `${fromStr} - ${toStr}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Employees"
          value={stats.totalEmployees.toString()}
          icon={Users}
          trend={{ value: `${stats.activeEmployees} active`, positive: true }}
        />
        <MetricCard
          title="Present Today"
          value={stats.presentToday.toString()}
          icon={Clock}
          description={`${stats.attendanceRate}% attendance rate`}
        />
        <MetricCard
          title="On Leave"
          value={stats.onLeaveToday.toString()}
          icon={Calendar}
          description={`Pending: ${stats.pendingLeaves}`}
        />
        <MetricCard
          title="Pending Requests"
          value={stats.pendingLeaves.toString()}
          icon={TrendingUp}
          description="Awaiting approval"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Leave Requests</span>
              <Badge variant="secondary">{stats.pendingLeaves} New</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingLeaveRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending leave requests</p>
              ) : (
                pendingLeaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{request.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.type} - {request.days} {request.days === 1 ? "day" : "days"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateRange(request.from, request.to)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApproveLeave(request.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectLeave(request.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Activities</span>
              <Button variant="ghost" size="sm">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  icon: Users,
                  text: `${employees.filter((e) => e.status === "Active").length} active employees`,
                  time: "Just now",
                  color: "text-success",
                },
                {
                  icon: AlertCircle,
                  text: `${stats.pendingLeaves} leave requests pending approval`,
                  time: "Today",
                  color: "text-warning",
                },
                {
                  icon: Award,
                  text: `${stats.presentToday} employees present today`,
                  time: "Today",
                  color: "text-primary",
                },
                {
                  icon: Calendar,
                  text: `${stats.onLeaveToday} employees on leave today`,
                  time: "Today",
                  color: "text-accent",
                },
                {
                  icon: TrendingUp,
                  text: `${stats.attendanceRate}% overall attendance rate`,
                  time: "Today",
                  color: "text-muted-foreground",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${activity.color}`}
                  >
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {departmentStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No department data available</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {departmentStats.map((dept) => {
                const percentage = dept.total > 0 ? Math.round((dept.present / dept.total) * 100) : 0;
                return (
                  <div
                    key={dept.name}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-semibold">{dept.name}</h4>
                    <p className="text-2xl font-bold mt-2">{dept.total}</p>
                    <p className="text-sm text-muted-foreground mt-1">{dept.present} present today</p>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
