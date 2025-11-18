import { FormEvent, useEffect, useState } from "react";
import { type Location, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { employeeLogin } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

const ADMIN_USERS = [
  {
    email: "shruti@gvmtechnologies.com",
    password: "Shruti@123",
    name: "Shruti GVM",
  },
];

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const { login, isAuthenticated, user } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const target = user.role === "admin" ? "/admin" : "/employee";
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      toast.error("Please enter your credentials.");
      return;
    }

    setIsLoading(true);
    const trimmedIdentifier = identifier.trim();
    const normalizedIdentifier = trimmedIdentifier.toLowerCase();

    try {
      const admin = ADMIN_USERS.find(
        (candidate) => candidate.email.toLowerCase() === normalizedIdentifier
      );

      if (admin) {
        if (password !== admin.password) {
          toast.error("Incorrect password.");
          return;
        }

        login({
          email: admin.email,
          name: admin.name,
          role: "admin",
        });

        toast.success("Welcome back, Shruti!");
        const redirectPath =
          (location.state?.from as Location | undefined)?.pathname ?? "/admin";
        navigate(redirectPath, { replace: true });
        return;
      }

      if (!trimmedIdentifier.includes("@")) {
        toast.error("Please enter a valid company email.");
        return;
      }

      try {
        const employee = await employeeLogin({
          email: trimmedIdentifier,
          password,
        });

        login({
          email: employee.email,
          name: employee.name,
          role: "employee",
          employeeId: employee.id,
        });

        toast.success(`Welcome back, ${employee.name.split(" ")[0]}!`);
        const redirectPath =
          (location.state?.from as Location | undefined)?.pathname ?? "/employee";
        navigate(redirectPath, { replace: true });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to sign in. Please try again.";
        toast.error(message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary">HR</span>
          </div>
          <CardTitle className="text-2xl font-bold">Sign in to HRMS</CardTitle>
          <CardDescription>
            Admins use the admin email. Employees sign in with their company email and the password
            shared by HR.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email</Label>
              <Input
                id="identifier"
                placeholder="name@company.com"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <a href="#" className="text-primary hover:underline">
              Forgot password?
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
