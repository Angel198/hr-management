import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAttendance } from "@/lib/api";

export const AdminShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.name ?? "Admin")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  useEffect(() => {
    if (!user || user.role !== "admin") {
      return;
    }

    const cacheKey = "adminAttendancePrefetch";
    const today = new Date().toISOString().split("T")[0];

    const hasFreshCache = () => {
      if (typeof window === "undefined") {
        return false;
      }
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) {
        return false;
      }
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === today && Array.isArray(parsed.data)) {
          const fetchedAtMs = parsed.fetchedAt ? new Date(parsed.fetchedAt).getTime() : 0;
          const staleThreshold = Date.now() - 5 * 60 * 1000; // 5 minutes
          return fetchedAtMs > staleThreshold;
        }
      } catch (error) {
        console.warn("Unable to parse cached admin attendance", error);
      }
      return false;
    };

    if (hasFreshCache()) {
      return;
    }

    const prefetchAttendance = async () => {
      try {
        const data = await fetchAttendance({ date: today });
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              date: today,
              data,
              fetchedAt: new Date().toISOString(),
            }),
          );
        }
        console.log(`Prefetched ${Array.isArray(data) ? data.length : 0} attendance records for ${today}`);
      } catch (error) {
        console.warn("Failed to prefetch admin attendance data:", error);
      }
    };

    void prefetchAttendance();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <header className="sticky top-0 z-20 border-b bg-background">
          <div className="flex items-center justify-end gap-3 px-6 py-4">
            <div className="hidden sm:flex flex-col text-right leading-tight">
              <span className="text-sm font-semibold text-foreground">
                {user?.name ?? "HR Admin"}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.email ?? "admin@company.com"}
              </span>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold uppercase">
                {initials || "A"}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <Button variant="outline" size="icon" className="sm:hidden" onClick={handleLogout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

