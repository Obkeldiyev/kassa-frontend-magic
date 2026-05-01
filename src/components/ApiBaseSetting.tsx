import { useState } from "react";
import { Server } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBase, setApiBase } from "@/lib/api";
import { toast } from "sonner";

export const ApiBaseSetting = () => {
  const [val, setVal] = useState(getApiBase());
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="API base URL"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/70 backdrop-blur transition-all hover:scale-110 hover:shadow-elegant active:scale-95"
        >
          <Server className="h-5 w-5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <Label>Backend API base URL</Label>
            <p className="mt-1 text-xs text-muted-foreground">Points to your Express server (default port 9000).</p>
          </div>
          <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="http://localhost:9000" />
          <Button
            className="w-full"
            onClick={() => { setApiBase(val); toast.success("API base updated"); }}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
