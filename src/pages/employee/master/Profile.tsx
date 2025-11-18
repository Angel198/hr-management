import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Phone, MapPin, IdCard, Building } from "lucide-react";

const professionalDetails = [
  { label: "Employee ID", value: "EMP-2749", icon: IdCard },
  { label: "Department", value: "Product Design", icon: Building },
  { label: "Designation", value: "Senior Product Designer", icon: Building },
  { label: "Location", value: "Bengaluru, India", icon: MapPin },
] as const;

const contactSummary = [
  { label: "Primary Email", value: "employee@company.com", icon: Mail },
  { label: "Alternate Email", value: "me.personal@email.com", icon: Mail },
  { label: "Mobile Number", value: "+91 98765 12345", icon: Phone },
] as const;

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold uppercase">
            {user?.name
              ?.split(" ")
              .filter(Boolean)
              .map((part) => part[0])
              .join("")
              .slice(0, 2) ?? "EM"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">{user?.name ?? "Employee Name"}</h2>
          <p className="text-sm text-muted-foreground">
            Update personal details, contact preferences, and professional information.
          </p>
          <Badge variant="outline" className="w-fit">
            Self Service
          </Badge>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>Keep your contact and address details current.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Full name" defaultValue={user?.name ?? "Employee Name"} />
              <FormField
                label="Preferred name"
                defaultValue={user?.name?.split(" ")[0] ?? "Employee"}
              />
              <FormField
                label="Primary email"
                type="email"
                defaultValue={user?.email ?? "employee@company.com"}
              />
              <PhoneNumberField defaultValue="+91 98765 12345" />
              <FormField label="Home address" defaultValue="221B Residency Chambers, MG Road" />
              <FormField label="City" defaultValue="Bengaluru" />
              <FormField label="State" defaultValue="Karnataka" />
              <FormField label="Postal code" defaultValue="560001" />
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save changes</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Professional details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {professionalDetails.map((detail) => (
                <div
                  key={detail.label}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
                >
                  <detail.icon className="h-4 w-4 text-primary" />
                  <div className="flex flex-1 flex-col">
                    <span className="text-xs uppercase text-muted-foreground">{detail.label}</span>
                    <span className="text-sm font-medium text-foreground">{detail.value}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Contact preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contactSummary.map((detail) => (
                <div
                  key={detail.label}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
                >
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

const FormField = ({
  label,
  defaultValue,
  type = "text",
}: {
  label: string;
  defaultValue: string;
  type?: string;
}) => (
  <div className="space-y-2">
    <Label className="text-xs uppercase text-muted-foreground tracking-wide">{label}</Label>
    <Input type={type} defaultValue={defaultValue} />
  </div>
);

const PhoneNumberField = ({ defaultValue }: { defaultValue: string }) => {
  const [phoneValue, setPhoneValue] = useState(defaultValue);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove all non-numeric characters except +
    value = value.replace(/[^\d+]/g, "");

    // Ensure it starts with +91
    if (!value.startsWith("+91")) {
      if (value.startsWith("+")) {
        // If it starts with + but not +91, keep only +
        value = "+91" + value.slice(1).replace(/\D/g, "");
      } else if (value.startsWith("91")) {
        // If it starts with 91, add +
        value = "+91" + value.slice(2).replace(/\D/g, "");
      } else {
        // Otherwise, add +91 prefix
        value = "+91" + value.replace(/\D/g, "");
      }
    }

    // Limit to +91 followed by exactly 10 digits
    const digitsAfterCode = value.slice(3).replace(/\D/g, "");
    if (digitsAfterCode.length > 10) {
      value = "+91" + digitsAfterCode.slice(0, 10);
    } else {
      value = "+91" + digitsAfterCode;
    }

    // Format: +91 XXXXX XXXXX (space after 5th digit)
    if (digitsAfterCode.length > 5) {
      value = "+91 " + digitsAfterCode.slice(0, 5) + " " + digitsAfterCode.slice(5);
    } else if (digitsAfterCode.length > 0) {
      value = "+91 " + digitsAfterCode;
    } else {
      value = "+91";
    }

    setPhoneValue(value);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase text-muted-foreground tracking-wide">Phone number</Label>
      <Input
        type="tel"
        value={phoneValue}
        onChange={handlePhoneChange}
        placeholder="+91 12345 67890"
        maxLength={15} // +91 + space + 5 digits + space + 5 digits = 15
      />
      {phoneValue.replace(/\D/g, "").length !== 13 && phoneValue.length > 3 && (
        <p className="text-xs text-destructive">
          Phone number must be 10 digits with country code +91
        </p>
      )}
    </div>
  );
};

export default Profile;

