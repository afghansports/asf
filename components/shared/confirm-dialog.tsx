"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * ConfirmDialog. Per ASF_LAUNCH_PRD.md > Reusable Components.
 * Wraps shadcn-nova Dialog with simple confirm/cancel buttons.
 */
type Props = {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: Props) {
  return (
    <Dialog>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" className="h-9">
                {cancelLabel}
              </Button>
            }
          />
          <DialogClose
            render={
              <Button
                onClick={onConfirm}
                className={
                  destructive
                    ? "h-9 bg-asf-red text-white hover:bg-asf-red-dark"
                    : "h-9 bg-asf-navy text-white hover:bg-asf-navy-light"
                }
              >
                {confirmLabel}
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
