"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CountryPicker } from "@/components/shared/country-picker";
import { StatePicker } from "@/components/shared/state-picker";
import { PasswordInput } from "@/components/shared/password-input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

function suggestUsername(fullName: string): string {
  return fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\s]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 20);
}

function sanitizeUsername(raw: string): string {
  let v = raw.toLowerCase();
  if (v.includes("@")) v = v.split("@")[0] ?? "";
  v = v.replace(/[^a-z0-9_]/g, "");
  return v.slice(0, 30);
}

function ageInYears(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

type UsernameStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "invalid" }
  | { state: "taken" };

export function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState<string>("US");
  const [state, setState] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [parentalEmail, setParentalEmail] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const [confirmAge13, setConfirmAge13] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>({
    state: "idle",
  });

  const age = ageInYears(dob);
  const needsParentalConsent = age !== null && age >= 13 && age < 16;
  const tooYoung = age !== null && age < 13;

  // Auto-suggest username from name (until user manually edits the field)
  useEffect(() => {
    if (!usernameTouched && fullName) {
      setUsername(suggestUsername(fullName));
    }
  }, [fullName, usernameTouched]);

  // Live username uniqueness check (debounced)
  useEffect(() => {
    if (!username) {
      setUsernameStatus({ state: "idle" });
      return;
    }
    if (!USERNAME_RE.test(username)) {
      setUsernameStatus({ state: "invalid" });
      return;
    }
    setUsernameStatus({ state: "checking" });
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/username/check?u=${encodeURIComponent(username)}`,
          { signal: ctrl.signal }
        );
        const json = (await res.json()) as { available: boolean; reason?: string };
        if (json.available) {
          setUsernameStatus({ state: "available" });
        } else if (json.reason === "invalid") {
          setUsernameStatus({ state: "invalid" });
        } else {
          setUsernameStatus({ state: "taken" });
        }
      } catch {
        // ignore aborts
      }
    }, 350);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [username]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!username) {
      setError("Please choose a username.");
      return;
    }
    if (usernameStatus.state === "invalid") {
      setError("Username needs at least 3 characters and can only contain letters, numbers, and underscores.");
      return;
    }
    if (usernameStatus.state === "taken") {
      setError("That username is already taken. Please choose another.");
      return;
    }
    if (usernameStatus.state === "checking") {
      setError("Hold on, checking username availability...");
      return;
    }
    if (usernameStatus.state !== "available") {
      setError("Please pick a valid, available username.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (country === "US" && !state) {
      setError("Please select your state.");
      return;
    }

    // Age gate.
    if (!dob) {
      setError("Please enter your date of birth.");
      return;
    }
    if (age === null) {
      setError("Date of birth is invalid.");
      return;
    }
    if (tooYoung) {
      setError("You must be at least 13 years old to use ASF.");
      return;
    }
    if (!confirmAge13) {
      setError("Please confirm you are 13 or older.");
      return;
    }
    if (needsParentalConsent && !parentalEmail.trim()) {
      setError("Users under 16 need a parent or guardian email for consent.");
      return;
    }
    if (needsParentalConsent && parentalEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
      setError("Parent/guardian email must be different from your own email.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms, Privacy Policy, and Community Guidelines.");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          desired_username: username,
          country_code: country,
          state_province: country === "US" ? state : null,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    // The DB trigger creates a profiles row with a derived username; we update
    // it now so it matches what the user picked, plus DOB and (if needed)
    // parental consent email. The age trigger on profiles enforces 13+.
    if (data.user) {
      const updates: Record<string, unknown> = {
        username,
        full_name: fullName,
        country_code: country,
        state_province: country === "US" ? state : null,
        date_of_birth: dob,
      };
      if (needsParentalConsent) {
        updates.parental_consent_email = parentalEmail.trim().toLowerCase();
      }
      const { error: updateErr } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", data.user.id);
      if (updateErr && updateErr.message?.includes("min_age_13")) {
        setError("You must be at least 13 years old to use ASF.");
        setSubmitting(false);
        return;
      }
    }

    router.push("/verify-email");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 bg-white border border-asf-border p-6 sm:p-8 rounded-md shadow-sm"
      noValidate
    >
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ahmad Karimi"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <Input
            id="username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => {
              setUsernameTouched(true);
              setUsername(sanitizeUsername(e.target.value));
            }}
            placeholder="e.g. daud_n"
            className="pe-9"
          />
          <span className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center" aria-live="polite">
            {usernameStatus.state === "checking" && (
              <Loader2 className="h-4 w-4 animate-spin text-asf-muted" />
            )}
            {usernameStatus.state === "available" && (
              <Check className="h-4 w-4 text-asf-green" />
            )}
            {(usernameStatus.state === "invalid" || usernameStatus.state === "taken") && (
              <X className="h-4 w-4 text-asf-red" />
            )}
          </span>
        </div>
        <p className="text-xs text-asf-muted">
          {usernameStatus.state === "invalid" &&
            "Username needs at least 3 characters (letters, numbers, underscores only)."}
          {usernameStatus.state === "taken" && "That username is taken. Try another."}
          {usernameStatus.state === "available" && (
            <span className="text-asf-green">Available.</span>
          )}
          {usernameStatus.state === "checking" && "Checking availability..."}
          {usernameStatus.state === "idle" &&
            "Your public handle. Different from your email. Letters, numbers, underscores only."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>

      <div className="space-y-2">
        <Label>Country</Label>
        <CountryPicker
          value={country}
          onChange={(code) => {
            setCountry(code);
            if (code !== "US") setState("");
          }}
        />
      </div>

      {country === "US" && (
        <div className="space-y-2">
          <Label>State</Label>
          <StatePicker value={state} onChange={setState} />
        </div>
      )}

      {/* Age gate: required by Community Guidelines. */}
      <div className="space-y-2">
        <Label htmlFor="dob">Date of birth</Label>
        <Input
          id="dob"
          type="date"
          required
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
        />
        {tooYoung ? (
          <p className="text-xs text-asf-red">
            ASF is for users 13 and older. Please come back when you turn 13.
          </p>
        ) : age !== null ? (
          <p className="text-xs text-asf-muted">
            You are {age}. {needsParentalConsent ? "We will email a parent or guardian for consent." : ""}
          </p>
        ) : (
          <p className="text-xs text-asf-muted">
            Used only to verify you are 13 or older. Never shown publicly.
          </p>
        )}
      </div>

      {needsParentalConsent ? (
        <div className="space-y-2">
          <Label htmlFor="parental_email">Parent or guardian email</Label>
          <Input
            id="parental_email"
            type="email"
            required
            value={parentalEmail}
            onChange={(e) => setParentalEmail(e.target.value)}
            placeholder="parent@example.com"
          />
          <p className="text-xs text-asf-muted">
            Required for users under 16. We will send your parent or guardian a confirmation
            email. Your account stays in pending mode until they confirm.
          </p>
        </div>
      ) : null}

      <div className="flex items-start gap-3 pt-2">
        <Checkbox
          id="confirm-age"
          checked={confirmAge13}
          onCheckedChange={(v) => setConfirmAge13(v === true)}
        />
        <Label htmlFor="confirm-age" className="text-sm font-normal text-asf-text leading-relaxed cursor-pointer">
          I confirm I am 13 years old or older.
        </Label>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="agree"
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
        />
        <Label htmlFor="agree" className="text-sm font-normal text-asf-text leading-relaxed cursor-pointer">
          I agree to the{" "}
          <Link href="/terms" className="text-asf-red hover:text-asf-red-dark font-medium" target="_blank">
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/privacy" className="text-asf-red hover:text-asf-red-dark font-medium" target="_blank">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/community-guidelines" className="text-asf-red hover:text-asf-red-dark font-medium" target="_blank">
            Community Guidelines
          </Link>
          .
        </Label>
      </div>

      <Button
        type="submit"
        disabled={submitting || tooYoung}
        className="w-full bg-asf-red hover:bg-asf-red-dark text-white font-condensed font-bold tracking-wide uppercase h-11"
      >
        {submitting ? (
          <LoadingSpinner size="sm" inline className="text-white" />
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-sm text-asf-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-asf-red hover:text-asf-red-dark font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
