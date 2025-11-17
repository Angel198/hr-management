import { useState } from "react";
import { Plus, Pencil, Trash2, Bell } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "urgent";
  date: string;
  targetAudience: string;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: "1", 
      title: "System Maintenance", 
      message: "System will be under maintenance on Sunday 3 AM to 6 AM",
      type: "warning",
      date: "2024-11-10",
      targetAudience: "All Employees"
    },
    { 
      id: "2", 
      title: "Salary Credited", 
      message: "November salary has been credited to your account",
      type: "success",
      date: "2024-11-05",
      targetAudience: "All Employees"
    },
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    message: string;
    type: "info" | "warning" | "success" | "urgent";
    targetAudience: string;
  }>({ 
    title: "", 
    message: "", 
    type: "info",
    targetAudience: "All Employees"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setNotifications(notifications.map(n => 
        n.id === editingId ? { ...n, ...formData, date: new Date().toISOString().split('T')[0] } : n
      ));
      toast.success("Notification updated successfully!");
    } else {
      const newNotification: Notification = {
        id: Date.now().toString(),
        ...formData,
        date: new Date().toISOString().split('T')[0],
      };
      setNotifications([...notifications, newNotification]);
      toast.success("Notification added successfully!");
    }
    setIsOpen(false);
    setFormData({ title: "", message: "", type: "info", targetAudience: "All Employees" });
    setEditingId(null);
  };

  const handleEdit = (notification: Notification) => {
    setFormData({ 
      title: notification.title, 
      message: notification.message, 
      type: notification.type,
      targetAudience: notification.targetAudience
    });
    setEditingId(notification.id);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success("Notification deleted successfully!");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "info": return "bg-blue-500/10 text-blue-500";
      case "warning": return "bg-yellow-500/10 text-yellow-500";
      case "success": return "bg-green-500/10 text-green-500";
      case "urgent": return "bg-red-500/10 text-red-500";
      default: return "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications Master</h1>
          <p className="text-muted-foreground mt-1">Manage system notifications and announcements</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { 
              setEditingId(null); 
              setFormData({ title: "", message: "", type: "info", targetAudience: "All Employees" }); 
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Notification
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Notification</DialogTitle>
              <DialogDescription>
                {editingId ? "Update" : "Create a new"} notification entry
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
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
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    {notification.title}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                <TableCell>
                  <Badge className={getTypeColor(notification.type)}>
                    {notification.type}
                  </Badge>
                </TableCell>
                <TableCell>{notification.date}</TableCell>
                <TableCell>{notification.targetAudience}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(notification)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(notification.id)}
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
    </div>
  );
}
