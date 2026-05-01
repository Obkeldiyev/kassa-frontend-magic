import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, Receipt, Plus, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";

interface Payment {
  id: string; receiptNumber?: string; amount: string | number; currency?: string;
  payerFullName: string; payerPhone?: string; description?: string; paidAt?: string; createdAt?: string;
  terminalName?: string; cashier?: { first_name?: string; last_name?: string };
}

type Variant = "ADMIN" | "CASHIER";
const base = (v: Variant) => (v === "ADMIN" ? "/admin" : "/cashier");

const fmt = (n: any, c = "UZS") => {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v) + " " + c;
};

export const PaymentsPage = ({ variant }: { variant: Variant }) => {
  const [items, setItems] = useState<Payment[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<Payment | null>(null);

  const [form, setForm] = useState({
    amount: "", payerFullName: "", payerPhone: "", payerAddress: "",
    description: "", receiptNumber: "", currency: "UZS",
    receiverName: "", receiverAccount: "", receiverInn: "",
    terminalName: "", terminalAddress: "", terminalId: "",
  });

  const load = () => api.get(`${base(variant)}/payments`).then((r) => setItems(r.data?.data ?? r.data ?? [])).catch(() => setItems([]));
  useEffect(() => { load(); }, [variant]);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter((p) =>
      p.payerFullName?.toLowerCase().includes(s) ||
      p.receiptNumber?.toLowerCase().includes(s) ||
      p.description?.toLowerCase().includes(s)
    );
  }, [q, items]);

  const total = items.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body: any = { ...form, amount: Number(form.amount) };
      Object.keys(body).forEach((k) => { if (body[k] === "") delete body[k]; });
      await api.post(`/cashier/payments`, body);
      toast.success("Payment created");
      setOpen(false);
      setForm({ amount:"", payerFullName:"", payerPhone:"", payerAddress:"", description:"", receiptNumber:"", currency:"UZS", receiverName:"", receiverAccount:"", receiverInn:"", terminalName:"", terminalAddress:"", terminalId:"" });
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <PageHeader
        title="Payments"
        description={variant === "CASHIER" ? "Issue and review your receipts." : "Every receipt issued by your cashiers."}
        action={
          variant === "CASHIER" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary shadow-elegant"><Plus className="mr-1 h-4 w-4" /> New payment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Create payment</DialogTitle></DialogHeader>
                <form onSubmit={create} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div><Label>Payer full name *</Label><Input value={form.payerFullName} onChange={(e) => setForm({ ...form, payerFullName: e.target.value })} required className="mt-1" /></div>
                  <div><Label>Amount *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="mt-1" /></div>
                  <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="mt-1" /></div>
                  <div><Label>Receipt number</Label><Input value={form.receiptNumber} onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })} className="mt-1" /></div>
                  <div><Label>Payer phone</Label><Input value={form.payerPhone} onChange={(e) => setForm({ ...form, payerPhone: e.target.value })} className="mt-1" /></div>
                  <div><Label>Payer address</Label><Input value={form.payerAddress} onChange={(e) => setForm({ ...form, payerAddress: e.target.value })} className="mt-1" /></div>
                  <div className="md:col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
                  <div><Label>Receiver name</Label><Input value={form.receiverName} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} className="mt-1" /></div>
                  <div><Label>Receiver account</Label><Input value={form.receiverAccount} onChange={(e) => setForm({ ...form, receiverAccount: e.target.value })} className="mt-1" /></div>
                  <div><Label>Receiver INN</Label><Input value={form.receiverInn} onChange={(e) => setForm({ ...form, receiverInn: e.target.value })} className="mt-1" /></div>
                  <div><Label>Terminal name</Label><Input value={form.terminalName} onChange={(e) => setForm({ ...form, terminalName: e.target.value })} className="mt-1" /></div>
                  <div className="md:col-span-2"><Label>Terminal address</Label><Input value={form.terminalAddress} onChange={(e) => setForm({ ...form, terminalAddress: e.target.value })} className="mt-1" /></div>
                  <DialogFooter className="md:col-span-2">
                    <Button type="submit" disabled={loading} className="gradient-primary">
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating</> : "Create payment"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard index={0} icon={Receipt} label="Receipts" value={items.length} />
        <StatCard index={1} icon={Receipt} label="Total volume" value={fmt(total)} />
        <StatCard index={2} icon={Receipt} label="Currency" value={items[0]?.currency || "UZS"} />
      </div>

      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by payer, receipt or description" className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No payments" desc="Receipts will appear here." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl">
          <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-muted/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <div className="col-span-3">Payer</div>
            <div className="col-span-2">Receipt</div>
            <div className="col-span-3 hidden md:block">Description</div>
            <div className="col-span-2 hidden md:block">Date</div>
            <div className="col-span-3 md:col-span-2 text-right">Amount</div>
          </div>
          {filtered.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4) }}
              onClick={() => setView(p)}
              className="grid w-full grid-cols-12 items-center gap-3 border-b border-border/40 px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/40"
            >
              <div className="col-span-3 truncate font-medium">{p.payerFullName}</div>
              <div className="col-span-2 truncate text-xs text-muted-foreground">{p.receiptNumber || "—"}</div>
              <div className="col-span-3 hidden truncate text-xs text-muted-foreground md:block">{p.description || "—"}</div>
              <div className="col-span-2 hidden text-xs text-muted-foreground md:block">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</div>
              <div className="col-span-3 md:col-span-2 text-right font-mono font-semibold text-primary">{fmt(p.amount, p.currency)}</div>
            </motion.button>
          ))}
        </div>
      )}

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4" /> Payment details</DialogTitle>
          </DialogHeader>
          {view && (
            <div className="space-y-2 text-sm">
              <div className="rounded-xl gradient-primary p-5 text-primary-foreground">
                <p className="text-xs opacity-80">Amount</p>
                <p className="font-display text-3xl font-bold">{fmt(view.amount, view.currency)}</p>
                <p className="mt-2 text-xs opacity-90">Receipt {view.receiptNumber || "—"}</p>
              </div>
              <Row k="Payer" v={view.payerFullName} />
              <Row k="Phone" v={view.payerPhone} />
              <Row k="Description" v={view.description} />
              <Row k="Terminal" v={view.terminalName} />
              <Row k="Cashier" v={view.cashier ? `${view.cashier.first_name ?? ""} ${view.cashier.last_name ?? ""}`.trim() : undefined} />
              <Row k="Paid at" v={view.paidAt ? new Date(view.paidAt).toLocaleString() : undefined} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const Row = ({ k, v }: { k: string; v?: string }) => (
  <div className="flex items-center justify-between border-b border-border/40 py-2 last:border-b-0">
    <span className="text-xs uppercase tracking-widest text-muted-foreground">{k}</span>
    <span className="text-right font-medium">{v || "—"}</span>
  </div>
);
