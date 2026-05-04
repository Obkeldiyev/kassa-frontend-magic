import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { buildPermitDocumentHtml, downloadPermitDocument } from "@/lib/permitDocument";
import type { ReceiverPreset } from "@/lib/paymentPresets";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Download, Search, Receipt, Plus, Loader2, Eye, CalendarDays, TrendingUp, Wallet, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Payment {
  id: string | number;
  receiptNumber?: string;
  externalPaymentId?: string;
  amount: string | number;
  currency?: string;
  payerFullName: string;
  payerPhone?: string;
  payerAddress?: string;
  contractDate?: string;
  description?: string;
  paymentCategoryId?: string;
  paymentCategory?: { id: string; name: string };
  paidAt?: string;
  createdAt?: string;
  receiverName?: string;
  receiverAccount?: string;
  receiverInn?: string;
  receiverMfo?: string;
  terminalName?: string;
  terminalAddress?: string;
  terminalId?: string;
  rawReceiptData?: {
    jshshir?: string;
    paymentType?: string;
    contractNumber?: string;
    contractDate?: string;
    operationNumber?: string;
    receiverPresetId?: string;
    receiverMfo?: string;
  };
  cashier?: { first_name?: string; last_name?: string };
}

type Variant = "ADMIN" | "CASHIER";
const base = (v: Variant) => (v === "ADMIN" ? "/admin" : "/cashier");

const emptyForm = {
  payerFullName: "",
  jshshir: "",
  paymentCategoryId: "",
  amount: "",
  contractNumber: "",
  contractDate: "",
  operationNumber: "",
  currency: "UZS",
};

const fmt = (n: any, c = "UZS") => {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v) + " " + c;
};

const compactMoney = (n: any) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n) || 0);

type ChartMode = "day" | "week" | "month" | "year";
type PaymentCategory = { id: string; name: string };

const getStoredReceiverMfo = () => {
  try {
    return JSON.parse(localStorage.getItem("kassa.receiverMfo") || "{}") as Record<string, string>;
  } catch {
    return {};
  }
};

const chartKey = (value: string | undefined, mode: ChartMode) => {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, "0");
  const day = String(safeDate.getDate()).padStart(2, "0");

  if (mode === "day") return `${year}-${month}-${day}`;
  if (mode === "month") return `${year}-${month}`;
  if (mode === "year") return String(year);

  const first = new Date(year, 0, 1);
  const days = Math.floor((Number(safeDate) - Number(first)) / 86400000);
  return `${year} W${String(Math.ceil((days + first.getDay() + 1) / 7)).padStart(2, "0")}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const timelineKeys = (mode: ChartMode) => {
  const now = new Date();
  const keys: string[] = [];

  if (mode === "day") {
    for (let i = 13; i >= 0; i -= 1) keys.push(chartKey(addDays(now, -i).toISOString(), "day"));
  } else if (mode === "week") {
    const mondayOffset = (now.getDay() + 6) % 7;
    const monday = addDays(now, -mondayOffset);
    for (let i = 0; i < 7; i += 1) keys.push(chartKey(addDays(monday, i).toISOString(), "day"));
  } else if (mode === "month") {
    const year = now.getFullYear();
    for (let i = 0; i < 12; i += 1) keys.push(`${year}-${String(i + 1).padStart(2, "0")}`);
  } else {
    const year = now.getFullYear();
    for (let i = 4; i >= 0; i -= 1) keys.push(String(year - i));
  }

  return keys;
};

const chartLabel = (key: string, mode: ChartMode) => {
  if (mode === "day" || mode === "week") {
    const date = new Date(`${key}T00:00:00`);
    return date.toLocaleDateString("en-US", mode === "week" ? { weekday: "short" } : { month: "short", day: "2-digit" });
  }

  if (mode === "month") {
    const date = new Date(`${key}-01T00:00:00`);
    return date.toLocaleDateString("en-US", { month: "short" });
  }

  return key;
};

const buildChartData = (items: Payment[], mode: ChartMode) => {
  const grouped = new Map<string, number>();
  items.forEach((item) => {
    const key = chartKey(item.paidAt || item.createdAt, mode === "week" ? "day" : mode);
    grouped.set(key, (grouped.get(key) || 0) + Number(item.amount || 0));
  });
  return timelineKeys(mode).map((key) => ({ name: chartLabel(key, mode), total: grouped.get(key) || 0 }));
};

export const PaymentsPage = ({ variant }: { variant: Variant }) => {
  const [items, setItems] = useState<Payment[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<Payment | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [receivers, setReceivers] = useState<ReceiverPreset[]>([]);
  const [categories, setCategories] = useState<PaymentCategory[]>([]);
  const [chartMode, setChartMode] = useState<ChartMode>("day");

  const load = () => api.get(`${base(variant)}/payments`).then((r) => setItems(r.data?.data ?? r.data ?? [])).catch(() => setItems([]));
  useEffect(() => { load(); }, [variant]);
  useEffect(() => {
    if (variant !== "CASHIER") return;

    Promise.all([
      api.get("/cashier/payment-receivers"),
      api.get("/cashier/payment-categories"),
    ]).then(([receiverRes, categoryRes]) => {
      const nextReceivers = receiverRes.data?.data ?? [];
      const mfo = getStoredReceiverMfo();
      const receiversWithMfo = nextReceivers.map((item: ReceiverPreset) => ({
        ...item,
        mfo: mfo[String(item.id)] || mfo[item.account] || "00423",
      }));
      const nextCategories = categoryRes.data?.data ?? [];
      setReceivers(receiversWithMfo);
      setCategories(nextCategories);
      setForm((current) => current.paymentCategoryId ? current : { ...current, paymentCategoryId: nextCategories[0]?.id || "" });
    }).catch(() => {
      setReceivers([]);
      setCategories([]);
      setForm((current) => ({ ...current, paymentCategoryId: "" }));
    });
  }, [open]);

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
  const chartData = useMemo(() => buildChartData(items, chartMode), [items, chartMode]);
  const todayTotal = useMemo(() => {
    const today = chartKey(new Date().toISOString(), "day");
    return items.reduce((acc, item) => chartKey(item.paidAt || item.createdAt, "day") === today ? acc + Number(item.amount || 0) : acc, 0);
  }, [items]);
  const averagePayment = items.length ? total / items.length : 0;

  const getCashierFullName = async () => {
    try {
      const res = await api.get("/cashier/profile");
      const profile = res.data?.data ?? res.data;
      return [profile?.last_name, profile?.first_name, profile?.middle_name].filter(Boolean).join(" ");
    } catch {
      return "";
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const receiver = receivers[0];
      const category = categories.find((item) => item.id === form.paymentCategoryId);

      if (!receiver) {
        toast.error("Admin must create xisob raqam / INN first");
        setLoading(false);
        return;
      }

      if (!category) {
        toast.error("Choose to'lov turi");
        setLoading(false);
        return;
      }

      if (!/^\d{14}$/.test(form.jshshir.trim())) {
        toast.error("JSHSHIR must be 14 digits");
        setLoading(false);
        return;
      }

      const body: any = {
        receiptNumber: form.operationNumber,
        externalPaymentId: form.operationNumber,
        operationNumber: form.operationNumber,
        amount: Number(form.amount),
        currency: form.currency,
        payerFullName: form.payerFullName,
        payerJshshir: form.jshshir,
        jshshir: form.jshshir,
        paymentCategoryId: category.id,
        paymentTypeId: category.id,
        tolovTuriId: category.id,
        paymentType: category.name,
        contractNumber: form.contractNumber,
        payerAddress: `JSHSHIR: ${form.jshshir}; Shartnoma: ${form.contractNumber}; Sana: ${form.contractDate}`,
        contractDate: form.contractDate,
        description: category.name,
        receiverAccountId: Number(receiver.id),
        receiverName: receiver.name,
        receiverAccount: receiver.account,
        receiverInn: receiver.inn,
        receiverMfo: receiver.mfo || "00423",
        rawReceiptData: {
          jshshir: form.jshshir,
          paymentCategoryId: category.id,
          paymentType: category.name,
          contractNumber: form.contractNumber,
          contractDate: form.contractDate,
          operationNumber: form.operationNumber,
          receiverPresetId: receiver.id,
          receiverMfo: receiver.mfo || "00423",
        },
      };
      Object.keys(body).forEach((k) => { if (body[k] === "") delete body[k]; });
      const res = await api.post(`/cashier/payments`, body);
      const created = res.data?.data ?? res.data ?? body;
      const cashierFullName = await getCashierFullName();
      await downloadPermitDocument({ ...body, ...created, cashierFullName });
      toast.success("Payment created");
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const buildDraftPayment = () => {
    const receiver = receivers[0];
    const category = categories.find((item) => item.id === form.paymentCategoryId);

    if (!receiver || !category) return null;

    return {
      receiptNumber: form.operationNumber,
      operationNumber: form.operationNumber,
      amount: Number(form.amount),
      currency: form.currency,
      payerFullName: form.payerFullName,
      payerJshshir: form.jshshir,
      paymentType: category.name,
      paymentCategory: category,
      contractNumber: form.contractNumber,
      contractDate: form.contractDate,
      receiverName: receiver.name,
      receiverAccount: receiver.account,
      receiverInn: receiver.inn,
      receiverMfo: receiver.mfo || "00423",
      rawReceiptData: {
        jshshir: form.jshshir,
        paymentType: category.name,
        contractNumber: form.contractNumber,
        contractDate: form.contractDate,
        operationNumber: form.operationNumber,
        receiverMfo: receiver.mfo || "00423",
      },
    };
  };

  const previewDraft = async () => {
    const draft = buildDraftPayment();

    if (!draft) {
      toast.error("Fill payment type and let admin create account / INN first");
      return;
    }

    setPreviewHtml(await buildPermitDocumentHtml(draft));
    setPreviewOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Payments"
        description={variant === "CASHIER" ? "Create student payment receipts." : "Track student payment volume by period."}
        action={
          variant === "CASHIER" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary shadow-elegant"><Plus className="mr-1 h-4 w-4" /> New payment</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader><DialogTitle>Create payment</DialogTitle></DialogHeader>
                <form onSubmit={create} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div><Label>Ism familiya *</Label><Input value={form.payerFullName} onChange={(e) => setForm({ ...form, payerFullName: e.target.value })} required className="mt-1" /></div>
                  <div><Label>JSHSHIR *</Label><Input inputMode="numeric" maxLength={14} value={form.jshshir} onChange={(e) => setForm({ ...form, jshshir: e.target.value.replace(/\D/g, "").slice(0, 14) })} required className="mt-1" /></div>
                  <div>
                    <Label>To'lov turi *</Label>
                    <select
                      value={form.paymentCategoryId}
                      onChange={(e) => setForm({ ...form, paymentCategoryId: e.target.value })}
                      required
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div><Label>To'lov summasi *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="mt-1" /></div>
                  <div><Label>Shartnoma raqami *</Label><Input value={form.contractNumber} onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} required className="mt-1" /></div>
                  <div><Label>Shartnoma sanasi *</Label><Input type="date" value={form.contractDate} onChange={(e) => setForm({ ...form, contractDate: e.target.value })} required className="mt-1" /></div>
                  <div><Label>Nomer operatsiya *</Label><Input value={form.operationNumber} onChange={(e) => setForm({ ...form, operationNumber: e.target.value })} required className="mt-1" /></div>
                  <DialogFooter className="gap-2 md:col-span-2">
                    <Button type="button" variant="outline" onClick={previewDraft}>
                      <FileSearch className="mr-2 h-4 w-4" /> Preview check
                    </Button>
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

      {variant === "ADMIN" && (
        <div className="mb-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard index={0} icon={Wallet} label="Today paid" value={fmt(todayTotal)} />
            <StatCard index={1} icon={TrendingUp} label="Average payment" value={fmt(averagePayment)} />
            <StatCard index={2} icon={CalendarDays} label="Tracked periods" value={chartData.length} />
          </div>
          <div className="rounded-lg border border-border/60 bg-card/60 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Payment tracking</p>
                <p className="text-xs text-muted-foreground">Daily, weekly, monthly and yearly student payment totals.</p>
              </div>
              <div className="flex rounded-md border border-border/60 p-1">
                {(["day", "week", "month", "year"] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={chartMode === mode ? "default" : "ghost"}
                    onClick={() => setChartMode(mode)}
                    className="h-8 capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={compactMoney} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => fmt(value)} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.18}
                    strokeWidth={3}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

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
              <div className="col-span-2 truncate text-xs text-muted-foreground">{p.receiptNumber || "-"}</div>
              <div className="col-span-3 hidden truncate text-xs text-muted-foreground md:block">{p.description || "-"}</div>
              <div className="col-span-2 hidden text-xs text-muted-foreground md:block">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}</div>
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
                <p className="mt-2 text-xs opacity-90">Receipt {view.receiptNumber || "-"}</p>
              </div>
              <Row k="Payer" v={view.payerFullName} />
              <Row k="Phone" v={view.payerPhone} />
              <Row k="Address" v={view.payerAddress} />
              <Row k="Description" v={view.description} />
              <Row k="Receiver" v={view.receiverName} />
              <Row k="Receiver account" v={view.receiverAccount} />
              <Row k="MFO" v={view.receiverMfo || view.rawReceiptData?.receiverMfo} />
              <Row k="Receiver INN" v={view.receiverInn} />
              <Row k="Terminal" v={view.terminalName} />
              <Row k="Terminal address" v={view.terminalAddress} />
              <Row k="Terminal ID" v={view.terminalId} />
              <Row k="Cashier" v={view.cashier ? `${view.cashier.first_name ?? ""} ${view.cashier.last_name ?? ""}`.trim() : undefined} />
              <Row k="Paid at" v={view.paidAt ? new Date(view.paidAt).toLocaleString() : undefined} />
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={async () => {
                  setPreviewHtml(await buildPermitDocumentHtml(view));
                  setPreviewOpen(true);
                }}
              >
                <FileSearch className="mr-2 h-4 w-4" /> Preview check
              </Button>
              <Button className="mt-3 w-full" onClick={() => downloadPermitDocument(view)}>
                <Download className="mr-2 h-4 w-4" /> Download receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileSearch className="h-4 w-4" /> Check preview</DialogTitle>
          </DialogHeader>
          <iframe title="Check preview" srcDoc={previewHtml} className="h-[72vh] w-full rounded-md border bg-white" />
        </DialogContent>
      </Dialog>
    </>
  );
};

const Row = ({ k, v }: { k: string; v?: string }) => (
  <div className="flex items-center justify-between border-b border-border/40 py-2 last:border-b-0">
    <span className="text-xs uppercase tracking-widest text-muted-foreground">{k}</span>
    <span className="text-right font-medium">{v || "-"}</span>
  </div>
);
