import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Phone, MapPin, IdCard, Building } from "lucide-react";
import { fetchEmployee, fetchEmployees } from "@/lib/api";
import { toast } from "sonner";

// Professional details will be computed from employee data

const contactDetails = [
  { label: "Primary Email", value: "employee@company.com", icon: Mail },
  { label: "Alternate Email", value: "me.personal@email.com", icon: Mail },
  { label: "Mobile Number", value: "+91 98765 43210", icon: Phone },
] as const;

type Employee = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  [key: string]: unknown;
};

const Profile = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string>("");

  useEffect(() => {
    const getEmployeeData = async () => {
      if (user?.employeeId) {
        setEmployeeId(user.employeeId);
      } else if (user?.email) {
        try {
          const employees = await fetchEmployees();
          const emp = employees.find((e: { email: string }) => e.email.toLowerCase() === user.email.toLowerCase());
          if (emp) {
            setEmployeeId(emp.id);
          }
        } catch (err) {
          console.error("Failed to fetch employee ID", err);
        }
      }
    };
    void getEmployeeData();
  }, [user]);

  useEffect(() => {
    const loadEmployee = async () => {
      if (!employeeId) return;
      setIsLoading(true);
      try {
        const data = await fetchEmployee(employeeId);
        setEmployee(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load employee data");
      } finally {
        setIsLoading(false);
      }
    };
    void loadEmployee();
  }, [employeeId]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary/15 text-primary font-semibold uppercase text-xl">
            {user?.name
              ?.split(" ")
              .filter(Boolean)
              .map((part) => part[0])
              .join("")
              .slice(0, 2) ?? "EM"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user?.name ?? "Employee Name"}</h1>
          <p className="text-sm text-muted-foreground">
            Update your personal details, contact preferences, and HR documents.
          </p>
        </div>
        <Badge variant="outline" className="ml-auto">
          Self Service
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Keep your contact and address details current.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input defaultValue={employee?.name || user?.name ?? "Employee Name"} />
              </div>
              <div className="space-y-2">
                <Label>Preferred Name</Label>
                <Input defaultValue={employee?.name?.split(" ")[0] || user?.name?.split(" ")[0] ?? "Employee"} />
              </div>
              <div className="space-y-2">
                <Label>Primary Email</Label>
                <Input type="email" defaultValue={employee?.email || user?.email ?? "employee@company.com"} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input defaultValue={employee?.phone || "+91 98765 43210"} />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Home Address</Label>
                <Input defaultValue="221B Residency Chambers, MG Road" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input defaultValue="Bengaluru" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input defaultValue="Karnataka" />
              </div>
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input defaultValue="560001" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Save changes</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2">
                <IdCard className="h-4 w-4 text-primary" />
                <div className="flex flex-1 flex-col">
                  <span className="text-xs uppercase text-muted-foreground">Employee ID</span>
                  <span className="text-sm font-medium text-foreground">{employee?.id || employeeId || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2">
                <Building className="h-4 w-4 text-primary" />
                <div className="flex flex-1 flex-col">
                  <span className="text-xs uppercase text-muted-foreground">Department</span>
                  <span className="text-sm font-medium text-foreground">{employee?.department || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2">
                <Building className="h-4 w-4 text-primary" />
                <div className="flex flex-1 flex-col">
                  <span className="text-xs uppercase text-muted-foreground">Designation</span>
                  <span className="text-sm font-medium text-foreground">{employee?.designation || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2">
                <MapPin className="h-4 w-4 text-primary" />
                <div className="flex flex-1 flex-col">
                  <span className="text-xs uppercase text-muted-foreground">Location</span>
                  <span className="text-sm font-medium text-foreground">{employee?.location || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Contact Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contactDetails.map((detail) => (
                <div key={detail.label} className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2">
                  <detail.icon className="h-4 w-4 text-primary" />
                  <div className="flex flex-1 flex-col">
                    <span className="text-xs uppercase text-muted-foreground">{detail.label}</span>
                    <span className="text-sm font-medium text-foreground">{detail.value}</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                    Update
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const emergencyContacts = [
  {
    name: "Anita Sharma",
    relation: "Spouse",
    phone: "+91 98765 43210",
    email: "anita.sharma@example.com",
  },
  {
    name: "Rohit Sharma",
    relation: "Brother",
    phone: "+91 99887 66554",
    email: "rohit.sharma@example.com",
  },
] as const;

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [phone, setPhone] = useState("+91 98765 11123");
  const [location, setLocation] = useState("Bengaluru, India");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Profile & Preferences</h2>
        <p className="text-muted-foreground">
          Review personal details, update contact information, and manage preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground tracking-wide">Full name</p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {user?.name ?? "Employee"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground tracking-wide">Email</p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {user?.email ?? "employee@company.com"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground tracking-wide">Employee ID</p>
                <p className="mt-1 text-base font-medium text-foreground">EMP-2749</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground tracking-wide">Department</p>
                <p className="mt-1 text-base font-medium text-foreground">Product Design</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground tracking-wide">Primary phone</p>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground tracking-wide">Location</p>
                <Input value={location} onChange={(event) => setLocation(event.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Design System Guild</Badge>
              <Badge variant="outline">Hybrid Worker</Badge>
              <Badge variant="outline">Mentor</Badge>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save changes</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Manager</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="text-base font-semibold text-foreground">Aisha Rahman</p>
              <p>Director, Product Experience</p>
              <p>aisha.rahman@company.com</p>
              <p>+91 99887 66554</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Emergency contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {emergencyContacts.map((contact) => (
                <div key={contact.email} className="rounded-lg border border-border/60 p-3 text-sm">
                  <p className="font-semibold text-foreground">{contact.name}</p>
                  <p className="text-muted-foreground">{contact.relation}</p>
                  <p className="mt-2">{contact.phone}</p>
                  <p>{contact.email}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


