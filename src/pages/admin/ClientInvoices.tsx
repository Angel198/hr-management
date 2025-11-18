import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchClients, fetchInvoicesForClient } from "@/lib/api";
import { toast } from "sonner";

type ClientOption = { _id: string; name: string; code?: string };

type InvoiceRow = {
  _id: string;
  createdAt: string;
  total: number;
  invoice_status: "draft" | "final";
  notes?: string;
};

const ClientInvoicesPage = () => {
  const params = useParams<{ clientId: string }>();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>(params.clientId || "");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await fetchClients();
        const list = Array.isArray(data) ? data : [];
        setClients(list);
        if (!selectedClient && list.length > 0) {
          setSelectedClient(list[0]._id);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load clients");
      }
    };
    void loadClients();
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    const loadInvoices = async () => {
      setIsLoading(true);
      try {
        const data = await fetchInvoicesForClient(selectedClient);
        setInvoices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };
    void loadInvoices();
  }, [selectedClient]);

  const clientName = clients.find((client) => client._id === selectedClient)?.name;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Client Invoices</CardTitle>
            <p className="text-muted-foreground">
              Review invoice history by client and update drafts.
            </p>
          </div>
          <div className="w-full md:w-64">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client._id} value={client._id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-6">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              {selectedClient ? "No invoices found for this client." : "Select a client to continue."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell>#{invoice._id.slice(-6).toUpperCase()}</TableCell>
                    <TableCell>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>₹{Number(invoice.total || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.invoice_status === "final" ? "default" : "secondary"}>
                        {invoice.invoice_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/invoice/${invoice._id}`)}
                      >
                        {invoice.invoice_status === "draft" ? "Edit" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="link" onClick={() => navigate("/admin/tasks/client-filter")}>
          Back to Client Tasks
        </Button>
      </div>
    </div>
  );
};

export default ClientInvoicesPage;


