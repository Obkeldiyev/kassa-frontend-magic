import { motion } from "framer-motion";

export const PageHeader = ({
  title, description, action,
}: { title: string; description?: string; action?: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="mb-8 flex flex-wrap items-end justify-between gap-4"
  >
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </motion.div>
);
