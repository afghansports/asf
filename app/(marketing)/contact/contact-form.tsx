"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { CountryPicker } from "@/components/shared/country-picker";
import { COUNTRIES } from "@/lib/data/countries";
import { submitContact } from "./actions";

const SUBJECTS = [
  { code: "general", label: "General inquiry" },
  { code: "team_registration", label: "Team registration" },
  { code: "afghan_cup", label: "Afghan Cup" },
  { code: "volunteer", label: "Volunteer" },
  { code: "sponsorship", label: "Sponsorship" },
  { code: "media", label: "Media and press" },
  { code: "other", label: "Other" },
];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("US");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dial = COUNTRIES.find((c) => c.code === phoneCountry)?.dial ?? "1";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const r = await submitContact({
        name,
        email,
        phoneCountryCode: dial,
        phone,
        subject,
        message,
      });
      if (r.ok) setDone(true);
      else setErr(r.message);
    });
  }

  if (done) {
    return (
      <div className="rounded-lg p-8 bg-white border border-asf-border text-center space-y-3">
        <span className="inline-flex w-12 h-12 rounded-full bg-asf-green-light text-asf-green items-center justify-center">
          <CheckCircle2 className="w-6 h-6" aria-hidden />
        </span>
        <h2 className="font-display font-bold text-2xl text-asf-text">Message sent.</h2>
        <p className="text-asf-muted leading-relaxed max-w-md mx-auto">
          Thanks for reaching out. ASF will respond within a few business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {err ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{err}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c_name">Full name</Label>
          <Input id="c_name" required value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c_email">Email</Label>
          <Input id="c_email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c_phone">Phone (optional)</Label>
        <div className="flex items-stretch gap-2">
          <div className="w-44">
            <CountryPicker value={phoneCountry} onChange={(code) => setPhoneCountry(code)} />
          </div>
          <Input
            id="c_phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="555 123 4567"
            className="flex-1"
            disabled={pending}
          />
        </div>
        <p className="text-xs text-asf-muted">+{dial} prefix added on submit.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c_subject">Subject</Label>
        <select
          id="c_subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm"
        >
          <option value="">Select subject</option>
          {SUBJECTS.map((s) => (
            <option key={s.code} value={s.code}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="c_message">Message</Label>
          <span className={message.length > 0 && message.length < 20 ? "text-xs text-asf-red" : "text-xs text-asf-muted"}>
            {message.length} chars (min 20)
          </span>
        </div>
        <Textarea
          id="c_message"
          rows={6}
          required
          minLength={20}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={pending}
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-asf-red text-white hover:bg-asf-red-dark h-11 px-6"
      >
        {pending ? "Sending" : "Send message"}
      </Button>
    </form>
  );
}
