import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import LeaveManagement from "./pages/LeaveManagement";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Designation from "./pages/Master/Designation";
import Holidays from "./pages/Master/Holidays";
import Events from "./pages/Master/Events";
import Notifications from "./pages/Master/Notifications";
import Client from "./pages/Master/Client";
import TypeOfWork from "./pages/Master/TypeOfWork";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import { DollarSign, Settings } from "lucide-react";
import { AuthProvider, useAuth, UserRole } from "@/contexts/AuthContext";
import { DesignationProvider } from "@/contexts/DesignationContext";
import { AdminShell } from "@/components/Layout/AdminShell";
import { EmployeeShell } from "@/components/Layout/EmployeeShell";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import EmployeeLeave from "@/pages/employee/Leave";
import EmployeeAttendance from "@/pages/employee/Attendance";
import EmployeeSupport from "@/pages/employee/Support";
import EmployeeHolidays from "@/pages/employee/master/Holidays";
import EmployeeEvents from "@/pages/employee/master/Events";
import EmployeeProfile from "@/pages/employee/master/Profile";
import EmployeeWorksheet from "@/pages/employee/Worksheet";
import Worksheets from "@/pages/Worksheets";
import ClientTaskFilterPage from "@/pages/admin/ClientTaskFilter";
import InvoiceEditorPage from "@/pages/admin/InvoiceEditor";
import ClientInvoicesPage from "@/pages/admin/ClientInvoices";

const queryClient = new QueryClient();

const RequireAuth = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const fallback = user.role === "admin" ? "/admin" : "/employee";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/reset-password" element={<ResetPassword />} />

    <Route element={<RequireAuth allowedRoles={["admin"]} />}>
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<LeaveManagement />} />
        <Route path="worksheets" element={<Worksheets />} />
        <Route path="tasks/client-filter" element={<ClientTaskFilterPage />} />
        <Route path="invoice/:invoiceId" element={<InvoiceEditorPage />} />
        <Route path="client/:clientId/invoices" element={<ClientInvoicesPage />} />
        <Route
          path="payroll"
          element={
            <ComingSoon
              title="Payroll Management"
              description="Manage salary, bonuses, and payroll processing"
              icon={DollarSign}
            />
          }
        />
        <Route path="master">
          <Route path="designation" element={<Designation />} />
          <Route path="holidays" element={<Holidays />} />
          <Route path="events" element={<Events />} />
          <Route path="clients" element={<Client />} />
          <Route path="type-of-work" element={<TypeOfWork />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
        <Route
          path="settings"
          element={
            <ComingSoon
              title="Settings"
              description="Configure system settings and preferences"
              icon={Settings}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>

    <Route element={<RequireAuth allowedRoles={["employee"]} />}>
      <Route path="/employee" element={<EmployeeShell />}>
        <Route index element={<EmployeeDashboard />} />
        <Route path="leave" element={<EmployeeLeave />} />
        <Route path="attendance" element={<EmployeeAttendance />} />
        <Route path="worksheet" element={<EmployeeWorksheet />} />
        <Route path="support" element={<EmployeeSupport />} />
        <Route path="master">
          <Route path="holidays" element={<EmployeeHolidays />} />
          <Route path="events" element={<EmployeeEvents />} />
          <Route path="profile" element={<EmployeeProfile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>

    <Route path="/" element={<Navigate to="/auth" replace />} />
    <Route path="*" element={<Navigate to="/auth" replace />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DesignationProvider>
            <AppRoutes />
          </DesignationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
