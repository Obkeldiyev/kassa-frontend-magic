import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";

interface Admin { id: string; first_name: string; last_name: string; username: string; createdAt: string; }

const Admins = () => {
  const [items, setItems] = useState<Admin[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", username: "", password: "" });

  const load = () =>
    api.get("/super-admin/admins")
      .then((r) => setItems(r.data?.data ?? r.data ?? []))
      .catch(() => setItems([]));

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/super-admin/admins", form);
      toast.success("Admin created");
      setOpen(false);
      setForm({ first_name: "", last_name: "", username: "", password: "" });
      load();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this admin?")) return;
    try { await api.delete(`/super-admin/admins/${id}`); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
  };

  return (
    <>
      <PageHeader
        title="Admins"
        description="Create and manage platform admins."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary shadow-elegant"><Plus className="mr-1 h-4 w-4" /> New admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create admin</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>First name</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required className="mt-1" /></div>
                  <div><Label>Last name</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required className="mt-1" /></div>
                </div>
                <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="mt-1" /></div>
                <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="mt-1" /></div>
                <DialogFooter>
                  <Button type="submit" disabled={loading} className="gradient-primary">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating</> : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {items.length === 0 ? (
        <EmptyState title="No admins yet" desc="Create your first admin to get started." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-elegant"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl gradient-aurora text-white shadow-glow">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{a.first_name} {a.last_name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{a.username}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                <button onClick={() => remove(a.id)} className="rounded-md p-1.5 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
};
export default Admins;
