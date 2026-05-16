import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { buildPermitDocumentHtml, downloadPermitDocument } from "@/lib/permitDocument";
import type { ReceiverPreset } from "@/lib/paymentPresets";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, Search, Receipt, Plus, Loader2, Eye, CalendarDays, TrendingUp, Wallet, FileSearch, QrCode, FileSpreadsheet, Settings2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import QRCodeReact from "react-qr-code";

interface Payment {
  id: string | number;
  receiptNumber?: string;
  externalPaymentId?: string;
  amount: string | number;
  currency?: string;
  payerFullName: string;
  payerJshshir?: string;
  payerPhone?: string;
  payerAddress?: string;
  contractDate?: string;
  description?: string;
  paymentCategoryId?: string;
  paymentCategory?: { id: string; name: string };
  paidAt?: string;
  createdAt?: string;
  receiverName?: string;
  bankName?: string;
  receiver?: { name?: string; account?: string; inn?: string; MFO?: string; mfo?: string };
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
    description?: string;
  };
  cashier?: { first_name?: string; last_name?: string };
}

type Variant = "ADMIN" | "CASHIER";
const base = (v: Variant) => (v === "ADMIN" ? "/admin" : "/cashier");

const emptyForm = {
  payerFullName: "",
  jshshir: "",
  payerPhone: "",
  paymentCategoryId: "",
  amount: "",
  description: "",
  contractNumber: "",
  contractDate: "",
  operationNumber: "",
  currency: "UZS",
};

const fmt = (n: any, c = "UZS") => {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v) + " " + c;
};

const paymentReason = (payment: Payment) =>
  payment.description || payment.paymentCategory?.name || payment.rawReceiptData?.paymentType || "-";

const payerJshshir = (payment: Payment) =>
  payment.payerJshshir || payment.rawReceiptData?.jshshir || "-";

const compactMoney = (n: any) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n) || 0);

const ALL_COLUMNS: ColumnDef[] = [
  { id: "id", label: "ID", sortable: false, defaultVisible: true },
  { id: "payerFullName", label: "FIO", sortable: true, defaultVisible: true },
  { id: "payerJshshir", label: "JSHSHIR", sortable: false, defaultVisible: true },
  { id: "payerPhone", label: "Tel raqami", sortable: false, defaultVisible: true },
  { id: "paymentReason", label: "Nima uchun to'lov", sortable: false, defaultVisible: true },
  { id: "contractNumber", label: "Contract #", sortable: false, defaultVisible: false },
  { id: "receiverName", label: "Receiver", sortable: false, defaultVisible: false },
  { id: "cashierName", label: "Cashier", sortable: false, defaultVisible: false },
  { id: "paidAt", label: "Date and time", sortable: true, defaultVisible: true },
  { id: "amount", label: "Amount", sortable: true, defaultVisible: true },
];

type ChartMode = "day" | "week" | "month" | "year";
type PaymentCategory = { id: string; name: string };
type SortField = "paidAt" | "amount" | "payerFullName" | "receiptNumber" | "createdAt";
type SortOrder = "asc" | "desc";

interface ColumnDef {
  id: string;
  label: string;
  sortable?: boolean;
  defaultVisible?: boolean;
}

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
  
  // QR Code state
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  
  // Filtering & Sorting
  const [sortField, setSortField] = useState<SortField>("paidAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterCashier, setFilterCashier] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.id)
  );
  const [cashiers, setCashiers] = useState<Array<{id: string; first_name: string; last_name: string}>>([]);

  const load = () => api.get(`${base(variant)}/payments`).then((r) => setItems(r.data?.data ?? r.data ?? [])).catch(() => setItems([]));
  
  useEffect(() => { load(); }, [variant]);
  
  useEffect(() => {
    if (variant !== "CASHIER") return;

    Promise.all([
      api.get("/cashier/payment-receivers"),
      api.get("/cashier/payment-categories"),
    ]).then(([receiverRes, categoryRes]) => {
      const nextReceivers = receiverRes.data?.data ?? [];
      const receiversWithMfo = nextReceivers.map((item: ReceiverPreset) => ({
        ...item,
        mfo: item.MFO || item.mfo || "",
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

  // Load cashiers and categories for filtering
  useEffect(() => {
    if (variant === "ADMIN") {
      api.get("/admin/cashiers").then((r) => setCashiers(r.data?.data ?? [])).catch(() => {});
      api.get("/admin/payment-categories").then((r) => setCategories(r.data?.data ?? [])).catch(() => {});
    }
  }, [variant]);

  const filtered = useMemo(() => {
    let result = items;
    
    // Text search
    if (q) {
      const s = q.toLowerCase();
      result = result.filter((p) =>
        p.payerFullName?.toLowerCase().includes(s) ||
        p.receiptNumber?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s)
      );
    }
    
    // Filter by cashier
    if (filterCashier) {
      result = result.filter((p) => p.cashier?.id === filterCashier);
    }
    
    // Filter by category
    if (filterCategory) {
      result = result.filter((p) => p.paymentCategory?.id === filterCategory);
    }
    
    // Filter by date range
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((p) => {
        const paidDate = new Date(p.paidAt || p.createdAt || "");
        return paidDate >= from;
      });
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((p) => {
        const paidDate = new Date(p.paidAt || p.createdAt || "");
        return paidDate <= to;
      });
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (sortField === "paidAt" || sortField === "createdAt") {
        aVal = new Date(a[sortField] || 0).getTime();
        bVal = new Date(b[sortField] || 0).getTime();
      } else if (sortField === "amount") {
        aVal = Number(a.amount);
        bVal = Number(b.amount);
      } else if (sortField === "payerFullName") {
        aVal = a.payerFullName?.toLowerCase() || "";
        bVal = b.payerFullName?.toLowerCase() || "";
      } else if (sortField === "receiptNumber") {
        aVal = a.receiptNumber || "";
        bVal = b.receiptNumber || "";
      }
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [q, items, filterCashier, filterCategory, filterDateFrom, filterDateTo, sortField, sortOrder]);

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
        payerPhone: form.payerPhone,
        paymentCategoryId: category.id,
        paymentTypeId: category.id,
        tolovTuriId: category.id,
        paymentType: category.name,
        contractNumber: form.contractNumber,
        payerAddress: `JSHSHIR: ${form.jshshir}; Shartnoma: ${form.contractNumber}; Sana: ${form.contractDate}`,
        contractDate: form.contractDate,
        description: form.description,
        receiverAccountId: Number(receiver.id),
        receiverName: receiver.name,
        bankName: receiver.name,
        receiver,
        receiverAccount: receiver.account,
        receiverInn: receiver.inn,
        receiverMfo: receiver.mfo || receiver.MFO,
        rawReceiptData: {
          jshshir: form.jshshir,
          paymentCategoryId: category.id,
          paymentType: category.name,
          description: form.description,
          contractNumber: form.contractNumber,
          contractDate: form.contractDate,
          operationNumber: form.operationNumber,
          receiverPresetId: receiver.id,
          receiverMfo: receiver.mfo || receiver.MFO,
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
      payerPhone: form.payerPhone,
      paymentType: category.name,
      paymentCategory: category,
      contractNumber: form.contractNumber,
      contractDate: form.contractDate,
      receiverName: receiver.name,
      bankName: receiver.name,
      receiver,
      receiverAccount: receiver.account,
      receiverInn: receiver.inn,
      receiverMfo: receiver.mfo || receiver.MFO,
      rawReceiptData: {
        jshshir: form.jshshir,
        paymentType: category.name,
        description: form.description,
        contractNumber: form.contractNumber,
        contractDate: form.contractDate,
        operationNumber: form.operationNumber,
        receiverMfo: receiver.mfo || receiver.MFO,
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const generateQR = async (payment: Payment) => {
    try {
      const res = await api.get(`${base(variant)}/payments/${payment.id}/qr`);
      setQrUrl(res.data?.data?.url || "");
      setQrDialogOpen(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to generate QR code");
    }
  };

  const exportToExcel = () => {
    const params = new URLSearchParams();
    if (filterCashier) params.append("cashierId", filterCashier);
    if (filterCategory) params.append("categoryId", filterCategory);
    if (filterDateFrom) params.append("dateFrom", filterDateFrom);
    if (filterDateTo) params.append("dateTo", filterDateTo);
    params.append("sortBy", sortField);
    params.append("sortOrder", sortOrder);
    
    const url = `${api.defaults.baseURL}${base(variant)}/payments/export/excel?${params}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments-${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Downloading Excel file...");
  };

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((current) =>
      current.includes(columnId)
        ? current.filter((id) => id !== columnId)
        : [...current, columnId]
    );
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortOrder === "desc" 
      ? <ArrowDown className="ml-1 inline h-3 w-3 text-primary" />
      : <ArrowUp className="ml-1 inline h-3 w-3 text-primary" />;
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
                  <div><Label>Phone number</Label><Input value={form.payerPhone} onChange={(e) => setForm({ ...form, payerPhone: e.target.value })} className="mt-1" /></div>
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
                  <div className="md:col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
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

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by payer, receipt or description" className="pl-9" />
          </div>
          
          {variant === "ADMIN" && (
            <>
              <Select
                value={filterCashier || "all"}
                onValueChange={(v) => setFilterCashier(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Cashiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cashiers</SelectItem>
                  {cashiers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterCategory || "all"}
                onValueChange={(v) => setFilterCategory(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                placeholder="From date"
                className="w-[150px]"
              />
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                placeholder="To date"
                className="w-[150px]"
              />

              <Button onClick={exportToExcel} variant="outline" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Export Excel
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Visible Columns</h4>
                    {ALL_COLUMNS.map((col) => (
                      <div key={col.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${col.id}`}
                          checked={visibleColumns.includes(col.id)}
                          onCheckedChange={() => toggleColumn(col.id)}
                        />
                        <label htmlFor={`col-${col.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No payments" desc="Receipts will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl">
          <table className="min-w-[1100px] w-full table-fixed text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                {visibleColumns.includes("id") && (
                  <th className="w-14 px-4 py-3">ID</th>
                )}
                {visibleColumns.includes("payerFullName") && (
                  <th 
                    className="w-56 px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("payerFullName")}
                  >
                    FIO {getSortIcon("payerFullName")}
                  </th>
                )}
                {visibleColumns.includes("payerJshshir") && (
                  <th className="w-40 px-4 py-3">JSHSHIR</th>
                )}
                {visibleColumns.includes("payerPhone") && (
                  <th className="w-36 px-4 py-3">Tel raqami</th>
                )}
                {visibleColumns.includes("paymentReason") && (
                  <th className="w-64 px-4 py-3">Nima uchun to'lov</th>
                )}
                {visibleColumns.includes("contractNumber") && (
                  <th className="w-32 px-4 py-3">Contract #</th>
                )}
                {visibleColumns.includes("receiverName") && (
                  <th className="w-48 px-4 py-3">Receiver</th>
                )}
                {visibleColumns.includes("cashierName") && (
                  <th className="w-40 px-4 py-3">Cashier</th>
                )}
                {visibleColumns.includes("paidAt") && (
                  <th 
                    className="w-44 px-4 py-3 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("paidAt")}
                  >
                    Date and time {getSortIcon("paidAt")}
                  </th>
                )}
                {visibleColumns.includes("amount") && (
                  <th 
                    className="w-36 px-4 py-3 text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("amount")}
                  >
                    Amount {getSortIcon("amount")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  onClick={() => setView(p)}
                  className="cursor-pointer border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/40"
                >
                  {visibleColumns.includes("id") && (
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                  )}
                  {visibleColumns.includes("payerFullName") && (
                    <td className="truncate px-4 py-3 font-medium">{p.payerFullName}</td>
                  )}
                  {visibleColumns.includes("payerJshshir") && (
                    <td className="truncate px-4 py-3 font-mono text-xs text-muted-foreground">{payerJshshir(p)}</td>
                  )}
                  {visibleColumns.includes("payerPhone") && (
                    <td className="truncate px-4 py-3 text-xs text-muted-foreground">{p.payerPhone || "-"}</td>
                  )}
                  {visibleColumns.includes("paymentReason") && (
                    <td className="truncate px-4 py-3 text-xs text-muted-foreground">{paymentReason(p)}</td>
                  )}
                  {visibleColumns.includes("contractNumber") && (
                    <td className="truncate px-4 py-3 text-xs text-muted-foreground">{p.contractNumber || p.rawReceiptData?.contractNumber || "-"}</td>
                  )}
                  {visibleColumns.includes("receiverName") && (
                    <td className="truncate px-4 py-3 text-xs text-muted-foreground">{p.receiverName || p.receiver?.name || "-"}</td>
                  )}
                  {visibleColumns.includes("cashierName") && (
                    <td className="truncate px-4 py-3 text-xs text-muted-foreground">
                      {p.cashier ? `${p.cashier.first_name} ${p.cashier.last_name}` : "-"}
                    </td>
                  )}
                  {visibleColumns.includes("paidAt") && (
                    <td className="truncate px-4 py-3 text-xs text-muted-foreground">{p.paidAt ? new Date(p.paidAt).toLocaleString() : "-"}</td>
                  )}
                  {visibleColumns.includes("amount") && (
                    <td className="px-4 py-3 text-right font-mono font-semibold text-primary">{fmt(p.amount, p.currency)}</td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
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
              <Button 
                variant="outline" 
                className="mt-3 w-full" 
                onClick={() => generateQR(view)}
              >
                <QrCode className="mr-2 h-4 w-4" /> Generate QR Code
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

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-4 w-4" /> Payment QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            {qrUrl && (
              <>
                <div className="rounded-lg border-4 border-border bg-white p-4">
                  <QRCodeReact value={qrUrl} size={256} />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Scan this QR code to view the receipt
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(qrUrl);
                    toast.success("Link copied to clipboard");
                  }}
                  className="w-full"
                >
                  Copy Link
                </Button>
              </>
            )}
          </div>
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
