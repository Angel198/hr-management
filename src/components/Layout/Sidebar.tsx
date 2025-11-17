import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  Settings,
  ChevronDown,
  Target,
  CalendarDays,
  CalendarClock,
  Bell,
  FileText,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/employees", icon: Users, label: "Employees" },
  { to: "/admin/attendance", icon: Clock, label: "Attendance" },
  { to: "/admin/leave", icon: Calendar, label: "Leave Management" },
  { to: "/admin/worksheets", icon: FileText, label: "Work Sheets" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
] as const;

const masterItems = [
  { to: "/admin/master/designation", icon: Target, label: "Designation" },
  { to: "/admin/master/holidays", icon: CalendarDays, label: "Holidays" },
  { to: "/admin/master/events", icon: CalendarClock, label: "Events" },
  { to: "/admin/master/clients", icon: Users, label: "Clients" },
  { to: "/admin/master/type-of-work", icon: Briefcase, label: "Type of Work" },
  { to: "/admin/master/notifications", icon: Bell, label: "Notifications" },
] as const;

export const Sidebar = () => {
  const [isMasterOpen, setIsMasterOpen] = useState(true);
  const { user } = useAuth();

  const initials = useMemo(() => {
    if (!user?.name) {
      return "HR";
    }
    return user.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 3)
      .padEnd(2, "R");
  }, [user?.name]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-sidebar-foreground">HRMS</h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">Human Resource Management</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-6 py-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                isActive && "bg-sidebar-accent text-sidebar-primary font-medium"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <Collapsible open={isMasterOpen} onOpenChange={setIsMasterOpen} className="mt-2">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-6 py-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5" />
              <span>Master</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isMasterOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            {masterItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 pl-14 pr-6 py-2.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors",
                    isActive && "bg-sidebar-accent/50 text-sidebar-primary font-medium"
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </nav>
      
      <div className="p-6 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-sidebar-accent text-sidebar-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">{user?.name ?? "HR Admin"}</p>
            <p className="text-xs text-sidebar-foreground/60">{user?.email ?? "admin@company.com"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
