import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Search, CheckCircle2, XCircle, RotateCcw, Eye, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";
import { fetchEmployees, fetchClients, fetchTypesOfWork } from "@/lib/api";
import {
  getAllWorksheets,
  approveWorksheetAdmin,
  rejectWorksheetAdmin,
  reopenWorksheetAdmin,
  getWorksheetStats,
} from "@/lib/api";

type Task = {
  _id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  hours_spent: number;
  status: string;
  remarks: string;
  client?: { _id: string; name: string; code: string };
  typeOfWork?: { _id: string; name: string; code: string; category: string };
};

type Worksheet = {
  _id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
  };
  date: string;
  client?: {
    _id: string;
    name: string;
    code: string;
  };
  typeOfWork?: {
    _id: string;
    name: string;
    code: string;
    category: string;
  };
  tasks: Task[];
  worksheet_status: "draft" | "submitted" | "approved" | "rejected" | "reopened";
  admin_comments: string;
};

type Employee = {
  _id?: string;
  name?: string;
  email?: string;
  employeeId?: string;
  [key: string]: unknown;
};

type Client = {
  _id?: string;
  name?: string;
  code?: string;
  [key: string]: unknown;
};

type TypeOfWork = {
  _id?: string;
  name?: string;
  code?: string;
  category?: string;
  [key: string]: unknown;
};

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  reopened: "bg-yellow-100 text-yellow-700",
};

const Worksheets = () => {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalToday: 0,
    pendingApprovals: 0,
    approvedCount: 0,
    rejectedCount: 0,
  });
  const [selectedWorksheet, setSelectedWorksheet] = useState<Worksheet | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "reopen">("approve");
  const [adminComments, setAdminComments] = useState("");

  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [typeOfWorkFilter, setTypeOfWorkFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [typesOfWork, setTypesOfWork] = useState<TypeOfWork[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    console.log("Initializing worksheets page");
    const initialize = async () => {
      try {
        await loadData();
        await loadClientsAndTypesOfWork();
        await loadWorksheets();
      } catch (error) {
        console.error("Error initializing worksheets page:", error);
        setError(error instanceof Error ? error.message : "Failed to load worksheets data");
        toast.error("Failed to load worksheets data");
      }
    };
    void initialize();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await loadWorksheets();
      } catch (error) {
        console.error("Error loading worksheets:", error);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, startDateFilter, endDateFilter, employeeFilter, clientFilter, typeOfWorkFilter, statusFilter]);

  const loadClientsAndTypesOfWork = async () => {
    try {
      const [clientsData, typesOfWorkData] = await Promise.all([
        fetchClients().catch(() => []),
        fetchTypesOfWork().catch(() => []),
      ]);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setTypesOfWork(Array.isArray(typesOfWorkData) ? typesOfWorkData : []);
    } catch (error) {
      console.error("Error loading clients and types of work:", error);
    }
  };

  const loadData = async () => {
    try {
      const [employeesData, statsData] = await Promise.all([
        fetchEmployees().catch((err) => {
          console.error("Error fetching employees:", err);
          return [];
        }),
        getWorksheetStats().catch((err) => {
          console.error("Error fetching stats:", err);
          return { totalToday: 0, pendingApprovals: 0, approvedCount: 0, rejectedCount: 0 };
        }),
      ]);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setStats(statsData || { totalToday: 0, pendingApprovals: 0, approvedCount: 0, rejectedCount: 0 });
    } catch (error) {
      console.error("Error loading data:", error);
      setEmployees([]);
      setStats({ totalToday: 0, pendingApprovals: 0, approvedCount: 0, rejectedCount: 0 });
    }
  };

  const loadWorksheets = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFilter) {
        params.date = dateFilter;
      } else if (startDateFilter && endDateFilter) {
        params.startDate = startDateFilter;
        params.endDate = endDateFilter;
      }
      if (employeeFilter && employeeFilter !== "all") params.employeeId = employeeFilter;
      if (clientFilter && clientFilter !== "all") params.clientId = clientFilter;
      if (typeOfWorkFilter && typeOfWorkFilter !== "all") params.typeOfWorkId = typeOfWorkFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await getAllWorksheets(params);
      setWorksheets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading worksheets:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load worksheets";
      toast.error(errorMessage);
      setWorksheets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWorksheets = useMemo(() => {
    let filtered = worksheets;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((ws) => {
        if (!ws || !ws.employee) return false;
        
        const employeeName = (ws.employee?.name || "").toLowerCase();
        const employeeId = (ws.employee?.id || "").toLowerCase();
        const employeeEmail = (ws.employee?.email || "").toLowerCase();
        const employeeDepartment = (ws.employee?.department || "").toLowerCase();
        const employeeDesignation = (ws.employee?.designation || "").toLowerCase();
        
        // Search in employee details
        if (employeeName.includes(term) || 
            employeeId.includes(term) || 
            employeeEmail.includes(term) ||
            employeeDepartment.includes(term) ||
            employeeDesignation.includes(term)) {
          return true;
        }
        
        // Search in worksheet status
        const status = (ws.worksheet_status || "").toLowerCase();
        if (status.includes(term)) {
          return true;
        }
        
        // Search in client
        if (ws.client) {
          const clientName = (ws.client.name || "").toLowerCase();
          const clientCode = (ws.client.code || "").toLowerCase();
          if (clientName.includes(term) || clientCode.includes(term)) {
            return true;
          }
        }
        
        // Search in type of work
        if (ws.typeOfWork) {
          const typeName = (ws.typeOfWork.name || "").toLowerCase();
          const typeCode = (ws.typeOfWork.code || "").toLowerCase();
          if (typeName.includes(term) || typeCode.includes(term)) {
            return true;
          }
        }
        
        // Search in task titles and descriptions
        if (ws.tasks && Array.isArray(ws.tasks)) {
          const hasMatchingTask = ws.tasks.some((task) => {
            const taskTitle = (task.title || "").toLowerCase();
            const taskDescription = (task.description || "").toLowerCase();
            const taskRemarks = (task.remarks || "").toLowerCase();
            const taskClient = task.client ? (task.client.name || "").toLowerCase() : "";
            const taskTypeOfWork = task.typeOfWork ? (task.typeOfWork.name || "").toLowerCase() : "";
            return taskTitle.includes(term) || 
                   taskDescription.includes(term) || 
                   taskRemarks.includes(term) ||
                   taskClient.includes(term) ||
                   taskTypeOfWork.includes(term);
          });
          if (hasMatchingTask) return true;
        }
        
        // Search in admin comments
        const adminComments = (ws.admin_comments || "").toLowerCase();
        if (adminComments.includes(term)) {
          return true;
        }
        
        return false;
      });
    }

    // Apply client filter (client-side filtering for task-level clients)
    if (clientFilter && clientFilter !== "all") {
      filtered = filtered.filter((ws) => {
        // Check worksheet-level client
        if (ws.client?.code === clientFilter) return true;
        // Check task-level clients
        if (ws.tasks && Array.isArray(ws.tasks)) {
          return ws.tasks.some((task) => task.client?.code === clientFilter);
        }
        return false;
      });
    }

    // Apply type of work filter (client-side filtering for task-level types)
    if (typeOfWorkFilter && typeOfWorkFilter !== "all") {
      filtered = filtered.filter((ws) => {
        // Check worksheet-level type of work
        if (ws.typeOfWork?.code === typeOfWorkFilter) return true;
        // Check task-level types of work
        if (ws.tasks && Array.isArray(ws.tasks)) {
          return ws.tasks.some((task) => task.typeOfWork?.code === typeOfWorkFilter);
        }
        return false;
      });
    }

    return filtered;
  }, [worksheets, searchTerm, clientFilter, typeOfWorkFilter]);

  const openReviewDialog = (worksheet: Worksheet) => {
    setSelectedWorksheet(worksheet);
    setIsReviewDialogOpen(true);
  };

  const openActionDialog = (worksheet: Worksheet, type: "approve" | "reject" | "reopen") => {
    setSelectedWorksheet(worksheet);
    setActionType(type);
    setAdminComments(worksheet.admin_comments || "");
    setIsActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedWorksheet) return;

    if (actionType === "reject" && !adminComments.trim()) {
      toast.error("Please provide comments for rejection");
      return;
    }

    try {
      switch (actionType) {
        case "approve":
          await approveWorksheetAdmin(selectedWorksheet._id, adminComments);
          toast.success("Worksheet approved successfully");
          break;
        case "reject":
          await rejectWorksheetAdmin(selectedWorksheet._id, adminComments);
          toast.success("Worksheet rejected");
          break;
        case "reopen":
          await reopenWorksheetAdmin(selectedWorksheet._id, adminComments);
          toast.success("Worksheet reopened");
          break;
      }
      setIsActionDialogOpen(false);
      loadWorksheets();
      loadData(); // Reload stats
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to perform action");
    }
  };

  const totalHours = (worksheet: Worksheet) => {
    if (!worksheet || !worksheet.tasks || !Array.isArray(worksheet.tasks)) return 0;
    return worksheet.tasks.reduce((sum, task) => sum + (task.hours_spent || 0), 0);
  };

  // Early return for error state
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Work Sheets</h1>
            <p className="text-muted-foreground mt-2">Review and manage employee daily work sheets</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ensure we always render something
  if (isLoading && worksheets.length === 0 && !error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Work Sheets</h1>
            <p className="text-muted-foreground mt-2">Review and manage employee daily work sheets</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading worksheets...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Sheets</h1>
          <p className="text-muted-foreground mt-2">Review and manage employee daily work sheets</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Today</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalToday}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
              <h3 className="text-3xl font-bold mt-2 text-blue-600">{stats.pendingApprovals}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <h3 className="text-3xl font-bold mt-2 text-green-600">{stats.approvedCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <h3 className="text-3xl font-bold mt-2 text-red-600">{stats.rejectedCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Worksheets</CardTitle>
              <CardDescription>Filter and review employee work sheets</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee, tasks, status..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>Apply filters to refine your worksheet search</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div className="space-y-2">
                      <Label>Employee</Label>
                      <Select value={employeeFilter || "all"} onValueChange={(value) => setEmployeeFilter(value === "all" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Employees" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Employees</SelectItem>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name} ({emp.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Select value={clientFilter || "all"} onValueChange={(value) => setClientFilter(value === "all" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Clients" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Clients</SelectItem>
                          {clients
                            .filter((c) => c.status === "Active")
                            .map((client) => (
                              <SelectItem key={client._id} value={client.code}>
                                {client.name} ({client.code})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Type of Work</Label>
                      <Select value={typeOfWorkFilter || "all"} onValueChange={(value) => setTypeOfWorkFilter(value === "all" ? "" : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Types of Work" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types of Work</SelectItem>
                          {typesOfWork
                            .filter((t) => t.status === "Active")
                            .map((type) => (
                              <SelectItem key={type._id} value={type.code}>
                                {type.name} ({type.code})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Single Date</Label>
                      <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => {
                          setDateFilter(e.target.value);
                          setStartDateFilter("");
                          setEndDateFilter("");
                        }}
                        placeholder="Select date"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date From</Label>
                        <Input
                          type="date"
                          value={startDateFilter}
                          onChange={(e) => {
                            setStartDateFilter(e.target.value);
                            setDateFilter("");
                          }}
                          placeholder="Start date"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Date To</Label>
                        <Input
                          type="date"
                          value={endDateFilter}
                          onChange={(e) => {
                            setEndDateFilter(e.target.value);
                            setDateFilter("");
                          }}
                          placeholder="End date"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="reopened">Reopened</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setDateFilter("");
                          setStartDateFilter("");
                          setEndDateFilter("");
                          setEmployeeFilter("");
                          setClientFilter("");
                          setTypeOfWorkFilter("");
                          setStatusFilter("all");
                          setSearchTerm("");
                        }}
                      >
                        Clear Filters
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setIsFilterSheetOpen(false)}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading worksheets...</div>
          ) : filteredWorksheets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No worksheets found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorksheets.map((worksheet) => (
                  <TableRow key={worksheet._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{worksheet.employee?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          {worksheet.employee?.id} • {worksheet.employee?.department}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(worksheet.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{worksheet.tasks.length}</TableCell>
                    <TableCell>{totalHours(worksheet).toFixed(2)}h</TableCell>
                    <TableCell>
                      <Badge className={statusColors[worksheet.worksheet_status]}>
                        {worksheet.worksheet_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openReviewDialog(worksheet)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {worksheet.worksheet_status === "submitted" || worksheet.worksheet_status === "reopened" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openActionDialog(worksheet, "approve")}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openActionDialog(worksheet, "reject")}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        ) : (worksheet.worksheet_status === "approved" || worksheet.worksheet_status === "rejected") ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openActionDialog(worksheet, "reopen")}
                          >
                            <RotateCcw className="h-4 w-4 text-yellow-600" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Worksheet Review</DialogTitle>
            <DialogDescription>
              {selectedWorksheet?.employee?.name} - {selectedWorksheet && new Date(selectedWorksheet.date).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {selectedWorksheet && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedWorksheet.worksheet_status]}>
                  {selectedWorksheet.worksheet_status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Total: {totalHours(selectedWorksheet).toFixed(2)} hours
                </span>
              </div>
              
              {(selectedWorksheet.client || selectedWorksheet.typeOfWork) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
                  {selectedWorksheet.client && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Client</p>
                      <p className="text-sm font-semibold">
                        {selectedWorksheet.client.name} ({selectedWorksheet.client.code})
                      </p>
                    </div>
                  )}
                  {selectedWorksheet.typeOfWork && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Type of Work</p>
                      <p className="text-sm font-semibold">
                        {selectedWorksheet.typeOfWork.name} ({selectedWorksheet.typeOfWork.code})
                      </p>
                      {selectedWorksheet.typeOfWork.category && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Category: {selectedWorksheet.typeOfWork.category}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {selectedWorksheet.admin_comments && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-900">Admin Comments</p>
                  <p className="text-sm text-yellow-800 mt-1">{selectedWorksheet.admin_comments}</p>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Client / Type of Work</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedWorksheet.tasks.map((task) => (
                    <TableRow key={task._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          {task.remarks && (
                            <p className="text-xs text-muted-foreground mt-1 italic">Note: {task.remarks}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {task.client && (
                            <p className="font-medium">Client: {task.client.name} ({task.client.code})</p>
                          )}
                          {task.typeOfWork && (
                            <p className="text-muted-foreground">Type: {task.typeOfWork.name} ({task.typeOfWork.code})</p>
                          )}
                          {!task.client && !task.typeOfWork && (
                            <p className="text-muted-foreground italic">-</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.start_time} - {task.end_time}
                      </TableCell>
                      <TableCell>{task.hours_spent.toFixed(2)}h</TableCell>
                      <TableCell>
                        <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                          {task.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Worksheet"}
              {actionType === "reject" && "Reject Worksheet"}
              {actionType === "reopen" && "Reopen Worksheet"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && "Approve this worksheet"}
              {actionType === "reject" && "Reject this worksheet (comments required)"}
              {actionType === "reopen" && "Reopen this worksheet for editing"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comments">
                Admin Comments {actionType === "reject" && "*"}
              </Label>
              <Textarea
                id="comments"
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Enter comments..."
                rows={4}
                required={actionType === "reject"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              className={
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : actionType === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-yellow-600 hover:bg-yellow-700"
              }
            >
              {actionType === "approve" && "Approve"}
              {actionType === "reject" && "Reject"}
              {actionType === "reopen" && "Reopen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Worksheets;

