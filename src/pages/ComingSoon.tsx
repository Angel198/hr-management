import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const ComingSoon = ({ title, description, icon: Icon }: ComingSoonProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            This module is currently under development. Check back soon for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
