import { useMemo } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, CalendarCheck, Clock3, CalendarDays, CalendarClock, UserCircle, LifeBuoy, LogOut, Bell, Search, Power, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
};

const primaryNav: NavItem[] = [
  { label: "Dashboard", to: "/employee", icon: LayoutDashboard, end: true },
  { label: "Leave", to: "/employee/leave", icon: CalendarCheck },
  { label: "Attendance", to: "/employee/attendance", icon: Clock3 },
  { label: "Work Sheet", to: "/employee/worksheet", icon: FileText },
];

const masterNav: NavItem[] = [
  { label: "Holidays", to: "/employee/master/holidays", icon: CalendarDays },
  { label: "Events", to: "/employee/master/events", icon: CalendarClock },
  { label: "Profile", to: "/employee/master/profile", icon: UserCircle },
];

export const EmployeeShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = useMemo(() => {
    const base = user?.name ?? "Employee";
    return base
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 3)
      .padEnd(2, "E");
  }, [user?.name]);

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-3 border-b px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold uppercase">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-foreground">
                {user?.name ?? "Employee"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email ?? "employee@company.com"}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          <NavGroup title="Menu" items={primaryNav} />
          <NavGroup title="Master" items={masterNav} />
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-2.5 px-3 py-3 md:flex-row md:items-center md:justify-between md:px-5">
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="w-72 pl-10" placeholder="Search people, requests, or documents" />
              </div>
              <Badge variant="secondary" className="md:hidden">
                {primaryNav.find((item) => location.pathname.startsWith(item.to))?.label ?? "Menu"}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-full">
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden sm:inline-flex"
                onClick={handleLogout}
              >
                <Power className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="sm:hidden"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <Power className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-slate-50/60 dark:bg-slate-950/60">
          <div className="mx-auto w-full max-w-7xl px-3 py-6 md:px-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const NavGroup = ({ title, items }: { title: string; items: NavItem[] }) => (
  <div className="space-y-2">
    <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {title}
    </p>
    <div className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
              "text-muted-foreground hover:bg-primary/10 hover:text-primary",
              isActive && "bg-primary text-primary-foreground shadow-sm"
            )
          }
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  </div>
);

