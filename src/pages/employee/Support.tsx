import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { HelpCircle, Ticket, Headphones, MessageSquare, Phone } from "lucide-react";

const knowledgeBaseArticles = [
  {
    id: "kb-101",
    title: "How do I submit an expense claim?",
    summary: "Step-by-step guide to raise L1 expense approvals in HRMS.",
    category: "Policies",
  },
  {
    id: "kb-205",
    title: "Setting up VPN access when working remotely",
    summary: "Checklist to prepare your laptop for secure remote work.",
    category: "IT Support",
  },
  {
    id: "kb-318",
    title: "Understanding leave encashment rules",
    summary: "FAQ on carry-forward and encashment of unused annual leave.",
    category: "Benefits",
  },
] as const;

const supportChannels = [
  {
    icon: Headphones,
    title: "People Operations",
    description: "Get help with payroll, leave policies, or HR processes.",
    contact: "peopleops@company.com",
    eta: "Avg. response · 2h",
  },
  {
    icon: MessageSquare,
    title: "IT Service Desk",
    description: "Report hardware issues or request access to tools.",
    contact: "it-help@company.com",
    eta: "Avg. response · 45m",
  },
  {
    icon: Phone,
    title: "Emergency Hotline",
    description: "Use for critical incidents or security concerns.",
    contact: "+91 98765 40000",
    eta: "24x7",
  },
] as const;

const categories = ["Policies", "Benefits", "Payroll", "IT Support"] as const;

const Support = () => {
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[number] | "All">("All");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Help & Support Center</h2>
        <p className="text-muted-foreground">
          Raise a ticket, browse quick answers, or talk to People Operations for immediate help.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Raise a ticket</CardTitle>
            <CardDescription>
              Share your query with the support team. Our SLA for internal tickets is 4 business hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="ticket-subject">
                  Subject
                </label>
                <Input
                  id="ticket-subject"
                  placeholder="Describe your query in a few words"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <div className="flex flex-wrap gap-2">
                  {["All", ...categories].map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSelectedCategory(category === "All" ? "All" : (category as typeof categories[number]))
                      }
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="ticket-message">
                How can we help?
              </label>
              <Textarea
                id="ticket-message"
                rows={5}
                placeholder="Include key dates, stakeholders, and any links or attachments we should review."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Typical resolution time · 1 business day</span>
              <Button className="gap-2" disabled={!subject.trim() || !message.trim()}>
                <Ticket className="h-4 w-4" />
                Submit ticket
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Quick answers</CardTitle>
              <CardDescription>Top articles from our HR and IT knowledge base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {knowledgeBaseArticles.map((article) => (
                <div key={article.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{article.title}</h3>
                    <Badge variant="outline">{article.category}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{article.summary}</p>
                  <Button variant="link" size="sm" className="px-0">
                    View article
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Talk to someone</CardTitle>
              <CardDescription>Contact teams for immediate assistance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {supportChannels.map((channel) => (
                <div key={channel.title} className="flex gap-3 rounded-xl border border-border/70 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <channel.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{channel.title}</p>
                      <span className="text-xs text-muted-foreground">{channel.eta}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{channel.description}</p>
                    <p className="mt-2 text-sm font-medium text-primary">{channel.contact}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Service status</CardTitle>
            <CardDescription>Current health of HRMS and integrated tools.</CardDescription>
          </div>
          <Badge className="gap-1">
            <HelpCircle className="h-4 w-4" />
            All systems operational
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <StatusTile title="HRMS Portal" state="Operational" />
          <StatusTile title="Payroll Services" state="Maintenance today · 7PM" />
          <StatusTile title="IT VPN" state="Operational" />
        </CardContent>
      </Card>
    </div>
  );
};

const StatusTile = ({ title, state }: { title: string; state: string }) => (
  <div className="rounded-xl border border-border/70 bg-background/70 p-4">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-2 text-xs text-muted-foreground">{state}</p>
  </div>
);

export default Support;

