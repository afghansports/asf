import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Afghan Sports Federation account.",
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="font-condensed text-xs font-bold tracking-[0.22em] uppercase text-asf-red">
          New password
        </p>
        <h1 className="font-display text-3xl font-black text-asf-text">Reset your password</h1>
        <p className="text-sm text-asf-muted">
          Choose a new password to finish signing in.
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
