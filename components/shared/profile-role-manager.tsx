"use client";

import { useState, useTransition } from "react";
import { Plus, Check, X, ArrowRightLeft } from "lucide-react";
import {
  addProfileRole,
  revokeProfileRole,
  setActiveRole,
  ROLE_LABELS,
  type RoleKind,
} from "@/lib/roles/actions";
import { cn } from "@/lib/utils";

type ExistingRole = {
  kind: RoleKind;
  status: string;
  is_primary: boolean;
};

const ALL_ROLES: RoleKind[] = [
  "athlete",
  "coach",
  "manager",
  "parent",
  "referee",
  "volunteer",
  "sponsor",
  "press",
];

export function ProfileRoleManager({
  initialRoles,
  initialActive,
}: {
  initialRoles: ExistingRole[];
  initialActive: RoleKind;
}) {
  const [roles, setRoles] = useState<ExistingRole[]>(initialRoles);
  const [active, setActive] = useState<RoleKind>(initialActive);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function add(kind: RoleKind) {
    setErr(null);
    start(async () => {
      const r = await addProfileRole(kind);
      if (!r.ok) {
        setErr(r.message);
        return;
      }
      setRoles((rs) => [...rs.filter((x) => x.kind !== kind), { kind, status: "active", is_primary: false }]);
    });
  }

  function revoke(kind: RoleKind) {
    setErr(null);
    start(async () => {
      const r = await revokeProfileRole(kind);
      if (!r.ok) {
        setErr(r.message);
        return;
      }
      setRoles((rs) => rs.filter((x) => x.kind !== kind));
      if (active === kind) setActive("user");
    });
  }

  function activate(kind: RoleKind) {
    setErr(null);
    const prev = active;
    setActive(kind);
    start(async () => {
      const r = await setActiveRole(kind);
      if (!r.ok) {
        setActive(prev);
        setErr(r.message);
      }
    });
  }

  const heldKinds = new Set(roles.map((r) => r.kind));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted mb-2">Active persona</p>
        <div className="flex flex-wrap gap-2">
          {(["user", ...roles.filter((r) => r.kind !== "user").map((r) => r.kind)] as RoleKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => activate(k)}
              disabled={pending}
              className={cn(
                "h-8 px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-condensed font-bold tracking-[0.18em] uppercase",
                active === k
                  ? "bg-asf-navy text-white"
                  : "bg-white border border-asf-border text-asf-text hover:bg-asf-off-2",
              )}
            >
              {active === k ? <Check className="w-3 h-3" /> : <ArrowRightLeft className="w-3 h-3" />}
              {ROLE_LABELS[k].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted mb-2">My roles</p>
        <ul className="space-y-2">
          {roles.map((r) => (
            <li key={r.kind} className="flex items-start gap-3 p-3 rounded-md border border-asf-border bg-white">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-bold text-asf-text">{ROLE_LABELS[r.kind].label}</p>
                <p className="text-xs text-asf-muted">{ROLE_LABELS[r.kind].description}</p>
              </div>
              {r.kind !== "user" ? (
                <button
                  type="button"
                  onClick={() => revoke(r.kind)}
                  disabled={pending}
                  className="inline-flex items-center gap-1 text-xs text-asf-red hover:underline"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              ) : (
                <span className="text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted">Base</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase text-asf-muted mb-2">Add a role</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {ALL_ROLES.filter((k) => !heldKinds.has(k)).map((k) => (
            <li key={k}>
              <button
                type="button"
                onClick={() => add(k)}
                disabled={pending}
                className="w-full text-start p-3 rounded-md border border-asf-border bg-white hover:border-asf-red/50 hover:shadow-sm transition-all"
              >
                <p className="text-sm font-display font-bold text-asf-text inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-asf-red" />
                  {ROLE_LABELS[k].label}
                </p>
                <p className="text-xs text-asf-muted mt-0.5">{ROLE_LABELS[k].description}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {err ? <p className="text-xs text-asf-red">{err}</p> : null}
    </div>
  );
}
