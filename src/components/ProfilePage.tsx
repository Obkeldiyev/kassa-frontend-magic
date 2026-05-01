import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, Lock, AtSign } from "lucide-react";
import { motion } from "framer-motion";

type Variant = "ADMIN" | "CASHIER";
const base = (v: Variant) => (v === "ADMIN" ? "/admin" : "/cashier");

export const ProfilePage = ({ variant }: { variant: Variant }) => {
  const [profile, setProfile] = useState<any>(null);
  const [first, setFirst] = useState(""); const [last, setLast] = useState(""); const [middle, setMiddle] = useState("");
  const [oldPw, setOldPw] = useState(""); const [newPw, setNewPw] = useState("");
  const [newUser, setNewUser] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const load = () => api.get(`${base(variant)}/profile`).then((r) => {
    const d = r.data?.data ?? r.data;
    setProfile(d); setFirst(d.first_name || ""); setLast(d.last_name || ""); setMiddle(d.middle_name || ""); setNewUser(d.username || "");
  }).catch(() => {});
  useEffect(() => { load(); }, [variant]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingProfile(true);
    try {
      const body: any = { first_name: first, last_name: last };
      if (variant === "CASHIER") body.middle_name = middle;
      await api.patch(`${base(variant)}/profile`, body);
      toast.success("Profile updated"); load();
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingPw(true);
    try { await api.patch(`${base(variant)}/password`, { old_password: oldPw, new_password: newPw });
      toast.success("Password changed"); setOldPw(""); setNewPw(""); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
    finally { setSavingPw(false); }
  };

  const saveUsername = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingUser(true);
    try { await api.patch(`${base(variant)}/username`, { new_username: newUser });
      toast.success("Username changed"); load(); }
    catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
    finally { setSavingUser(false); }
  };

  return (
    <>
      <PageHeader title="Profile" description="Manage your personal info, username and password." />
      <div className="grid gap-5 lg:grid-cols-2">
        <motion.form initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
          onSubmit={saveProfile} className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2"><User className="h-4 w-4 text-primary" /><h3 className="font-display text-lg font-semibold">Personal info</h3></div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First name</Label><Input value={first} onChange={(e) => setFirst(e.target.value)} className="mt-1" /></div>
              <div><Label>Last name</Label><Input value={last} onChange={(e) => setLast(e.target.value)} className="mt-1" /></div>
            </div>
            {variant === "CASHIER" && <div><Label>Middle name</Label><Input value={middle} onChange={(e) => setMiddle(e.target.value)} className="mt-1" /></div>}
            <Button type="submit" disabled={savingProfile} className="gradient-primary">
              {savingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving</> : "Save"}
            </Button>
          </div>
        </motion.form>

        <motion.form initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay: 0.05 }}
          onSubmit={saveUsername} className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-2"><AtSign className="h-4 w-4 text-primary" /><h3 className="font-display text-lg font-semibold">Username</h3></div>
          <div className="space-y-3">
            <div><Label>New username</Label><Input value={newUser} onChange={(e) => setNewUser(e.target.value)} className="mt-1" /></div>
            <Button type="submit" disabled={savingUser} className="gradient-primary">
              {savingUser ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving</> : "Update username"}
            </Button>
          </div>
        </motion.form>

        <motion.form initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay: 0.1 }}
          onSubmit={savePassword} className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl lg:col-span-2">
          <div className="mb-4 flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /><h3 className="font-display text-lg font-semibold">Password</h3></div>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Current password</Label><Input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className="mt-1" required /></div>
            <div><Label>New password</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="mt-1" required /></div>
          </div>
          <Button type="submit" disabled={savingPw} className="mt-4 gradient-primary">
            {savingPw ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving</> : "Change password"}
          </Button>
        </motion.form>
      </div>

      {profile && (
        <p className="mt-6 text-xs text-muted-foreground">
          Member since {new Date(profile.createdAt).toLocaleString()}
        </p>
      )}
    </>
  );
};
