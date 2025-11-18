import { useEffect, useState } from "react";
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
import { fetchHolidays, createHoliday, updateHoliday, deleteHoliday } from "@/lib/api";

type Holiday = {
  _id: string;
  name: string;
  date: string;
  day: string;
  type: string;
};

export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", date: "", type: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHolidays = async () => {
      setIsLoading(true);
      try {
        const data = await fetchHolidays();
        setHolidays(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load holidays");
      } finally {
        setIsLoading(false);
      }
    };
    void loadHolidays();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateHoliday(editingId, formData);
        setHolidays((prev) =>
          prev.map((h) =>
            h._id === editingId
              ? {
                  ...h,
                  name: formData.name,
                  date: formData.date,
                  type: formData.type,
                  day: new Date(formData.date).toLocaleDateString("en-US", { weekday: "long" }),
                }
              : h
          )
        );
        toast.success("Holiday updated successfully!");
      } else {
        const newHoliday = await createHoliday(formData);
        setHolidays((prev) => [...prev, newHoliday]);
        toast.success("Holiday added successfully!");
      }
      setIsOpen(false);
      setFormData({ name: "", date: "", type: "" });
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save holiday");
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setFormData({
      name: holiday.name,
      date: new Date(holiday.date).toISOString().split("T")[0],
      type: holiday.type,
    });
    setEditingId(holiday._id);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHoliday(id);
      setHolidays((prev) => prev.filter((h) => h._id !== id));
      toast.success("Holiday deleted successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete holiday");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading holidays...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Holiday Master</h1>
          <p className="text-muted-foreground mt-1">Manage company holidays and observances</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", date: "", type: "" });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Holiday</DialogTitle>
              <DialogDescription>
                {editingId ? "Update" : "Create a new"} holiday entry
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Holiday Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g., Public Holiday, Optional Holiday"
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
              <TableHead>Holiday Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No holidays found
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((holiday) => (
                <TableRow key={holiday._id}>
                  <TableCell className="font-medium">{holiday.name}</TableCell>
                  <TableCell>{new Date(holiday.date).toLocaleDateString()}</TableCell>
                  <TableCell>{holiday.day}</TableCell>
                  <TableCell>{holiday.type}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(holiday)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(holiday._id)}
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
