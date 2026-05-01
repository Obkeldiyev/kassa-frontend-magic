import { Inbox } from "lucide-react";
export const EmptyState = ({ title = "Nothing here yet", desc = "Records will appear here as you add them." }: { title?: string; desc?: string }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
      <Inbox className="h-5 w-5" />
    </div>
    <p className="mt-3 font-display text-lg font-semibold">{title}</p>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>
  </div>
);
