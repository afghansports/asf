"use client";

import { useState, useTransition } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CountryPicker } from "@/components/shared/country-picker";
import { StatePicker } from "@/components/shared/state-picker";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { saveOnboardingLocation } from "./actions";

interface Props {
  defaultCountry: string;
  defaultState: string;
}

export function LocationForm({ defaultCountry, defaultState }: Props) {
  const [country, setCountry] = useState(defaultCountry || "US");
  const [state, setState] = useState(defaultState);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    formData.set("country", country);
    formData.set("state", state);
    setError(null);
    startTransition(async () => {
      const res = await saveOnboardingLocation(formData);
      // saveOnboardingLocation redirects on success and only returns on error
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form action={onSubmit} className="bg-white border border-asf-border rounded-md shadow-sm p-6 sm:p-8 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Country</Label>
        <CountryPicker
          value={country}
          onChange={(code) => {
            setCountry(code);
            if (code !== "US") setState("");
          }}
        />
        {country !== "US" && (
          <p className="text-xs text-asf-muted">
            Your chapter is coming soon. You can sign up now and we will notify
            you when ASF launches in your country.
          </p>
        )}
      </div>

      {country === "US" && (
        <div className="space-y-2">
          <Label>State</Label>
          <StatePicker value={state} onChange={setState} />
        </div>
      )}

      <Button
        type="submit"
        disabled={pending || (country === "US" && !state)}
        className="w-full bg-asf-red hover:bg-asf-red-dark text-white font-condensed font-bold tracking-wide uppercase h-11"
      >
        {pending ? (
          <LoadingSpinner size="sm" inline className="text-white" />
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  );
}
