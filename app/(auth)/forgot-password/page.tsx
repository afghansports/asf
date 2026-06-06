import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Afghan Sports Federation password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="font-condensed text-xs font-bold tracking-[0.22em] uppercase text-asf-red">
          Account recovery
        </p>
        <h1 className="font-display text-3xl font-black text-asf-text">Forgot password</h1>
        <p className="text-sm text-asf-muted">
          Enter your email and we will send a reset link.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
