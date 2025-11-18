import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchEvents, createEvent, updateEvent, deleteEvent } from "@/lib/api";

type Event = {
  _id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  status: "upcoming" | "ongoing" | "completed";
};

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    date: string;
    location: string;
    description: string;
    status: "upcoming" | "ongoing" | "completed";
  }>({
    name: "",
    date: "",
    location: "",
    description: "",
    status: "upcoming",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };
    void loadEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateEvent(editingId, formData);
        setEvents((prev) =>
          prev.map((ev) => (ev._id === editingId ? { ...ev, ...formData } : ev))
        );
        toast.success("Event updated successfully!");
      } else {
        const newEvent = await createEvent(formData);
        setEvents((prev) => [...prev, newEvent]);
        toast.success("Event added successfully!");
      }
      setIsOpen(false);
      setFormData({ name: "", date: "", location: "", description: "", status: "upcoming" });
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save event");
    }
  };

  const handleEdit = (event: Event) => {
    setFormData({
      name: event.name,
      date: new Date(event.date).toISOString().split("T")[0],
      location: event.location,
      description: event.description,
      status: event.status,
    });
    setEditingId(event._id);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((ev) => ev._id !== id));
      toast.success("Event deleted successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500/10 text-blue-500";
      case "ongoing":
        return "bg-green-500/10 text-green-500";
      case "completed":
        return "bg-muted text-muted-foreground";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events Master</h1>
          <p className="text-muted-foreground mt-1">Manage company events and activities</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: "", date: "", location: "", description: "", status: "upcoming" });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Event</DialogTitle>
              <DialogDescription>
                {editingId ? "Update" : "Create a new"} event entry
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name</Label>
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              <TableHead>Event Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell className="max-w-xs truncate">{event.description}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(event._id)}>
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
