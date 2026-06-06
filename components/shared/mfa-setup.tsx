"use client";

import { useEffect, useState, useTransition } from "react";
import { Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { FixedImage } from "@/components/shared/optimized-image";
import {
  enrollMfa,
  verifyEnrollment,
  listMfaFactors,
  unenrollMfa,
} from "@/lib/auth/mfa";

type Factor = { id: string; friendlyName: string; status: string; createdAt: string };

/**
 * Two-factor setup using Supabase TOTP. Three states:
 *   1. Idle — show "Set up 2FA" button. List existing verified factors.
 *   2. Enrolling — QR code displayed; user scans + types 6-digit code.
 *   3. Verified — show enabled state + Remove button.
 *
 * Drop into /profile/edit Account tab.
 */
export function MfaSetup() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enroll, setEnroll] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err"; m: string }>({ kind: "idle", m: "" });

  async function refresh() {
    const r = await listMfaFactors();
    if (r.ok) setFactors(r.data ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  function startEnroll() {
    start(async () => {
      const r = await enrollMfa();
      if (r.ok && r.data) setEnroll(r.data);
      else setStatus({ kind: "err", m: r.ok ? "Unexpected" : r.message });
    });
  }

  function verify() {
    if (!enroll) return;
    start(async () => {
      const r = await verifyEnrollment({ factorId: enroll.factorId, code });
      if (r.ok) {
        setStatus({ kind: "ok", m: "2FA enabled. You will be asked for a code on next sign-in." });
        setEnroll(null);
        setCode("");
        await refresh();
      } else {
        setStatus({ kind: "err", m: r.message });
      }
    });
  }

  function remove(factorId: string) {
    start(async () => {
      const r = await unenrollMfa(factorId);
      if (r.ok) {
        setStatus({ kind: "ok", m: "2FA factor removed." });
        await refresh();
      } else {
        setStatus({ kind: "err", m: r.message });
      }
    });
  }

  const verified = factors.some((f) => f.status === "verified");

  return (
    <div className="space-y-3">
      <p className="font-condensed font-bold text-xs tracking-[0.22em] uppercase text-asf-text inline-flex items-center gap-1.5">
        {verified ? <ShieldCheck className="w-3.5 h-3.5 text-asf-green" aria-hidden /> : <Shield className="w-3.5 h-3.5" aria-hidden />}
        Two-factor authentication
      </p>

      {status.kind === "ok" ? (
        <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{status.m}</Alert>
      ) : null}
      {status.kind === "err" ? (
        <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{status.m}</Alert>
      ) : null}

      {factors.length > 0 ? (
        <ul className="space-y-2">
          {factors.map((f) => (
            <li key={f.id} className="flex items-center gap-3 p-3 rounded-md border border-asf-border bg-white">
              <ShieldCheck className="w-4 h-4 text-asf-green" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-asf-text">{f.friendlyName}</p>
                <p className="text-xs text-asf-muted">
                  Status: {f.status} . enrolled {new Date(f.createdAt).toLocaleDateString("en-US")}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => remove(f.id)}
                disabled={pending}
                className="h-8 bg-asf-red-light text-asf-red border border-asf-red/30 hover:bg-asf-red hover:text-white"
              >
                <ShieldOff className="w-3.5 h-3.5" aria-hidden />
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {enroll ? (
        <div className="rounded-md p-4 border border-asf-border bg-asf-off space-y-3">
          <p className="text-sm text-asf-text">
            Scan the QR with Google Authenticator, 1Password, Authy, or any TOTP app, then enter the 6-digit code.
          </p>
          <div className="flex flex-col items-center gap-2">
            <FixedImage src={enroll.qrCode} alt="2FA QR code" width={192} height={192} className="w-48 h-48 bg-white p-2 rounded-md" />
            <p className="text-[0.65rem] font-mono break-all text-asf-muted max-w-xs text-center">
              Manual setup secret: {enroll.secret}
            </p>
          </div>
          <div className="space-y-1.5 max-w-xs mx-auto">
            <Label htmlFor="totp">6-digit code</Label>
            <Input
              id="totp"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              onClick={verify}
              disabled={pending || code.length !== 6}
              className="h-10 bg-asf-red text-white hover:bg-asf-red-dark"
            >
              Verify and enable
            </Button>
            <Button
              type="button"
              onClick={() => setEnroll(null)}
              className="h-10 bg-white border border-asf-border text-asf-text hover:bg-asf-off-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : !verified ? (
        <Button
          type="button"
          onClick={startEnroll}
          disabled={pending}
          className="h-10 bg-asf-navy text-white hover:bg-asf-navy-light"
        >
          <Shield className="w-4 h-4" aria-hidden />
          Set up 2FA
        </Button>
      ) : null}
    </div>
  );
}
