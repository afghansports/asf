"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ShieldOff, Award, AlertTriangle, RefreshCcw, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { FillImage } from "@/components/shared/optimized-image";
import {
  issueStrike,
  issueSuspension,
  liftSuspension,
  setShadowBan,
  setVerificationStatus,
} from "@/lib/safety/moderation";
import { cn } from "@/lib/utils";

export type ProfileLite = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  country_code: string | null;
  is_active: boolean;
  shadow_banned: boolean;
  verification_status: string | null;
  false_report_count: number;
  strikes: number;
  suspension: { id: string; type: string; ends_at: string | null; reason: string } | null;
};

export function ModerationAdmin({ profiles }: { profiles: ProfileLite[] }) {
  return (
    <div className="rounded-lg border border-asf-border bg-white divide-y divide-asf-border">
      {profiles.map((p) => (
        <Row key={p.id} profile={p} />
      ))}
      {profiles.length === 0 ? (
        <p className="p-8 text-center text-asf-muted text-sm">No users match.</p>
      ) : null}
    </div>
  );
}

function Row({ profile }: { profile: ProfileLite }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "idle"; m: string }>({ kind: "idle", m: "" });

  // Strike state
  const [severity, setSeverity] = useState<"minor" | "moderate" | "severe" | "immediate_ban">("minor");
  const [strikeReason, setStrikeReason] = useState("");

  // Suspension state
  const [suspType, setSuspType] = useState<"posting_only" | "full" | "permanent">("posting_only");
  const [suspDays, setSuspDays] = useState("1");
  const [suspReason, setSuspReason] = useState("");

  function action(fn: () => Promise<{ ok: boolean; message?: string }>, successMsg: string) {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        setMsg({ kind: "ok", m: successMsg });
        window.setTimeout(() => window.location.reload(), 700);
      } else {
        setMsg({ kind: "err", m: r.message ?? "Failed." });
      }
    });
  }

  return (
    <div className="p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 text-start"
      >
        <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden shrink-0">
          {profile.avatar_url ? (
            <FillImage src={profile.avatar_url} alt="" className="object-cover" sizes="36px" />
          ) : (
            <span aria-hidden>{(profile.full_name ?? profile.username ?? "?").charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-asf-text truncate">
            {profile.full_name ?? profile.username}
            {profile.verification_status === "verified" ? (
              <BadgeCheck className="inline-block w-3.5 h-3.5 ms-1 text-blue-500 fill-current" />
            ) : null}
            {profile.verification_status === "official" ? (
              <BadgeCheck className="inline-block w-3.5 h-3.5 ms-1 text-asf-gold fill-current" />
            ) : null}
          </p>
          <p className="text-xs text-asf-muted">@{profile.username}</p>
        </div>
        <div className="flex items-center gap-2 text-[0.7rem]">
          {profile.suspension ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-red text-white font-condensed font-bold tracking-[0.18em] uppercase">
              {profile.suspension.type.replace("_", " ")}
            </span>
          ) : null}
          {profile.shadow_banned ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-gold-light text-asf-text font-condensed font-bold tracking-[0.18em] uppercase">
              Shadow
            </span>
          ) : null}
          {!profile.is_active ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-off-2 text-asf-muted font-condensed font-bold tracking-[0.18em] uppercase">
              Inactive
            </span>
          ) : null}
          {profile.strikes > 0 ? (
            <span className="text-asf-red font-medium">{profile.strikes} strike{profile.strikes === 1 ? "" : "s"}</span>
          ) : null}
        </div>
      </button>

      {open ? (
        <div className="mt-4 ps-12 space-y-5">
          {msg.kind === "ok" ? <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{msg.m}</Alert> : null}
          {msg.kind === "err" ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{msg.m}</Alert> : null}

          <Link
            href={`/profile/${profile.username}`}
            className="text-xs text-asf-red hover:underline"
            target="_blank"
          >
            View public profile →
          </Link>

          {/* Quick toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() =>
                action(() => setShadowBan(profile.id, !profile.shadow_banned), profile.shadow_banned ? "Shadow ban lifted." : "Shadow banned.")
              }
              disabled={pending}
              className={cn(
                "h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase",
                profile.shadow_banned
                  ? "bg-asf-gold text-asf-text hover:bg-asf-gold/80"
                  : "bg-white border border-asf-border text-asf-text hover:bg-asf-off-2",
              )}
            >
              <ShieldOff className="w-3.5 h-3.5" aria-hidden />
              {profile.shadow_banned ? "Lift shadow ban" : "Shadow ban"}
            </Button>
            <SelectMini
              label="Verification"
              value={profile.verification_status ?? "unverified"}
              options={[
                { v: "unverified", label: "Unverified" },
                { v: "verified", label: "Verified" },
                { v: "official", label: "Official" },
              ]}
              onChange={(v) =>
                action(
                  () => setVerificationStatus(profile.id, v as "unverified" | "verified" | "official"),
                  "Verification updated.",
                )
              }
              disabled={pending}
              icon={<Award className="w-3.5 h-3.5" aria-hidden />}
            />
            {profile.suspension ? (
              <Button
                type="button"
                onClick={() => action(() => liftSuspension(profile.suspension!.id), "Suspension lifted.")}
                disabled={pending}
                className="h-9 px-3 text-xs font-condensed font-bold tracking-[0.16em] uppercase bg-asf-green-light text-asf-green hover:bg-asf-green hover:text-white"
              >
                <RefreshCcw className="w-3.5 h-3.5" aria-hidden />
                Lift suspension
              </Button>
            ) : null}
          </div>

          {/* Issue a strike */}
          <div className="rounded-md p-4 border border-asf-border bg-asf-off space-y-3">
            <p className="font-condensed font-bold text-xs tracking-[0.22em] uppercase text-asf-text inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-asf-red" aria-hidden />
              Issue strike
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Severity</Label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as typeof severity)}
                  className="h-9 w-full rounded-md border border-asf-border bg-white px-2 text-sm"
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="immediate_ban">Immediate ban</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Reason</Label>
                <Input value={strikeReason} onChange={(e) => setStrikeReason(e.target.value)} placeholder="Brief reason shown to the user" />
              </div>
            </div>
            <Button
              type="button"
              onClick={() =>
                action(
                  () => issueStrike({ userId: profile.id, severity, reason: strikeReason || "Community Guidelines violation." }),
                  "Strike issued.",
                )
              }
              disabled={pending}
              className="h-9 bg-asf-red text-white hover:bg-asf-red-dark"
            >
              {pending ? "Issuing" : "Issue strike"}
            </Button>
          </div>

          {/* Issue a suspension */}
          <div className="rounded-md p-4 border border-asf-border bg-asf-off space-y-3">
            <p className="font-condensed font-bold text-xs tracking-[0.22em] uppercase text-asf-text inline-flex items-center gap-1.5">
              <ShieldOff className="w-3.5 h-3.5 text-asf-red" aria-hidden />
              Issue suspension
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <select
                  value={suspType}
                  onChange={(e) => setSuspType(e.target.value as typeof suspType)}
                  className="h-9 w-full rounded-md border border-asf-border bg-white px-2 text-sm"
                >
                  <option value="posting_only">Posting only</option>
                  <option value="full">Full</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (days)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={suspDays}
                  onChange={(e) => setSuspDays(e.target.value)}
                  disabled={suspType === "permanent"}
                />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs">Reason</Label>
                <Input value={suspReason} onChange={(e) => setSuspReason(e.target.value)} />
              </div>
            </div>
            <Button
              type="button"
              onClick={() =>
                action(
                  () =>
                    issueSuspension({
                      userId: profile.id,
                      type: suspType,
                      reason: suspReason || "Community Guidelines violation.",
                      durationDays: suspType === "permanent" ? null : Number(suspDays) || 1,
                    }),
                  "Suspension issued.",
                )
              }
              disabled={pending}
              className="h-9 bg-asf-red text-white hover:bg-asf-red-dark"
            >
              {pending ? "Issuing" : "Issue suspension"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SelectMini({
  label,
  value,
  options,
  onChange,
  disabled,
  icon,
}: {
  label: string;
  value: string;
  options: { v: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white border border-asf-border text-xs">
      {icon}
      <span className="text-asf-muted">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-transparent text-asf-text font-medium outline-none"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}
