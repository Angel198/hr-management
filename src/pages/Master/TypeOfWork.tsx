import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  fetchTypesOfWork,
  createTypeOfWork,
  updateTypeOfWork,
  deleteTypeOfWork,
} from "@/lib/api";

type TypeOfWork = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  category: "Development" | "Design" | "Testing" | "Support" | "Consulting" | "Other";
  status: "Active" | "Inactive";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

const categoryColors = {
  Development: "bg-blue-100 text-blue-700",
  Design: "bg-purple-100 text-purple-700",
  Testing: "bg-yellow-100 text-yellow-700",
  Support: "bg-green-100 text-green-700",
  Consulting: "bg-orange-100 text-orange-700",
  Other: "bg-gray-100 text-gray-700",
};

export default function TypeOfWork() {
  const [typesOfWork, setTypesOfWork] = useState<TypeOfWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    category: "Other" as TypeOfWork["category"],
    status: "Active" as "Active" | "Inactive",
    notes: "",
  });

  useEffect(() => {
    loadTypesOfWork();
  }, []);

  const loadTypesOfWork = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTypesOfWork();
      setTypesOfWork(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading types of work:", error);
      toast.error("Failed to load types of work");
      setTypesOfWork([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTypesOfWork = useMemo(() => {
    if (!searchTerm.trim()) return typesOfWork;
    const term = searchTerm.toLowerCase();
    return typesOfWork.filter(
      (type) =>
        type.name.toLowerCase().includes(term) ||
        type.code.toLowerCase().includes(term) ||
        type.description?.toLowerCase().includes(term) ||
        type.category.toLowerCase().includes(term)
    );
  }, [typesOfWork, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTypeOfWork(editingId, formData);
        toast.success("Type of work updated successfully!");
      } else {
        await createTypeOfWork(formData);
        toast.success("Type of work added successfully!");
      }
      setIsOpen(false);
      setFormData({
        name: "",
        code: "",
        description: "",
        category: "Other",
        status: "Active",
        notes: "",
      });
      setEditingId(null);
      loadTypesOfWork();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save type of work. Please try again."
      );
    }
  };

  const handleEdit = (typeOfWork: TypeOfWork) => {
    setFormData({
      name: typeOfWork.name,
      code: typeOfWork.code,
      description: typeOfWork.description || "",
      category: typeOfWork.category,
      status: typeOfWork.status,
      notes: typeOfWork.notes || "",
    });
    setEditingId(typeOfWork._id);
    setIsOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTypeOfWork(deleteId);
      toast.success("Type of work deleted successfully!");
      setDeleteId(null);
      loadTypesOfWork();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete type of work. Please try again."
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Type of Work Master</h1>
          <p className="text-muted-foreground mt-1">Manage different types of work and categories</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: "",
                  code: "",
                  description: "",
                  category: "Other",
                  status: "Active",
                  notes: "",
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Type of Work
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Type of Work" : "Add New Type of Work"}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update type of work information"
                  : "Enter details to add a new type of work"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    placeholder="e.g., TOW001"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: TypeOfWork["category"]) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Testing">Testing</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Active" | "Inactive") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Update" : "Add"} Type of Work</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search types of work..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading types of work...</div>
      ) : filteredTypesOfWork.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? "No types of work found matching your search" : "No types of work added yet"}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypesOfWork.map((type) => (
                <TableRow key={type._id}>
                  <TableCell className="font-medium">{type.code}</TableCell>
                  <TableCell>{type.name}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {type.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={categoryColors[type.category]}>
                      {type.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.status === "Active" ? "default" : "secondary"}>
                      {type.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(type)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(type._id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the type of work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

