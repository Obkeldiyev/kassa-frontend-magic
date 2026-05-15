import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Users, Receipt, Clock, DollarSign, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

interface DailyReport {
  date: string;
  totalAmount: number;
  totalCount: number;
  currency: string;
  byCashier: Array<{ name: string; count: number; total: number }>;
  byCategory: Array<{ name: string; count: number; total: number }>;
  hourly: Array<{ hour: number; count: number; total: number }>;
  comparison: {
    prevTotal: number;
    prevCount: number;
    amountChange: number;
    countChange: number;
  };
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export const DailyReportsPage = () => {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/admin/payments/daily-report?date=${date}`)
      .then((r) => setReport(r.data?.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [date]);

  if (!report) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  const hourlyData = report.hourly.map((h) => ({
    hour: `${String(h.hour).padStart(2, "0")}:00`,
    amount: h.total,
    count: h.count,
  }));

  const maxHourlyAmount = Math.max(...report.hourly.map((h) => h.total), 1);

  return (
    <>
      <PageHeader
        title="Daily Reports"
        description="Comprehensive daily payment analytics and insights."
        action={
          <div className="flex items-center gap-2">
            <Label htmlFor="report-date" className="sr-only">Date</Label>
            <Input
              id="report-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
            <Button onClick={load} disabled={loading} className="gradient-primary">
              {loading ? "Loading..." : "Load"}
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard
          index={0}
          icon={DollarSign}
          label="Total Revenue"
          value={`${fmt(report.totalAmount)} ${report.currency}`}
          hint={
            report.comparison.amountChange !== 0 ? (
              <span className={report.comparison.amountChange > 0 ? "text-green-600" : "text-red-600"}>
                {report.comparison.amountChange > 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                {" "}{Math.abs(report.comparison.amountChange).toFixed(1)}% vs yesterday
              </span>
            ) : undefined
          }
        />
        <StatCard
          index={1}
          icon={Receipt}
          label="Total Payments"
          value={report.totalCount}
          hint={
            report.comparison.countChange !== 0 ? (
              <span className={report.comparison.countChange > 0 ? "text-green-600" : "text-red-600"}>
                {report.comparison.countChange > 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                {" "}{Math.abs(report.comparison.countChange).toFixed(1)}% vs yesterday
              </span>
            ) : undefined
          }
        />
        <StatCard
          index={2}
          icon={Users}
          label="Active Cashiers"
          value={report.byCashier.length}
        />
        <StatCard
          index={3}
          icon={Calendar}
          label="Report Date"
          value={new Date(report.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">By Cashier</h3>
          </div>
          {report.byCashier.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cashier activity today.</p>
          ) : (
            <div className="space-y-3">
              {report.byCashier.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.count} payments</p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-primary">{fmt(c.total)} {report.currency}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">By Category</h3>
          </div>
          {report.byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment categories today.</p>
          ) : (
            <div className="space-y-3">
              {report.byCategory.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.count} payments</p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-primary">{fmt(c.total)} {report.currency}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl"
      >
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Hourly Breakdown</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`${fmt(value)} ${report.currency}`, "Amount"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {hourlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(var(--primary) / ${0.3 + (entry.amount / maxHourlyAmount) * 0.7})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </>
  );
};
