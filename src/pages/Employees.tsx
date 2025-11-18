import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Filter,
  Download,
  Mail,
  Phone,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { useDesignations } from "@/contexts/DesignationContext";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "@/lib/api";
import { format } from "date-fns";

type EmployeeStatus = "Active" | "On Leave" | "Inactive";

type Employee = {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  department: string;
  designation: string;
  status: EmployeeStatus;
  createdAt?: string;
  updatedAt?: string;
};

const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const PASSWORD_REQUIREMENTS =
  "At least 8 characters, including uppercase, lowercase, number, and symbol.";

const STATUS_BADGE_VARIANT: Record<EmployeeStatus, "default" | "secondary" | "destructive"> = {
  Active: "default",
  "On Leave": "secondary",
  Inactive: "destructive",
};

const EMPTY_FORM: Employee = {
  id: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  department: "",
  designation: "",
  status: "Active",
};

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Employee>(EMPTY_FORM);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const { designations, isLoading: designationsLoading } = useDesignations();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [designationFilter, setDesignationFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const designationOptions = useMemo(
    () =>
      designations
        .map((designation) => designation.name)
        .filter((value, index, array) => array.indexOf(value) === index),
    [designations]
  );
  const combinedDesignationOptions = useMemo(() => {
    const values = new Set(designationOptions);
    if (formData.designation) {
      values.add(formData.designation);
    }
    return Array.from(values).filter(Boolean);
  }, [designationOptions, formData.designation]);

  const departmentOptions = useMemo(() => {
    const values = new Set<string>();
    employees.forEach((emp) => {
      if (emp.department) {
        values.add(emp.department);
      }
    });
    return Array.from(values);
  }, [employees]);

  const designationFilterOptions = useMemo(() => {
    const values = new Set<string>();
    employees.forEach((emp) => {
      if (emp.designation) {
        values.add(emp.designation);
      }
    });
    return Array.from(values);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch =
        !term ||
        emp.name.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.id.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term) ||
        emp.designation.toLowerCase().includes(term);
      const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;
      const matchesDesignation = designationFilter === "all" || emp.designation === designationFilter;
      return matchesSearch && matchesDepartment && matchesDesignation;
    });
  }, [employees, searchTerm, departmentFilter, designationFilter]);

  const resetForm = () => {
    setFormData({
      ...EMPTY_FORM,
      designation: designationOptions[0] ?? "",
    });
    setEditingEmployeeId(null);
    setShowPassword(false);
  };

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchEmployees();
        setEmployees(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load employees");
      } finally {
        setIsLoading(false);
      }
    };

    void loadEmployees();
  }, []);

  useEffect(() => {
    if (editingEmployeeId) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      designation: designationOptions[0] ?? "",
    }));
  }, [designationOptions, editingEmployeeId]);

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setFormData({ ...employee, password: "" });
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const handleInputChange = <K extends keyof Employee>(key: K, value: Employee[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedData: Employee = {
      ...formData,
      id: formData.id.trim(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password?.trim(),
      phone: formData.phone.trim(),
      department: formData.department.trim(),
      designation: formData.designation.trim(),
    };

    if (
      !trimmedData.id ||
      !trimmedData.name ||
      !trimmedData.email ||
      !trimmedData.phone ||
      !trimmedData.department ||
      !trimmedData.designation
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!editingEmployeeId) {
      if (!trimmedData.password || trimmedData.password.length < MIN_PASSWORD_LENGTH) {
        toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
      if (!PASSWORD_PATTERN.test(trimmedData.password)) {
        toast.error(PASSWORD_REQUIREMENTS);
        return;
      }
    } else if (trimmedData.password) {
      if (trimmedData.password.length < MIN_PASSWORD_LENGTH) {
        toast.error(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }
      if (!PASSWORD_PATTERN.test(trimmedData.password)) {
        toast.error(PASSWORD_REQUIREMENTS);
        return;
      }
    }

    const normalizedPhone = trimmedData.phone.replace(/[\s-]/g, "");
    if (!normalizedPhone.startsWith("+")) {
      toast.error("Phone number must include the country code, e.g. +91 9876543210.");
      return;
    }
    const phoneDigits = normalizedPhone.slice(1);
    if (!/^\d+$/.test(phoneDigits)) {
      toast.error("Phone number can contain only digits (besides the leading +).");
      return;
    }
    if (phoneDigits.length < 11) {
      toast.error("Phone number must include country code plus 10-digit number.");
      return;
    }
    const localNumber = phoneDigits.slice(-10);
    const countryCode = phoneDigits.slice(0, phoneDigits.length - 10);
    if (localNumber.length !== 10 || countryCode.length === 0 || countryCode.length > 3) {
      toast.error("Enter phone as +<country code><10-digit number>.");
      return;
    }
    trimmedData.phone = `+${countryCode}${localNumber}`;

    if (editingEmployeeId && !trimmedData.password) {
      delete trimmedData.password;
    }

    const submit = async () => {
      try {
        if (editingEmployeeId) {
          const updated = await updateEmployee(editingEmployeeId, trimmedData);
          setEmployees((prev) =>
            prev.map((emp) => (emp.id === editingEmployeeId ? updated : emp))
          );
          toast.success("Employee details updated successfully.");
        } else {
          const created = await createEmployee(trimmedData);
          setEmployees((prev) => [created, ...prev]);
          toast.success("Employee added successfully. Credentials emailed to them.");
        }
        closeDialog();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save employee.");
      }
    };

    void submit();
  };

  const confirmDelete = () => {
    if (!employeeToDelete) {
      return;
    }

    const deletedName = employeeToDelete.name;
    const performDelete = async () => {
      try {
        await deleteEmployee(employeeToDelete.id);
        setEmployees((prev) => prev.filter((emp) => emp.id !== employeeToDelete.id));
        toast.success(`Removed ${deletedName} from the directory.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete employee.");
      } finally {
        setEmployeeToDelete(null);
      }
    };

    void performDelete();
  };

  const activeFilters =
    (departmentFilter !== "all" ? 1 : 0) + (designationFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setDepartmentFilter("all");
    setDesignationFilter("all");
  };

  const buildExportRows = () => {
    const data =
      searchTerm.trim() === "" && departmentFilter === "all" && designationFilter === "all"
        ? employees
        : filteredEmployees;
    return data.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      status: emp.status,
      createdAt: emp.createdAt ? format(new Date(emp.createdAt), "yyyy-MM-dd HH:mm") : "",
      updatedAt: emp.updatedAt ? format(new Date(emp.updatedAt), "yyyy-MM-dd HH:mm") : "",
    }));
  };

  const handleExport = () => {
    const rows = buildExportRows();
    if (rows.length === 0) {
      toast.info("No employees available to export.");
      return;
    }

    const headers = [
      "Employee ID",
      "Name",
      "Email",
      "Phone",
      "Department",
      "Designation",
      "Status",
      "Created At",
      "Updated At",
    ];
    const escapeValue = (value: string) =>
      `"${(value ?? "").toString().replace(/"/g, '""')}"`;

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        [
          escapeValue(row.id),
          escapeValue(row.name),
          escapeValue(row.email),
          escapeValue(row.phone),
          escapeValue(row.department),
          escapeValue(row.designation),
          escapeValue(row.status),
          escapeValue(row.createdAt),
          escapeValue(row.updatedAt),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
    link.download = `employee_directory_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} employee${rows.length > 1 ? "s" : ""}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-2">Manage your organization's workforce</p>
        </div>
        <Button
          className="gap-2"
          onClick={openCreateDialog}
          disabled={designationsLoading && designationOptions.length === 0}
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or department..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {activeFilters > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{activeFilters} filter{activeFilters > 1 ? "s" : ""} active</Badge>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear
            </Button>
          </div>
        )}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Employees</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                <Select
                  value={departmentFilter}
                  onValueChange={(value) => setDepartmentFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Designation</Label>
                <Select
                  value={designationFilter}
                  onValueChange={(value) => setDesignationFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Designations</SelectItem>
                    {designationFilterOptions.map((designation) => (
                      <SelectItem key={designation} value={designation}>
                        {designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter className="mt-6 gap-3">
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
              <Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Directory ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                    Loading employees...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                    No employees found. Try adjusting your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold uppercase">
                            {employee.name
                              .split(" ")
                              .filter(Boolean)
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 3)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{employee.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{employee.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[employee.status]}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(employee)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEmployeeToDelete(employee)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingEmployeeId ? "Edit Employee" : "Add Employee"}</DialogTitle>
            <DialogDescription>
              {editingEmployeeId ? "Update the employee details and save your changes." : "Enter the details below to add a new employee to the directory."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employee-id">Employee ID</Label>
                  <Input
                    id="employee-id"
                    value={formData.id}
                    onChange={(event) => handleInputChange("id", event.target.value)}
                    placeholder="EMP009"
                    required
                    disabled={!!editingEmployeeId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-name">Full Name</Label>
                  <Input
                    id="employee-name"
                    value={formData.name}
                    onChange={(event) => handleInputChange("name", event.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="employee-email">Email</Label>
                  <Input
                    id="employee-email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleInputChange("email", event.target.value)}
                    placeholder="jane.doe@company.com"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="employee-password">
                    {editingEmployeeId ? "Reset Password" : "Temporary Password"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="employee-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.password ?? ""}
                      onChange={(event) => handleInputChange("password", event.target.value)}
                      placeholder="Set a secure password"
                      required={!editingEmployeeId}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {editingEmployeeId
                      ? "Leave blank to keep the current password."
                      : "The employee will receive this password via email along with the login link."}
                  </p>
                  <p className="text-xs text-muted-foreground">{PASSWORD_REQUIREMENTS}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-phone">Phone</Label>
                  <Input
                    id="employee-phone"
                    value={formData.phone}
                    onChange={(event) => handleInputChange("phone", event.target.value)}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-department">Department</Label>
                  <Input
                    id="employee-department"
                    value={formData.department}
                    onChange={(event) => handleInputChange("department", event.target.value)}
                    placeholder="Engineering"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Select
                    value={formData.designation}
                    onValueChange={(value) => handleInputChange("designation", value)}
                    disabled={!combinedDesignationOptions.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {combinedDesignationOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!combinedDesignationOptions.length && (
                    <p className="text-xs text-muted-foreground">
                      Add designations in the master to populate this list.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: EmployeeStatus) => handleInputChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingEmployeeId ? "Save Changes" : "Add Employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!employeeToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setEmployeeToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to remove{" "}
              <span className="font-medium">
                {employeeToDelete?.name ?? "this employee"}
              </span>{" "}
              from the directory?
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

export default Employees;
