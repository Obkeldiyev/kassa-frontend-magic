import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ApiBaseSetting } from "@/components/ApiBaseSetting";
import { LogOut, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface NavItem { to: string; label: string; icon: LucideIcon; }

interface Props { title: string; nav: NavItem[]; }

export const DashboardLayout = ({ title, nav }: Props) => {
  const { logout, role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl">
          <div className="flex items-center gap-2 px-6 py-6">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-aurora shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none">Kassa</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</p>
            </div>
          </div>
          <nav className="flex-1 px-3 py-2">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end
                className={({ isActive }) =>
                  `group relative mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="active-pill"
                        className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <n.icon className="relative h-4 w-4" />
                    <span className="relative">{n.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-border/60 p-3">
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl md:px-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Signed in as</p>
              <p className="font-display text-sm font-semibold">{role?.replace("_", " ")}</p>
            </div>
            <div className="flex items-center gap-2">
              <ApiBaseSetting />
              <ThemeToggle />
            </div>
          </header>

          {/* Mobile nav */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border/60 bg-card/40 px-4 py-2 md:hidden">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`
                }
              >
                <n.icon className="h-3.5 w-3.5" />
                {n.label}
              </NavLink>
            ))}
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="ml-auto flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" /> Out
            </button>
          </nav>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
