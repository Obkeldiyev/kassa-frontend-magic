import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Receipt, ShieldCheck, Users, Zap, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ApiBaseSetting } from "@/components/ApiBaseSetting";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Receipt, title: "Payments at a glance", desc: "Issue, search and inspect every receipt with full payer & terminal context." },
  { icon: Users, title: "Cashier control", desc: "Onboard cashiers, set credentials, monitor activity in real time." },
  { icon: ShieldCheck, title: "Role-based access", desc: "SuperAdmin, Admin and Cashier — each with the right permissions." },
  { icon: Zap, title: "Fast & responsive", desc: "Built with React and an Express + Prisma backend on Postgres." },
];

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-aurora shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold">Kassa</span>
        </div>
        <div className="flex items-center gap-2">
          <ApiBaseSetting />
          <ThemeToggle />
          <Link to="/login">
            <Button variant="default" className="gradient-primary shadow-elegant">
              Sign in <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12 md:px-10 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Live cashier platform
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Run your <span className="text-gradient">cash desk</span> like the future already arrived.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A beautifully crafted frontend for your Kassa backend. Manage admins, cashiers and payments — fast, secure and lovely to use.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg" className="gradient-primary shadow-elegant hover-lift">
                Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="backdrop-blur">Explore features</Button>
            </a>
          </div>
        </motion.div>

        <div id="features" className="mt-24 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-white shadow-glow transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-10 backdrop-blur-xl text-center"
        >
          <h2 className="font-display text-3xl font-bold md:text-4xl">Three roles. One platform.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            SuperAdmins create the world. Admins run it. Cashiers move money through it.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {["SUPER_ADMIN", "ADMIN", "CASHIER"].map((r) => (
              <div key={r} className="rounded-2xl border border-border/60 bg-background/40 px-5 py-4 text-sm font-medium">
                {r.replace("_", " ")}
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
