"use client";

import { useState, useTransition, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { CountryPicker } from "@/components/shared/country-picker";
import { StatePicker } from "@/components/shared/state-picker";
import { SportPicker } from "@/components/shared/sport-picker";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { PasswordInput } from "@/components/shared/password-input";
import { getPositionsForSport, type SportCode } from "@/lib/data/sports";
import {
  saveBasicInfo,
  savePlayerSettings,
  saveAccountEmail,
  changePassword,
  saveNotificationPref,
  savePrivacy,
  syncAvatar,
  type ActionResult,
} from "./actions";

/**
 * 4-tab profile edit form. Per ASF_LAUNCH_PRD.md > STEP 7 > /profile/edit.
 *
 * Each tab owns its own state + submit handler. All actions return
 * `ActionResult` so we can show inline success/error without throwing.
 */

export type ProfileEditInitial = {
  userId: string;
  email: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  countryCode: string;
  stateProvince: string | null;
  city: string | null;
  isPlayer: boolean;
  sport: string | null;
  position: string | null;
  isFreeAgent: boolean;
  emailNotifications: boolean;
  showEmail: boolean;
  showPhone: boolean;
};

type Status =
  | { kind: "idle" }
  | { kind: "ok"; message: string }
  | { kind: "err"; message: string };

const initialStatus: Status = { kind: "idle" };

function StatusLine({ status }: { status: Status }) {
  if (status.kind === "idle") return null;
  if (status.kind === "ok") {
    return (
      <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">
        {status.message}
      </Alert>
    );
  }
  return (
    <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">
      {status.message}
    </Alert>
  );
}

export function ProfileEditForm({ initial }: { initial: ProfileEditInitial }) {
  return (
    <Tabs defaultValue="basic" className="space-y-6">
      <TabsList variant="line" className="border-b border-asf-border w-full justify-start">
        <TabsTrigger value="basic">Basic info</TabsTrigger>
        <TabsTrigger value="player">Player</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="privacy">Privacy</TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <BasicInfoTab initial={initial} />
      </TabsContent>
      <TabsContent value="player">
        <PlayerTab initial={initial} />
      </TabsContent>
      <TabsContent value="account">
        <AccountTab initial={initial} />
      </TabsContent>
      <TabsContent value="privacy">
        <PrivacyTab initial={initial} />
      </TabsContent>
    </Tabs>
  );
}

/* ----------------------------- BASIC INFO TAB ----------------------------- */

function BasicInfoTab({ initial }: { initial: ProfileEditInitial }) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio ?? "");
  const [country, setCountry] = useState(initial.countryCode);
  const [state, setState] = useState(initial.stateProvince ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(initialStatus);

  // Live username uniqueness check
  useEffect(() => {
    const u = username.trim();
    if (u === initial.username) {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/i.test(u)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/username/check?u=${encodeURIComponent(u)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "ok" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 350);
    return () => window.clearTimeout(id);
  }, [username, initial.username]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(initialStatus);
    startTransition(async () => {
      const result = await saveBasicInfo({
        fullName,
        username,
        bio,
        countryCode: country,
        stateProvince: country === "US" ? state || null : null,
        city,
        avatarUrl,
      });
      applyStatus(result, setStatus);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <StatusLine status={status} />

      <AvatarUpload
        userId={initial.userId}
        initialUrl={avatarUrl}
        fallbackInitial={(fullName || username || "?").charAt(0).toUpperCase()}
        onUploaded={async (url) => {
          setAvatarUrl(url);
          await syncAvatar(url);
        }}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name">
          <Input
            id="full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={pending}
          />
        </Field>
        <Field
          label="Username"
          htmlFor="username"
          hint={
            usernameStatus === "checking"
              ? "Checking..."
              : usernameStatus === "ok"
              ? "Available"
              : usernameStatus === "taken"
              ? "Taken"
              : usernameStatus === "invalid"
              ? "3-30 chars: letters, digits, underscore"
              : undefined
          }
          hintTone={
            usernameStatus === "ok" ? "ok" : usernameStatus === "taken" || usernameStatus === "invalid" ? "err" : "muted"
          }
        >
          <div className="flex items-stretch h-10 rounded-md border border-asf-border bg-white">
            <span className="inline-flex items-center px-3 text-asf-muted text-sm border-r border-asf-border">@</span>
            <input
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={pending}
              className="flex-1 bg-transparent px-3 text-sm outline-none"
            />
          </div>
        </Field>
      </div>

      <Field
        label="Bio"
        htmlFor="bio"
        hint={`${bio.length} / 200`}
        hintTone={bio.length > 200 ? "err" : "muted"}
      >
        <Textarea
          id="bio"
          rows={4}
          maxLength={200}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the community about yourself."
          disabled={pending}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Country" htmlFor="country">
          <CountryPicker
            value={country}
            onChange={(code) => {
              setCountry(code);
              if (code !== "US") setState("");
            }}
          />
        </Field>
        {country === "US" ? (
          <Field label="State" htmlFor="state">
            <StatePicker value={state} onChange={setState} />
          </Field>
        ) : (
          <Field label="City" htmlFor="city">
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={pending}
            />
          </Field>
        )}
      </div>

      {country === "US" ? (
        <Field label="City" htmlFor="city">
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={pending}
          />
        </Field>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={pending || usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "checking"}
          className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5"
        >
          {pending ? "Saving" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------- PLAYER TAB ------------------------------- */

function PlayerTab({ initial }: { initial: ProfileEditInitial }) {
  const [isPlayer, setIsPlayer] = useState(initial.isPlayer);
  const [sport, setSport] = useState<SportCode | "">((initial.sport as SportCode) ?? "");
  const [position, setPosition] = useState(initial.position ?? "");
  const [free, setFree] = useState(initial.isFreeAgent);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(initialStatus);

  const positions = sport ? getPositionsForSport(sport) : [];

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await savePlayerSettings({
        isPlayer,
        sport: isPlayer ? (sport || null) : null,
        position: isPlayer && position ? position : null,
        isFreeAgent: free,
      });
      applyStatus(result, setStatus);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <StatusLine status={status} />
      <Toggle
        label="I am a player"
        description="Show a player badge and let teams find you."
        checked={isPlayer}
        onChange={setIsPlayer}
      />

      {isPlayer ? (
        <div className="space-y-5 pl-1 border-l-2 border-asf-red/30 pl-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Sport" htmlFor="sport">
              <SportPicker
                value={sport}
                onChange={(v) => {
                  setSport(v as SportCode | "");
                  setPosition("");
                }}
              />
            </Field>
            {positions.length > 0 ? (
              <Field label="Position" htmlFor="position">
                <select
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm"
                >
                  <option value="">Select position</option>
                  {positions.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
          </div>
          <Toggle
            label="Looking for a team"
            description="Show a Free Agent badge so captains can recruit you."
            checked={free}
            onChange={setFree}
          />
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5"
      >
        {pending ? "Saving" : "Save changes"}
      </Button>
    </form>
  );
}

/* ------------------------------- ACCOUNT TAB ------------------------------ */

function AccountTab({ initial }: { initial: ProfileEditInitial }) {
  return (
    <div className="space-y-10">
      <ChangeEmailForm currentEmail={initial.email} />
      <ChangePasswordForm />
      <NotificationPref initial={initial.emailNotifications} />
    </div>
  );
}

function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(initialStatus);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveAccountEmail(email);
      applyStatus(result, setStatus);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="font-display font-bold text-lg text-asf-text">Email</h3>
      <StatusLine status={status} />
      <Field label="Email address" htmlFor="email">
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
        />
      </Field>
      <p className="text-xs text-asf-muted">
        Changing your email sends a confirmation link. You will keep using the old email until you click the link.
      </p>
      <Button
        type="submit"
        disabled={pending || email === currentEmail}
        className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5"
      >
        {pending ? "Sending" : "Update email"}
      </Button>
    </form>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(initialStatus);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setStatus({ kind: "err", message: "New passwords do not match." });
      return;
    }
    startTransition(async () => {
      const result = await changePassword({ currentPassword: current, newPassword: next });
      applyStatus(result, setStatus);
      if (result.ok) {
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-6 border-t border-asf-border">
      <h3 className="font-display font-bold text-lg text-asf-text">Password</h3>
      <StatusLine status={status} />
      <Field label="Current password" htmlFor="current_password">
        <PasswordInput
          id="current_password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          disabled={pending}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="new_password">
          <PasswordInput
            id="new_password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            disabled={pending}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm_password">
          <PasswordInput
            id="confirm_password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={pending}
          />
        </Field>
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5"
      >
        {pending ? "Saving" : "Update password"}
      </Button>
    </form>
  );
}

function NotificationPref({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(initialStatus);

  function update(next: boolean) {
    setOn(next);
    startTransition(async () => {
      const result = await saveNotificationPref(next);
      applyStatus(result, setStatus);
    });
  }

  return (
    <div className="space-y-3 pt-6 border-t border-asf-border">
      <h3 className="font-display font-bold text-lg text-asf-text">Email notifications</h3>
      <StatusLine status={status} />
      <Toggle
        label="Send me event updates by email"
        description="Get an email when an event near you is published, or your team has news."
        checked={on}
        onChange={update}
        disabled={pending}
      />
    </div>
  );
}

/* ------------------------------- PRIVACY TAB ------------------------------ */

function PrivacyTab({ initial }: { initial: ProfileEditInitial }) {
  const [showEmail, setShowEmail] = useState(initial.showEmail);
  const [showPhone, setShowPhone] = useState(initial.showPhone);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(initialStatus);

  function update(next: { email: boolean; phone: boolean }) {
    setShowEmail(next.email);
    setShowPhone(next.phone);
    startTransition(async () => {
      const result = await savePrivacy({ showEmail: next.email, showPhone: next.phone });
      applyStatus(result, setStatus);
    });
  }

  return (
    <div className="space-y-5">
      <StatusLine status={status} />
      <Toggle
        label="Show my email to other members"
        description="When off, your email is hidden everywhere except admin tools."
        checked={showEmail}
        onChange={(v) => update({ email: v, phone: showPhone })}
        disabled={pending}
      />
      <Toggle
        label="Show my phone to other members"
        description="Recommended off unless you are a captain or coach."
        checked={showPhone}
        onChange={(v) => update({ email: showEmail, phone: v })}
        disabled={pending}
      />
    </div>
  );
}

/* --------------------------------- helpers -------------------------------- */

function applyStatus(result: ActionResult, setStatus: (s: Status) => void) {
  if (result.ok) {
    setStatus({ kind: "ok", message: result.message ?? "Saved." });
  } else {
    setStatus({ kind: "err", message: result.message });
  }
}

function Field({
  label,
  htmlFor,
  hint,
  hintTone = "muted",
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  hintTone?: "muted" | "ok" | "err";
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-asf-text">{label}</Label>
        {hint ? (
          <span
            className={
              hintTone === "ok"
                ? "text-xs text-asf-green"
                : hintTone === "err"
                ? "text-xs text-asf-red"
                : "text-xs text-asf-muted"
            }
          >
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <span className="relative mt-0.5 inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <span className="w-10 h-6 rounded-full bg-asf-border peer-checked:bg-asf-red transition-colors" />
        <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
      <span>
        <span className="block text-sm font-medium text-asf-text">{label}</span>
        {description ? (
          <span className="block text-xs text-asf-muted leading-relaxed mt-0.5">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
