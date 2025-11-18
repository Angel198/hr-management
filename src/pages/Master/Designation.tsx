import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { useDesignations, type Designation } from "@/contexts/DesignationContext";

export default function Designation() {
  const {
    designations,
    isLoading,
    error,
    addDesignation,
    updateDesignation,
    deleteDesignation,
  } = useDesignations();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const sortedDesignations = useMemo(
    () =>
      [...designations].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [designations]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDesignation(editingId, { name: formData.name });
        toast.success("Designation updated successfully!");
      } else {
        await addDesignation({ name: formData.name });
        toast.success("Designation added successfully!");
      }
      setIsOpen(false);
      setFormData({ name: "" });
      setEditingId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save designation. Please try again."
      );
    }
  };

  const handleEdit = (designation: Designation) => {
    setFormData({ name: designation.name });
    setEditingId(designation.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDesignation(id);
      toast.success("Designation deleted successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete designation. Please try again."
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Designation Master</h1>
          <p className="text-muted-foreground mt-1">Manage job designations and roles</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "" });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Designation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Designation</DialogTitle>
              <DialogDescription>
                {editingId ? "Update" : "Create a new"} designation entry
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Designation Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingId ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Designation Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  Loading designations...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : sortedDesignations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  No designations found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              sortedDesignations.map((designation) => (
                <TableRow key={designation.id}>
                  <TableCell className="font-medium">{designation.name}</TableCell>
                  <TableCell>{designation.department ?? "General"}</TableCell>
                  <TableCell>
                    {new Date(designation.createdAt).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(designation)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(designation.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
