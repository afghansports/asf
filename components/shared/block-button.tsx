"use client";

import { useState, useTransition } from "react";
import { ShieldOff, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { blockUser, unblockUser } from "@/lib/safety/actions";

export function BlockButton({
  blockedId,
  username,
  initialBlocked,
  className,
}: {
  blockedId: string;
  username: string | null;
  initialBlocked: boolean;
  className?: string;
}) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function go() {
    setErr(null);
    start(async () => {
      const r = blocked ? await unblockUser(blockedId) : await blockUser(blockedId);
      if (r.ok) setBlocked((b) => !b);
      else setErr(r.message);
    });
  }

  if (blocked) {
    return (
      <Button
        type="button"
        onClick={go}
        disabled={pending}
        className={className ?? "h-9 px-3 bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"}
      >
        <Shield className="w-3.5 h-3.5" aria-hidden />
        {pending ? "Unblocking" : "Unblock"}
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            className={className ?? "h-9 px-3 bg-white border border-asf-border text-asf-text hover:bg-asf-red hover:text-white"}
          >
            <ShieldOff className="w-3.5 h-3.5" aria-hidden />
            Block
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block @{username ?? "user"}?</DialogTitle>
          <DialogDescription>
            They will not be able to see your profile, posts, comments, or send you messages. Your existing follows in either direction are removed. They will not be told they were blocked.
          </DialogDescription>
        </DialogHeader>
        {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="h-9">Cancel</Button>} />
          <DialogClose
            render={
              <Button
                onClick={go}
                disabled={pending}
                className="h-9 bg-asf-red text-white hover:bg-asf-red-dark"
              >
                {pending ? "Blocking" : "Block"}
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
