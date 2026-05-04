import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { createPresetId, type ReceiverPreset } from "@/lib/paymentPresets";
import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

const blankPreset = (): ReceiverPreset => ({
  id: createPresetId(),
  name: "",
  account: "",
  inn: "",
  mfo: "",
});

type PaymentCategory = {
  id: string;
  name: string;
  sortOrder?: number;
};

const blankCategory = (): PaymentCategory => ({
  id: createPresetId(),
  name: "",
  sortOrder: 0,
});

export const ReceiverSettingsPage = () => {
  const [items, setItems] = useState<ReceiverPreset[]>([]);
  const [categories, setCategories] = useState<PaymentCategory[]>([]);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/admin/payment-receivers")
      .then((res) => {
        const next = (res.data?.data ?? []).map((item: ReceiverPreset) => ({
          ...item,
          mfo: item.MFO || item.mfo || "",
        }));
        setItems(next);
      })
      .catch(() => setItems([]));
    api.get("/admin/payment-categories")
      .then((res) => setCategories(res.data?.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  const update = (id: string | number, patch: Partial<ReceiverPreset>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateCategory = (id: string, patch: Partial<PaymentCategory>) => {
    setCategories((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const moveCategory = (targetId: string) => {
    if (!draggedCategoryId || draggedCategoryId === targetId) return;

    setCategories((current) => {
      const from = current.findIndex((item) => item.id === draggedCategoryId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((item, index) => ({ ...item, sortOrder: index }));
    });
  };

  const remove = async (id: string | number) => {
    if (typeof id === "number") {
      try {
        await api.delete(`/admin/payment-receivers/${id}`);
        toast.success("Receiver number removed");
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to remove");
        return;
      }
    }

    setItems((current) => current.filter((item) => item.id !== id));
  };

  const removeCategory = async (id: string) => {
    if (!id.startsWith("preset-")) {
      try {
        await api.delete(`/admin/payment-categories/${id}`);
        toast.success("Payment type removed");
      } catch (e: any) {
        toast.error(e?.response?.data?.message || "Failed to remove payment type");
        return;
      }
    }

    setCategories((current) => current.filter((item) => item.id !== id));
  };

  const save = async () => {
    const cleaned = items
      .map((item) => ({
        ...item,
        name: item.name.trim(),
        account: item.account.trim(),
        inn: item.inn.trim(),
        mfo: (item.mfo || item.MFO || "").trim(),
      }))
      .filter((item) => item.name && item.account && item.inn && item.mfo);

    if (cleaned.length !== items.length) {
      toast.error("Fill name, xisob raqam, MFO and INN for every row");
      return;
    }

    const cleanedCategories = categories
      .map((item, index) => ({ ...item, name: item.name.trim(), sortOrder: index }))
      .filter((item) => item.name);

    if (cleanedCategories.length !== categories.length) {
      toast.error("Fill every to'lov turi row");
      return;
    }

    setLoading(true);
    try {
      const saved = await Promise.all(cleaned.map(async (item) => {
        const body = { name: item.name, account: item.account, inn: item.inn, MFO: item.mfo, mfo: item.mfo };
        if (typeof item.id === "number") {
          const res = await api.patch(`/admin/payment-receivers/${item.id}`, body);
          const savedItem = res.data?.data ?? item;
          return { ...savedItem, mfo: savedItem.MFO || item.mfo };
        }
        const res = await api.post("/admin/payment-receivers", body);
        const savedItem = res.data?.data ?? item;
        return { ...savedItem, mfo: savedItem.MFO || item.mfo };
      }));

      const savedCategories = await Promise.all(cleanedCategories.map(async (item) => {
        const body = { name: item.name, sortOrder: item.sortOrder ?? 0 };
        if (!item.id.startsWith("preset-")) {
          const res = await api.patch(`/admin/payment-categories/${item.id}`, body);
          return res.data?.data ?? item;
        }
        const res = await api.post("/admin/payment-categories", body);
        return res.data?.data ?? item;
      }));

      setItems(saved);
      setCategories(savedCategories);
      toast.success("Payment settings saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save receiver numbers");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Payment numbers"
        description="Admin-controlled xisob raqam, INN and to'lov turi options for payment creation."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setItems((current) => [...current, blankPreset()])}>
              <Plus className="mr-2 h-4 w-4" /> Account
            </Button>
            <Button variant="outline" onClick={() => setCategories((current) => [...current, blankCategory()])}>
              <Plus className="mr-2 h-4 w-4" /> To'lov turi
            </Button>
            <Button onClick={save} disabled={loading} className="gradient-primary">
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        }
      />

      <div className="mb-6 overflow-hidden rounded-lg border border-border/60 bg-card/60">
        <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-muted/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <div className="col-span-1"></div>
          <div className="col-span-10">To'lov turi</div>
          <div className="col-span-1 text-right">Remove</div>
        </div>
        {categories.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Add payment categories that cashiers can choose.</div>
        ) : categories.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggedCategoryId(item.id)}
            onDragOver={(e) => {
              e.preventDefault();
              moveCategory(item.id);
            }}
            onDragEnd={() => setDraggedCategoryId(null)}
            className="grid grid-cols-12 gap-3 border-b border-border/40 px-4 py-3 last:border-b-0"
          >
            <div className="col-span-1 flex items-center">
              <button type="button" className="cursor-grab rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label={`Drag category ${index + 1}`}>
                <GripVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="col-span-9 md:col-span-10">
              <Label className="sr-only">To'lov turi</Label>
              <Input value={item.name} onChange={(e) => updateCategory(item.id, { name: e.target.value })} placeholder="Kontrakt to'lovi" />
            </div>
            <div className="col-span-2 flex justify-end md:col-span-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(item.id)} aria-label="Remove category">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState title="No numbers" desc="Add the account and INN options cashiers should use." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card/60">
          <div className="grid grid-cols-12 gap-3 border-b border-border/60 bg-muted/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <div className="col-span-4">Name</div>
            <div className="col-span-3">Xisob raqam</div>
            <div className="col-span-2">МФО</div>
            <div className="col-span-2">INN</div>
            <div className="col-span-1 text-right">Remove</div>
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 border-b border-border/40 px-4 py-3 last:border-b-0">
              <div className="col-span-12 md:col-span-4">
                <Label className="sr-only">Name</Label>
                <Input value={item.name} onChange={(e) => update(item.id, { name: e.target.value })} placeholder="Kontrakt to'lovi" />
              </div>
              <div className="col-span-12 md:col-span-3">
                <Label className="sr-only">Xisob raqam</Label>
                <Input value={item.account} onChange={(e) => update(item.id, { account: e.target.value })} placeholder="2020..." />
              </div>
              <div className="col-span-6 md:col-span-2">
                <Label className="sr-only">MFO</Label>
                <Input value={item.mfo || ""} onChange={(e) => update(item.id, { mfo: e.target.value })} placeholder="00423" />
              </div>
              <div className="col-span-6 md:col-span-2">
                <Label className="sr-only">INN</Label>
                <Input value={item.inn} onChange={(e) => update(item.id, { inn: e.target.value })} placeholder="301..." />
              </div>
              <div className="col-span-2 flex justify-end md:col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(item.id)} aria-label="Remove preset">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
