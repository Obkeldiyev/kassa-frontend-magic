import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Users, ShieldCheck, Activity } from "lucide-react";

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState(0);
  const [cashiers, setCashiers] = useState(0);

  useEffect(() => {
    api.get("/super-admin/admins").then((r) => setAdmins(r.data?.data?.length ?? r.data?.length ?? 0)).catch(() => {});
    api.get("/super-admin/cashiers").then((r) => setCashiers(r.data?.data?.length ?? r.data?.length ?? 0)).catch(() => {});
  }, []);

  return (
    <>
      <PageHeader title="Overview" description="The whole platform at a glance." />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard index={0} icon={ShieldCheck} label="Admins" value={admins} hint="Total platform admins" />
        <StatCard index={1} icon={Users} label="Cashiers" value={cashiers} hint="Active across all admins" />
        <StatCard index={2} icon={Activity} label="System" value="Online" hint="Backend reachable" />
      </div>
    </>
  );
};
export default SuperAdminDashboard;
