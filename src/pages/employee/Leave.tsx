import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  CalendarHeart,
  CalendarDays,
  Sun,
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fetchLeaves, createLeave, updateLeave, deleteLeave } from "@/lib/api";

type LeaveStatus = "Approved" | "Pending" | "Rejected";
type LeaveType = "Sick Leave" | "Casual Leave" | "Half-day Leave";

type LeaveRequest = {
  id: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  status: LeaveStatus;
  approver: string;
  notes: string;
};

const LEAVE_TYPES: LeaveType[] = ["Sick Leave", "Casual Leave", "Half-day Leave"];

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "LR-2025-012",
    type: "Sick Leave",
    from: "2025-08-30",
    to: "2025-08-31",
    days: 2,
    status: "Approved",
    approver: "Aisha Rahman",
    notes: "Medical certificate uploaded.",
  },
  {
    id: "LR-2025-013",
    type: "Casual Leave",
    from: "2025-09-12",
    to: "2025-09-12",
    days: 1,
    status: "Pending",
    approver: "Aisha Rahman",
    notes: "Attend parent-teacher meeting.",
  },
  {
    id: "LR-2025-011",
    type: "Half-day Leave",
    from: "2025-08-21",
    to: "2025-08-21",
    days: 0.5,
    status: "Rejected",
    approver: "Sanjay Patel",
    notes: "Team offsite scheduled.",
  },
] as const;

const statusVariant: Record<LeaveStatus, "default" | "secondary" | "destructive"> = {
  Approved: "default",
  Pending: "secondary",
  Rejected: "destructive",
};

type LeaveFormState = {
  id: string;
  type: LeaveType;
  from: string;
  to: string;
  days: string;
  status: LeaveStatus;
  approver: string;
  notes: string;
};

const EMPTY_FORM: LeaveFormState = {
  id: "",
  type: "Sick Leave",
  from: "",
  to: "",
  days: "",
  status: "Pending",
  approver: "",
  notes: "",
};

const LEAVE_LIMITS: Record<LeaveType, number | null> = {
  "Sick Leave": 8,
  "Casual Leave": null,
  "Half-day Leave": null,
};

const formatDateLabel = (value: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDays = (value: number) => {
  if (Number.isNaN(value)) return "—";
  const text = value % 1 === 0 ? value.toString() : value.toFixed(1);
  return `${text} day${value === 1 ? "" : "s"}`;
};

const Leave = () => {
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<LeaveFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<LeaveRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaves = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLeaves();
        setRequests(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load leave requests");
      } finally {
        setIsLoading(false);
      }
    };
    void loadLeaves();
  }, []);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((request) =>
      [request.id, request.type, request.status, request.approver, request.notes]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [requests, search]);

  const summaryCards = useMemo(() => {
    const tracked: LeaveType[] = ["Sick Leave"];
    return tracked.map((type) => {
      const total = LEAVE_LIMITS[type] ?? 0;
      const used = requests.reduce(
        (sum, request) =>
          request.type === type && request.status === "Approved" ? sum + request.days : sum,
        0
      );
      const remaining = total ? Math.max(total - used, 0) : 0;
      return {
        id: type,
        title: type,
        used,
        total,
        remaining,
        helper:
          total > 0
            ? `${formatDays(used)} of ${formatDays(total)} used`
            : `${formatDays(used)} approved this year`,
      };
    });
  }, [requests]);

  const openCreateDialog = () => {
    setFormState(EMPTY_FORM);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (request: LeaveRequest) => {
    setFormState({
      id: request.id,
      type: request.type,
      from: request.from,
      to: request.to,
      days: request.days.toString(),
      status: request.status,
      approver: request.approver,
      notes: request.notes,
    });
    setEditingId(request.id);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormState(EMPTY_FORM);
    setEditingId(null);
  };

  const handleInputChange = <K extends keyof LeaveFormState>(key: K, value: LeaveFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedId = formState.id.trim();
    const numericDays = Number(formState.days);

    if (!trimmedId || !formState.from || !formState.to) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!Number.isFinite(numericDays) || numericDays <= 0) {
      toast.error("Please enter a valid number of days.");
      return;
    }

    if (formState.from > formState.to) {
      toast.error("The start date cannot be after the end date.");
      return;
    }

    try {
      const payload = {
        requestId: trimmedId,
        type: formState.type,
        from: new Date(formState.from).toISOString(),
        to: new Date(formState.to).toISOString(),
        days: numericDays,
        status: editingId ? formState.status : "Pending",
        approver: formState.approver || "",
        notes: formState.notes.trim(),
      };

      if (editingId) {
        const updated = await updateLeave(editingId, payload);
        setRequests((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
        toast.success("Leave request updated.");
      } else {
        const created = await createLeave(payload);
        setRequests((prev) => [created, ...prev]);
        toast.success("Leave request created.");
      }
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save leave request");
    }
  };

  const confirmDelete = async () => {
    if (!requestToDelete) return;
    try {
      await deleteLeave(requestToDelete.id);
      setRequests((prev) => prev.filter((request) => request.id !== requestToDelete.id));
      toast.success("Leave request removed.");
      setRequestToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete leave request");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Leave Overview</h2>
          <p className="text-sm text-muted-foreground">
            Review balances, apply for time off, and monitor approvals.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Request leave
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((item) => {
          const percent =
            item.total > 0 ? Math.min(100, Math.round((item.used / item.total) * 100)) : 0;
          return (
            <Card key={item.id} className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>{item.helper}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-foreground">
                    {item.total > 0 ? `${formatDays(item.remaining)} remaining` : formatDays(item.used)}
                  </span>
                  {item.total > 0 ? (
                    <Badge variant="outline" className="text-xs">
                      {formatDays(item.used)} used
                    </Badge>
                  ) : null}
                </div>
                {item.total > 0 ? <Progress value={percent} /> : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Requests & History</CardTitle>
            <CardDescription>Recent leave applications and their approval status.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Approver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{request.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateLabel(request.from)} · {formatDateLabel(request.to)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDays(request.days)}</TableCell>
                  <TableCell>{request.approver}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {request.notes}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(request)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setRequestToDelete(request)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRequests.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No leave requests found. Adjust your filters to see more results.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Upcoming time away</CardTitle>
          <CardDescription>Automatically syncs approved leave with your calendar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <UpcomingItem
            title="Annual leave begins"
            date="Sep 18, 2025"
            description="Block your calendar and set out-of-office."
            icon={CalendarHeart}
          />
          <UpcomingItem
            title="Hybrid day in office"
            date="Sep 24, 2025"
            description="Check-in required by 9:30 AM."
            icon={CalendarDays}
          />
          <UpcomingItem
            title="Quarterly shutdown"
            date="Oct 02, 2025"
            description="Company-wide holiday · Gandhi Jayanti."
            icon={Sun}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit leave request" : "Request leave"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the leave details and save your changes."
                : "Provide the details below to submit a new leave request."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="leave-id">Request ID</Label>
                <Input
                  id="leave-id"
                  value={formState.id}
                  onChange={(event) => handleInputChange("id", event.target.value)}
                  placeholder="LR-2025-015"
                  required
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label>Leave type</Label>
                <Select
                  value={formState.type}
                  onValueChange={(value: LeaveType) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-from">From</Label>
                <Input
                  id="leave-from"
                  type="date"
                  value={formState.from}
                  onChange={(event) => handleInputChange("from", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-to">To</Label>
                <Input
                  id="leave-to"
                  type="date"
                  value={formState.to}
                  onChange={(event) => handleInputChange("to", event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-days">Number of days</Label>
                <Input
                  id="leave-days"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formState.days}
                  onChange={(event) => handleInputChange("days", event.target.value)}
                  placeholder="e.g. 2 or 0.5"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-approver">Approver</Label>
                <Input
                  id="leave-approver"
                  value={formState.approver}
                  onChange={(event) => handleInputChange("approver", event.target.value)}
                  placeholder="Your manager's name"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="leave-notes">Notes</Label>
                <Textarea
                  id="leave-notes"
                  value={formState.notes}
                  onChange={(event) => handleInputChange("notes", event.target.value)}
                  placeholder="Add context for your approver (optional)"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? "Save changes" : "Submit request"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!requestToDelete}
        onOpenChange={(open) => {
          if (!open) setRequestToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete leave request</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Do you really want to remove{" "}
              <span className="font-medium">{requestToDelete?.id}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const UpcomingItem = ({
  title,
  date,
  description,
  icon: Icon,
}: {
  title: string;
  date: string;
  description: string;
  icon: LucideIcon;
}) => (
  <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{date}</p>
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Leave;
