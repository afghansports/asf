import type { Metadata } from "next";
import { RecoverAccountForm } from "./recover-account-form";

export const metadata: Metadata = {
  title: "Recover account",
  description: "Recover your Afghan Sports Federation account when you have lost access to your email.",
};

export default function RecoverAccountPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="font-condensed text-xs font-bold tracking-[0.22em] uppercase text-asf-red">
          Account recovery
        </p>
        <h1 className="font-display text-3xl font-black text-asf-text">Lost access to your email</h1>
        <p className="text-sm text-asf-muted">
          Tell us about your account and the new email you can use. A team member will verify your
          identity before moving your account.
        </p>
      </div>

      <RecoverAccountForm />
    </div>
  );
}
