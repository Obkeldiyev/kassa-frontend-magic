import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Props { icon: LucideIcon; label: string; value: string | number; hint?: string; index?: number; }
export const StatCard = ({ icon: Icon, label, value, hint, index = 0 }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay: index * 0.07 }}
    className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-elegant"
  >
    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
    <div className="relative flex items-center justify-between">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-white shadow-glow">
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="relative mt-3 font-display text-3xl font-bold">{value}</p>
    {hint && <p className="relative mt-1 text-xs text-muted-foreground">{hint}</p>}
  </motion.div>
);
