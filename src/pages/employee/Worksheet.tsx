import { useEffect, useState } from "react";
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
import { Plus, Edit, Trash2, CheckCircle2, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  createOrGetWorksheet,
  addTaskToWorksheet,
  updateTaskInWorksheet,
  removeTaskFromWorksheet,
  submitWorksheet,
  getWorksheetByDate,
  fetchClients,
  fetchTypesOfWork,
} from "@/lib/api";

type Task = {
  _id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  hours_spent: number;
  status: "pending" | "completed";
  remarks: string;
  client?: { _id: string; name: string; code: string };
  typeOfWork?: { _id: string; name: string; code: string; category: string };
};

type Worksheet = {
  _id: string;
  employee: any;
  date: string;
  client?: { _id: string; name: string; code: string };
  typeOfWork?: { _id: string; name: string; code: string; category: string };
  tasks: Task[];
  worksheet_status: "draft" | "submitted" | "approved" | "rejected" | "reopened";
  admin_comments: string;
};

const statusColors = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  reopened: "bg-yellow-100 text-yellow-700",
};

const Worksheet = () => {
  const { user } = useAuth();
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    remarks: "",
    clientId: "",
    typeOfWorkId: "",
  });

  const employeeId = user?.employeeId || "";
  const [clients, setClients] = useState<any[]>([]);
  const [typesOfWork, setTypesOfWork] = useState<any[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (employeeId) {
      loadWorksheet();
      loadOptions();
    }
  }, [employeeId, selectedDate]);

  const loadOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const [clientsData, typesOfWorkData] = await Promise.all([
        fetchClients().catch(() => []),
        fetchTypesOfWork().catch(() => []),
      ]);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setTypesOfWork(Array.isArray(typesOfWorkData) ? typesOfWorkData : []);
    } catch (error) {
      console.error("Error loading options:", error);
    } finally {
      setIsLoadingOptions(false);
    }
  };


  const loadWorksheet = async () => {
    if (!employeeId) return;
    setIsLoading(true);
    try {
      // Try to get worksheet for selected date
      const data = await getWorksheetByDate(employeeId, selectedDate);
      setWorksheet(data);
    } catch (err) {
      // If not found for selected date, check if it's today
      const today = new Date().toISOString().split("T")[0];
      if (selectedDate === today) {
        // Create new worksheet for today
        try {
          const data = await createOrGetWorksheet(employeeId);
          setWorksheet(data);
        } catch (error) {
          console.error("Error creating worksheet:", error);
          toast.error("Failed to create worksheet");
        }
      } else {
        // For past dates, show empty state
        toast.error("No worksheet found for this date");
        setWorksheet(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openAddTaskDialog = () => {
    setEditingTask(null);
    setTaskForm({
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      remarks: "",
    });
    setIsTaskDialogOpen(true);
  };

  const openEditTaskDialog = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      start_time: task.start_time,
      end_time: task.end_time,
      remarks: task.remarks || "",
    });
    setIsTaskDialogOpen(true);
  };

  const handleTaskSubmit = async () => {
    if (!worksheet || !taskForm.title || !taskForm.start_time || !taskForm.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingTask) {
        await updateTaskInWorksheet(worksheet._id, editingTask._id, taskForm);
        toast.success("Task updated successfully");
      } else {
        await addTaskToWorksheet(worksheet._id, taskForm);
        toast.success("Task added successfully");
      }
      setIsTaskDialogOpen(false);
      loadWorksheet();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!worksheet) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await removeTaskFromWorksheet(worksheet._id, taskId);
      toast.success("Task deleted successfully");
      loadWorksheet();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task");
    }
  };

  const handleSubmitWorksheet = async () => {
    if (!worksheet) return;
    if (worksheet.tasks.length === 0) {
      toast.error("Please add at least one task before submitting");
      return;
    }

    if (!confirm("Are you sure you want to submit this worksheet? You won't be able to edit it after submission.")) {
      return;
    }

    try {
      await submitWorksheet(worksheet._id);
      toast.success("Worksheet submitted successfully");
      loadWorksheet();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit worksheet");
    }
  };

  const canEdit = worksheet?.worksheet_status === "draft" || worksheet?.worksheet_status === "reopened";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Loading worksheet...</p>
      </div>
    );
  }

  if (!worksheet) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Failed to load worksheet</p>
      </div>
    );
  }

  const totalHours = worksheet.tasks.reduce((sum, task) => sum + (task.hours_spent || 0), 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Work Sheet</h1>
            <p className="text-muted-foreground mt-2">Record your daily tasks and submit for review</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Badge className={statusColors[worksheet.worksheet_status]}>
              {worksheet.worksheet_status.charAt(0).toUpperCase() + worksheet.worksheet_status.slice(1)}
            </Badge>
          </div>
        </div>

      </div>

      {worksheet.admin_comments && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-yellow-700 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Admin Comments</p>
                <p className="text-sm text-yellow-800 mt-1">{worksheet.admin_comments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                {worksheet.tasks.length} task(s) • Total: {totalHours.toFixed(2)} hours
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={openAddTaskDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {worksheet.tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tasks added yet. Click "Add Task" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Client / Type of Work</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {worksheet.tasks.map((task) => (
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
                      <div className="text-sm">
                        <p>{task.start_time} - {task.end_time}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{task.hours_spent.toFixed(2)}h</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditTaskDialog(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canEdit && worksheet.tasks.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSubmitWorksheet} size="lg" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Submit Worksheet
          </Button>
        </div>
      )}

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update task details" : "Add a new task to your worksheet"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g., Complete feature development"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Task details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={taskForm.start_time}
                  onChange={(e) => setTaskForm({ ...taskForm, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={taskForm.end_time}
                  onChange={(e) => setTaskForm({ ...taskForm, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-client">Client</Label>
                <Select
                  value={taskForm.clientId || "none"}
                  onValueChange={(value) => setTaskForm({ ...taskForm, clientId: value === "none" ? "" : value })}
                  disabled={isLoadingOptions}
                >
                  <SelectTrigger id="task-client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
                <Label htmlFor="task-typeOfWork">Type of Work</Label>
                <Select
                  value={taskForm.typeOfWorkId || "none"}
                  onValueChange={(value) => setTaskForm({ ...taskForm, typeOfWorkId: value === "none" ? "" : value })}
                  disabled={isLoadingOptions}
                >
                  <SelectTrigger id="task-typeOfWork">
                    <SelectValue placeholder="Select type of work" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={taskForm.remarks}
                onChange={(e) => setTaskForm({ ...taskForm, remarks: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTaskSubmit}>
              {editingTask ? "Update Task" : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Worksheet;

