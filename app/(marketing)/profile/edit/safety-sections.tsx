"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Download,
  ShieldOff,
  AlertTriangle,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { SectionLabel } from "@/components/shared/section-label";
import { FillImage } from "@/components/shared/optimized-image";
import {
  unblockUser,
  requestAccountDeletion,
  cancelAccountDeletion,
  savePrivacySettings,
  type PrivacySettings,
} from "@/lib/safety/actions";

type Status = { kind: "idle" } | { kind: "ok"; m: string } | { kind: "err"; m: string };

export type BlockedRow = {
  blocked_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type SafetyInitial = {
  blockedUsers: BlockedRow[];
  privacy: PrivacySettings;
  deletionRequestedAt: string | null;
};

/**
 * Drop-in safety + GDPR + deeper-privacy panel rendered below the existing
 * 4-tab edit form. Five sections:
 *   1. Privacy v2 (deeper toggles)
 *   2. Block list (with unblock buttons)
 *   3. Data export (one-click JSON download via /api/me/export)
 *   4. Delete account (30-day soft-delete + cancel)
 *   5. Resources (Community Guidelines, Privacy Policy, Terms)
 */
export function SafetyAndGdprSections({ initial }: { initial: SafetyInitial }) {
  return (
    <div className="space-y-10 mt-10 pt-8 border-t border-asf-border">
      <PrivacyAdvanced initial={initial.privacy} />
      <BlockList initial={initial.blockedUsers} />
      <DataExportSection />
      <DeleteAccountSection requestedAt={initial.deletionRequestedAt} />
      <ResourcesSection />
    </div>
  );
}

/* ---------------------- 1. Privacy v2 ---------------------- */

function PrivacyAdvanced({ initial }: { initial: PrivacySettings }) {
  const [s, setS] = useState<PrivacySettings>(initial);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function update<K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) {
    const next = { ...s, [key]: value };
    setS(next);
    start(async () => {
      const r = await savePrivacySettings(next);
      setStatus({ kind: r.ok ? "ok" : "err", m: r.ok ? "Saved." : r.message });
    });
  }

  return (
    <section>
      <SectionLabel>Privacy</SectionLabel>
      <h2 className="mt-3 font-display font-bold text-xl text-asf-text">
        Who can do what to your account
      </h2>
      {status.kind === "ok" ? (
        <Alert className="mt-3 border-asf-green/40 bg-asf-green-light text-asf-green">
          {status.m}
        </Alert>
      ) : null}
      {status.kind === "err" ? (
        <Alert className="mt-3 border-asf-red/40 bg-asf-red-light text-asf-red">{status.m}</Alert>
      ) : null}

      <ul className="mt-4 rounded-lg border border-asf-border bg-white divide-y divide-asf-border">
        <Choice
          label="Who can send you direct messages"
          value={s.who_can_dm}
          options={[
            { v: "everyone", label: "Everyone" },
            { v: "follows", label: "People I follow" },
            { v: "nobody", label: "Nobody" },
          ]}
          onChange={(v) => update("who_can_dm", v as PrivacySettings["who_can_dm"])}
          disabled={pending}
        />
        <Choice
          label="Who can comment on your posts"
          value={s.who_can_comment}
          options={[
            { v: "everyone", label: "Everyone" },
            { v: "follows", label: "People I follow" },
            { v: "nobody", label: "Nobody" },
          ]}
          onChange={(v) => update("who_can_comment", v as PrivacySettings["who_can_comment"])}
          disabled={pending}
        />
        <Choice
          label="Who can tag you"
          value={s.who_can_tag}
          options={[
            { v: "everyone", label: "Everyone" },
            { v: "follows", label: "People I follow" },
            { v: "nobody", label: "Nobody" },
          ]}
          onChange={(v) => update("who_can_tag", v as PrivacySettings["who_can_tag"])}
          disabled={pending}
        />
        <Choice
          label="Who can see your followers and following"
          value={s.who_can_see_follows}
          options={[
            { v: "everyone", label: "Everyone" },
            { v: "me", label: "Only me" },
          ]}
          onChange={(v) => update("who_can_see_follows", v as PrivacySettings["who_can_see_follows"])}
          disabled={pending}
        />
        <Choice
          label="Who can see your team affiliations"
          value={s.who_can_see_teams}
          options={[
            { v: "everyone", label: "Everyone" },
            { v: "me", label: "Only me" },
          ]}
          onChange={(v) => update("who_can_see_teams", v as PrivacySettings["who_can_see_teams"])}
          disabled={pending}
        />
        <Choice
          label="Who can see your match history"
          value={s.who_can_see_matches}
          options={[
            { v: "everyone", label: "Everyone" },
            { v: "follows", label: "Followers" },
            { v: "me", label: "Only me" },
          ]}
          onChange={(v) => update("who_can_see_matches", v as PrivacySettings["who_can_see_matches"])}
          disabled={pending}
        />
        <li className="p-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <span className="relative mt-0.5 inline-flex items-center">
              <input
                type="checkbox"
                checked={s.read_receipts}
                onChange={(e) => update("read_receipts", e.target.checked)}
                disabled={pending}
                className="peer sr-only"
              />
              <span className="w-10 h-6 rounded-full bg-asf-border peer-checked:bg-asf-red transition-colors" />
              <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
            </span>
            <span>
              <span className="block text-sm font-medium text-asf-text">Send read receipts</span>
              <span className="block text-xs text-asf-muted leading-relaxed mt-0.5">
                Others see when you have read their direct messages.
              </span>
            </span>
          </label>
        </li>
      </ul>
    </section>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { v: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <li className="p-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-asf-text">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </li>
  );
}

/* ---------------------- 2. Block list ---------------------- */

function BlockList({ initial }: { initial: BlockedRow[] }) {
  const [list, setList] = useState(initial);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function remove(id: string) {
    start(async () => {
      const r = await unblockUser(id);
      if (r.ok) {
        setList((l) => l.filter((x) => x.blocked_id !== id));
        setStatus({ kind: "ok", m: "Unblocked." });
      } else {
        setStatus({ kind: "err", m: r.message });
      }
    });
  }

  return (
    <section>
      <SectionLabel>Blocked users</SectionLabel>
      <h2 className="mt-3 font-display font-bold text-xl text-asf-text">
        People you have blocked ({list.length})
      </h2>
      {status.kind === "ok" ? (
        <Alert className="mt-3 border-asf-green/40 bg-asf-green-light text-asf-green">
          {status.m}
        </Alert>
      ) : null}
      {status.kind === "err" ? (
        <Alert className="mt-3 border-asf-red/40 bg-asf-red-light text-asf-red">{status.m}</Alert>
      ) : null}

      <div className="mt-4 rounded-lg border border-asf-border bg-white">
        {list.length === 0 ? (
          <p className="p-6 text-center text-sm text-asf-muted">
            You have not blocked anyone. You can block from any profile, comment, or message.
          </p>
        ) : (
          <ul className="divide-y divide-asf-border">
            {list.map((b) => (
              <li key={b.blocked_id} className="p-4 flex items-center gap-3">
                <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                  {b.avatar_url ? (
                    <FillImage src={b.avatar_url} alt="" className="object-cover" sizes="36px" />
                  ) : (
                    <span aria-hidden>{(b.full_name ?? b.username ?? "?").charAt(0).toUpperCase()}</span>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-asf-text truncate">{b.full_name ?? b.username}</p>
                  <p className="text-xs text-asf-muted">@{b.username}</p>
                </div>
                <Button
                  type="button"
                  onClick={() => remove(b.blocked_id)}
                  disabled={pending}
                  className="h-9 bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
                >
                  Unblock
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ---------------------- 3. Data export ---------------------- */

function DataExportSection() {
  return (
    <section>
      <SectionLabel>Your data</SectionLabel>
      <h2 className="mt-3 font-display font-bold text-xl text-asf-text">
        Export everything
      </h2>
      <p className="mt-2 text-sm text-asf-muted">
        Download a JSON file with your profile, follows, team memberships, posts,
        comments, reels, and a manifest of your DM conversations. GDPR Article 20.
      </p>
      <a
        href="/api/me/export"
        className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-md bg-asf-navy text-white font-condensed font-bold text-xs tracking-[0.18em] uppercase hover:bg-asf-navy-light"
      >
        <Download className="w-4 h-4" aria-hidden />
        Download my data
      </a>
    </section>
  );
}

/* ---------------------- 4. Delete account ---------------------- */

function DeleteAccountSection({ requestedAt }: { requestedAt: string | null }) {
  const [scheduled, setScheduled] = useState(!!requestedAt);
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Days remaining until anonymization, if a deletion is pending.
  const daysLeft = (() => {
    if (!requestedAt) return null;
    const requested = new Date(requestedAt).getTime();
    const expires = requested + 30 * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)));
  })();

  function schedule() {
    if (confirm.toLowerCase() !== "delete") {
      setStatus({ kind: "err", m: "Type DELETE to confirm." });
      return;
    }
    start(async () => {
      const r = await requestAccountDeletion();
      if (r.ok) {
        setScheduled(true);
        setStatus({ kind: "ok", m: r.message ?? "Scheduled." });
      } else {
        setStatus({ kind: "err", m: r.message });
      }
    });
  }

  function cancel() {
    start(async () => {
      const r = await cancelAccountDeletion();
      if (r.ok) {
        setScheduled(false);
        setStatus({ kind: "ok", m: r.message ?? "Cancelled." });
      } else {
        setStatus({ kind: "err", m: r.message });
      }
    });
  }

  return (
    <section className="rounded-lg border border-asf-red/30 bg-asf-red-light p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-asf-red mt-0.5 shrink-0" aria-hidden />
        <div>
          <SectionLabel className="text-asf-red border-asf-red">Danger zone</SectionLabel>
          <h2 className="mt-2 font-display font-bold text-xl text-asf-red">Delete my account</h2>
          {scheduled ? (
            <p className="mt-2 text-sm text-asf-text">
              Deletion scheduled. Your account is hidden now and will be permanently anonymized in
              about <strong>{daysLeft} day{daysLeft === 1 ? "" : "s"}</strong>. Sign in within
              the window to cancel.
            </p>
          ) : (
            <p className="mt-2 text-sm text-asf-text">
              You can delete your account at any time. We schedule a 30-day window so you can
              recover your account if you change your mind. After 30 days your profile is fully
              anonymized: name, photo, bio, phone, date of birth all removed; posts attributed
              to a generic Deleted user label.
            </p>
          )}
        </div>
      </div>

      {status.kind === "ok" ? (
        <Alert className="border-asf-green/40 bg-white text-asf-green">{status.m}</Alert>
      ) : null}
      {status.kind === "err" ? (
        <Alert className="border-asf-red/40 bg-white text-asf-red">{status.m}</Alert>
      ) : null}

      {scheduled ? (
        <Button
          type="button"
          onClick={cancel}
          disabled={pending}
          className="h-10 px-5 bg-asf-navy text-white hover:bg-asf-navy-light"
        >
          <RefreshCcw className="w-4 h-4" aria-hidden />
          {pending ? "Cancelling" : "Cancel deletion"}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete">Type <strong>DELETE</strong> to confirm</Label>
            <Input
              id="confirm-delete"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="bg-white"
            />
          </div>
          <Button
            type="button"
            onClick={schedule}
            disabled={pending || confirm.toLowerCase() !== "delete"}
            className="h-10 px-5 bg-asf-red text-white hover:bg-asf-red-dark"
          >
            <ShieldOff className="w-4 h-4" aria-hidden />
            {pending ? "Scheduling" : "Schedule deletion"}
          </Button>
        </div>
      )}
    </section>
  );
}

/* ---------------------- 5. Resources ---------------------- */

function ResourcesSection() {
  return (
    <section>
      <SectionLabel>Resources</SectionLabel>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/community-guidelines", label: "Community Guidelines" },
          { href: "/privacy", label: "Privacy Policy" },
          { href: "/terms", label: "Terms of Service" },
        ].map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="flex items-center justify-between p-4 rounded-md bg-white border border-asf-border hover:border-asf-red/40"
            >
              <span className="text-sm text-asf-text">{r.label}</span>
              <ExternalLink className="w-4 h-4 text-asf-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
