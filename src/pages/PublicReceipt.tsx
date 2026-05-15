import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { buildPermitDocumentHtml, downloadPermitDocument } from "@/lib/permitDocument";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Receipt, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Payment {
  id: string | number;
  receiptNumber?: string;
  amount: string | number;
  currency?: string;
  payerFullName: string;
  payerJshshir?: string;
  payerPhone?: string;
  payerAddress?: string;
  contractDate?: string;
  description?: string;
  paymentCategory?: { id: string; name: string };
  paidAt?: string;
  receiverName?: string;
  receiver?: { name?: string; account?: string; inn?: string; MFO?: string };
  receiverAccount?: string;
  receiverInn?: string;
  receiverMfo?: string;
  terminalName?: string;
  rawReceiptData?: any;
  cashier?: { first_name?: string; last_name?: string; middle_name?: string };
}

const fmt = (n: any, c = "UZS") => {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v) + " " + c;
};

const PublicReceipt = () => {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/public/payments/${id}`)
      .then(async (r) => {
        const p = r.data?.data ?? r.data;
        setPayment(p);
        setPreviewHtml(await buildPermitDocumentHtml(p));
      })
      .catch((e) => setError(e?.response?.data?.message || "Payment not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mb-2 font-display text-2xl font-bold">Payment Not Found</h1>
          <p className="text-muted-foreground">{error || "This payment receipt does not exist."}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold">Payment Receipt</h1>
          <p className="mt-2 text-sm text-muted-foreground">Receipt #{payment.receiptNumber || payment.id}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl"
        >
          <div className="mb-6 rounded-xl gradient-primary p-6 text-primary-foreground">
            <p className="text-xs opacity-80">Amount</p>
            <p className="font-display text-4xl font-bold">{fmt(payment.amount, payment.currency)}</p>
            <p className="mt-2 text-sm opacity-90">
              {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : ""}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow label="Payer" value={payment.payerFullName} />
            <InfoRow label="JSHSHIR" value={payment.payerJshshir} />
            <InfoRow label="Phone" value={payment.payerPhone} />
            <InfoRow label="Payment Type" value={payment.paymentCategory?.name} />
            <InfoRow label="Description" value={payment.description} />
            <InfoRow label="Contract Date" value={payment.contractDate ? new Date(payment.contractDate).toLocaleDateString() : undefined} />
            <InfoRow label="Receiver" value={payment.receiverName || payment.receiver?.name} />
            <InfoRow label="Receiver Account" value={payment.receiverAccount || payment.receiver?.account} />
            <InfoRow label="Receiver INN" value={payment.receiverInn || payment.receiver?.inn} />
            <InfoRow label="Receiver MFO" value={payment.receiverMfo || payment.receiver?.MFO} />
            <InfoRow label="Terminal" value={payment.terminalName} />
            <InfoRow label="Cashier" value={payment.cashier ? `${payment.cashier.first_name} ${payment.cashier.last_name}` : undefined} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => downloadPermitDocument(payment)} className="flex-1 gradient-primary">
              <Download className="mr-2 h-4 w-4" /> Download Receipt
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl"
        >
          <div className="border-b border-border/60 bg-muted/40 px-6 py-4">
            <h2 className="font-display text-lg font-semibold">Receipt Preview</h2>
          </div>
          <div className="p-4">
            <iframe
              title="Receipt preview"
              srcDoc={previewHtml}
              className="h-[600px] w-full rounded-md border bg-white"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex flex-col">
    <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="mt-1 font-medium">{value || "-"}</span>
  </div>
);

export default PublicReceipt;
