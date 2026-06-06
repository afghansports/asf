import Script from "next/script";

/**
 * Analytics. Plausible if NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set, otherwise
 * renders nothing. Privacy-friendly, cookieless, GDPR-clean — drop-in.
 */

export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const src =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";
  if (!domain) return null;
  return (
    <Script
      defer
      data-domain={domain}
      src={src}
      strategy="afterInteractive"
    />
  );
}
