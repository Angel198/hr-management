import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { fetchInvoiceById, updateInvoiceById, finalizeInvoiceById } from "@/lib/api";
import { toast } from "sonner";

type InvoiceTask = {
  _id: string;
  worksheet: string;
  task: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  hours_spent: number;
  rate: number;
  amount: number;
  remarks?: string;
};

type Invoice = {
  _id: string;
  clientName?: string;
  client?: { _id: string; name: string };
  tasks: InvoiceTask[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  invoice_status: "draft" | "final";
  createdAt: string;
};

const InvoiceEditorPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceTask[]>([]);
  const [tax, setTax] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadInvoice = async () => {
      if (!invoiceId) return;
      try {
        const result = await fetchInvoiceById(invoiceId);
        setInvoice(result);
        setLineItems(result.tasks || []);
        setTax(result.tax || 0);
        setNotes(result.notes || "");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load invoice");
      }
    };
    void loadInvoice();
  }, [invoiceId]);

  const isFinal = invoice?.invoice_status === "final";

  const subtotal = useMemo(
    () =>
      lineItems.reduce((sum, item) => {
        const amount = (item.rate || 0) * (item.hours_spent || 0);
        return sum + amount;
      }, 0),
    [lineItems],
  );

  const total = useMemo(() => subtotal + (tax || 0), [subtotal, tax]);

  const updateLineItem = (id: string, patch: Partial<InvoiceTask>) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              ...patch,
              amount:
                (patch.rate ?? item.rate ?? 0) * (patch.hours_spent ?? item.hours_spent ?? 0),
            }
          : item,
      ),
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item._id !== id));
  };

  const handleSaveDraft = async () => {
    if (!invoiceId) return;
    setIsSaving(true);
    try {
      await updateInvoiceById(invoiceId, {
        tasks: lineItems.map((item) => ({
          ...item,
          amount: (item.rate || 0) * (item.hours_spent || 0),
        })),
        tax,
        notes,
      });
      toast.success("Invoice saved");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to save invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!invoiceId) return;
    if (lineItems.length === 0) {
      toast.error("Invoice must include at least one task.");
      return;
    }
    setIsSaving(true);
    try {
      await updateInvoiceById(invoiceId, {
        tasks: lineItems.map((item) => ({
          ...item,
          amount: (item.rate || 0) * (item.hours_spent || 0),
        })),
        tax,
        notes,
      });
      await finalizeInvoiceById(invoiceId);
      toast.success("Invoice finalized");
      const clientId = invoice?.client?._id;
      if (clientId) {
        navigate(`/admin/client/${clientId}/invoices`, { replace: true });
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to finalize invoice");
    } finally {
      setIsSaving(false);
    }
  };

  if (!invoice) {
    return <div className="text-center text-muted-foreground py-10">Loading invoice...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Invoice #{invoice._id.slice(-6).toUpperCase()}
          </h1>
          <p className="text-muted-foreground">
            {invoice.client?.name || invoice.clientName || "Client"}
          </p>
        </div>
        <Badge variant={isFinal ? "default" : "secondary"}>{invoice.invoice_status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No line items</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{item.employeeId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.title}
                        disabled={isFinal}
                        onChange={(event) => updateLineItem(item._id, { title: event.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={item.description || ""}
                        disabled={isFinal}
                        onChange={(event) =>
                          updateLineItem(item._id, { description: event.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>{item.hours_spent.toFixed(2)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.rate ?? 0}
                        disabled={isFinal}
                        onChange={(event) =>
                          updateLineItem(item._id, { rate: Number(event.target.value) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      ₹{((item.rate || 0) * (item.hours_spent || 0)).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isFinal && (
                        <Button variant="ghost" size="sm" onClick={() => removeLineItem(item._id)}>
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

  <Card>
    <CardHeader>
      <CardTitle>Summary</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          disabled={isFinal}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add any notes visible on invoice"
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="space-y-1">
          <Label>Tax</Label>
          <Input
            type="number"
            step="0.01"
            value={tax}
            disabled={isFinal}
            onChange={(event) => setTax(Number(event.target.value))}
          />
        </div>
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>
    </CardContent>
  </Card>

  {!isFinal && (
    <div className="flex flex-wrap gap-3 justify-end">
      <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
        Save Draft
      </Button>
      <Button onClick={handleFinalize} disabled={isSaving || lineItems.length === 0}>
        Finalize Invoice
      </Button>
    </div>
  )}
</div>
  );
};

export default InvoiceEditorPage;


