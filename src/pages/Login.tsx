import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { api, dashboardPath, type Role } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const tabs: { value: Role; label: string; path: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin", path: "/super-admin/login" },
  { value: "ADMIN", label: "Admin", path: "/admin/login" },
  { value: "CASHIER", label: "Cashier", path: "/cashier/login" },
];

type LoginProps = {
  roles?: Role[];
  defaultRole?: Role;
};

const Login = ({ roles = ["ADMIN", "CASHIER"], defaultRole = "CASHIER" }: LoginProps) => {
  const availableTabs = tabs.filter((tab) => roles.includes(tab.value));
  const [active, setActive] = useState<Role>(roles.includes(defaultRole) ? defaultRole : availableTabs[0].value);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      const tab = tabs.find((t) => t.value === active)!;
      const res = await api.post(tab.path, { username, password });
      const token = res.data?.access_token;
      if (!token) throw new Error("No token returned");
      login(token, active);
      toast.success(`Welcome back, ${tab.label.toLowerCase()}`);
      navigate(dashboardPath(active));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

      <header className="relative z-10 flex items-center justify-end px-6 py-5 md:px-10">
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-md flex-col items-center justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl gradient-aurora shadow-glow animate-pulse-glow">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pick your role and sign in to continue.</p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-elegant backdrop-blur-xl">
            <Tabs value={active} onValueChange={(v) => setActive(v as Role)}>
              <TabsList className={`grid w-full ${availableTabs.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {availableTabs.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value={active} forceMount className="mt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          autoComplete="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="your.username"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="********"
                          className="mt-1.5"
                        />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full gradient-primary shadow-elegant hover-lift">
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                          </>
                        ) : (
                          `Sign in as ${tabs.find((t) => t.value === active)?.label}`
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Login;
