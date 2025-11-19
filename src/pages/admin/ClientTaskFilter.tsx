import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchClients, fetchEmployees, fetchClientTasksForInvoice, createInvoiceFromTasks } from "@/lib/api";

type ClientOption = { _id: string; name: string; code?: string; status?: string };
type EmployeeOption = { id: string; name: string };

type TaskForInvoice = {
  worksheetId: string;
  taskId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  title: string;
  description: string;
  remarks: string;
  status: string;
  hours_spent: number;
  clientId?: string;
  clientName?: string;
};

const ClientTaskFilterPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [tasks, setTasks] = useState<TaskForInvoice[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [clientData, employeeData] = await Promise.all([fetchClients(), fetchEmployees()]);
        setClients(Array.isArray(clientData) ? clientData : []);
        setEmployees(Array.isArray(employeeData) ? employeeData : []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load options");
      }
    };
    void loadOptions();
  }, []);

  useEffect(() => {
    const loadTasks = async () => {
      if (!clients.length) {
        setTasks([]);
        setSelectedTasks({});
        return;
      }




      
      setIsLoading(true);
      try {
        if (selectedClient === "all") {
          const activeClients = clients.filter((client) => client.status !== "Inactive");
          const taskGroups = await Promise.all(
            activeClients.map((client) =>
              fetchClientTasksForInvoice(client._id, {
                startDate,
                endDate,
                employeeId: employeeFilter,
                status: statusFilter,
              }).catch(() => []),
            ),
          );

          const aggregated = taskGroups.flatMap((group, index) =>
            (Array.isArray(group) ? group : []).map((task: TaskForInvoice) => ({
              ...task,
              clientId: activeClients[index]._id,
              clientName: activeClients[index].name,
            })),
          );
          setTasks(aggregated);
        } else {
        const data = await fetchClientTasksForInvoice(selectedClient, {
            startDate,
            endDate,
            employeeId: employeeFilter,
            status: statusFilter,
          });
          const client = clients.find((c) => c._id === selectedClient);
          const enriched = (Array.isArray(data) ? data : []).map((task: TaskForInvoice) => ({
            ...task,
            clientId: selectedClient,
            clientName: client?.name,
          }));
          setTasks(enriched);
        }
        setSelectedTasks({});
      } catch (error) {
        console.error(error);
        toast.error("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };
    void loadTasks();
  }, [selectedClient, startDate, endDate, employeeFilter, statusFilter, clients]);

  const toggleTaskSelection = (taskKey: string) => {
    if (selectedClient === "all") {
      toast.info("Select a client to invoice tasks.");
      return;
    }
    setSelectedTasks((prev) => ({ ...prev, [taskKey]: !prev[taskKey] }));
  };

  const selectedTaskList = useMemo(
    () =>
      selectedClient !== "all"
        ? tasks.filter((task) => selectedTasks[`${task.worksheetId}|${task.taskId}`])
        : [],
    [tasks, selectedTasks, selectedClient],
  );

  const handleGenerateInvoice = async () => {
    if (!selectedClient) {
      toast.error("Select a client first.");
      return;
    }
    if (selectedTaskList.length === 0) {
      toast.error("Select at least one task.");
      return;
    }
    try {
      const invoice = await createInvoiceFromTasks({
        client_id: selectedClient,
        task_ids: selectedTaskList.map((task) => ({
          worksheetId: task.worksheetId,
          taskId: task.taskId,
        })),
      });
      toast.success("Invoice draft created.");
      navigate(`/admin/invoice/${invoice._id}`, { state: { invoiceId: invoice._id } });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to create invoice");
    }
  };

  const selectedClientObj =
    selectedClient !== "all" ? clients.find((client) => client._id === selectedClient) : undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 flex-1 min-w-[220px]">
              <label className="text-sm font-medium text-muted-foreground">Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {clients
                    .filter((client) => client.status !== "Inactive")
                    .map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground">Employee</label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1 min-w-[180px]">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="reopened">Reopened</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full md:w-[200px]">
              <label className="text-sm font-medium text-muted-foreground">Start date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2 w-full md:w-[200px]">
              <label className="text-sm font-medium text-muted-foreground">End date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[180px] flex items-end justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setEmployeeFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
          {selectedClient !== "all" && selectedClientObj && (
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                variant="link"
                size="sm"
                onClick={() =>
                  navigate(`/admin/client/${selectedClient}/invoices`, {
                    state: { clientName: selectedClientObj?.name },
                  })
                }
              >
                View invoices for {selectedClientObj?.name}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Tasks ({tasks.length})</CardTitle>
            <div className="flex gap-2 items-center">
              <Badge variant="secondary">{selectedTaskList.length} selected</Badge>
              <Button
                onClick={handleGenerateInvoice}
                disabled={selectedTaskList.length === 0 || selectedClient === "all"}
              >
                Generate Invoice
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-6">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              {selectedClient !== "all" ? "No tasks found for selected filters" : "No tasks available"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  {selectedClient === "all" && <TableHead>Client</TableHead>}
                  <TableHead>Employee</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const key = `${task.worksheetId}|${task.taskId}`;
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <Checkbox
                          checked={Boolean(selectedTasks[key])}
                          onCheckedChange={() => toggleTaskSelection(key)}
                          disabled={selectedClient === "all"}
                        />
                      </TableCell>
                      {selectedClient === "all" && (
                        <TableCell>
                          <p className="font-medium">{task.clientName || "—"}</p>
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{task.employeeId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{task.hours_spent.toFixed(2)}</TableCell>
                      <TableCell>{task.date ? new Date(task.date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.status}</Badge>
                      </TableCell>
                      <TableCell>{task.remarks || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientTaskFilterPage;


