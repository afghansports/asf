import "server-only";

/**
 * CSAM (child sexual abuse material) scanning SEAM.
 *
 * STATUS: provider not yet integrated. This file defines the interface and the
 * SAFETY POLICY, but scanning is NOT yet enforced on uploads.
 *
 * IMPORTANT — why it isn't wired yet: media uploads in this app currently go
 * CLIENT-SIDE directly to Supabase Storage (see components/shared/image-upload.tsx,
 * avatar-upload.tsx, app/(marketing)/reels/upload/upload-form.tsx). A check called
 * from the browser is trivially bypassable and gives false assurance. Enforcement
 * must therefore run SERVER-SIDE at one of:
 *   1. a Supabase Storage "object finalize" webhook / Edge Function that scans each
 *      new object and quarantines (keeps non-public) anything not cleared, or
 *   2. a server-side upload proxy route that every client upload must go through.
 *
 * When a provider is configured (PhotoDNA, Cloudflare CSAM Tool, or AWS Rekognition
 * moderation), set CSAM_PROVIDER + CSAM_PROVIDER_URL + CSAM_PROVIDER_KEY and call
 * scanImageForCsam() from the server-side enforcement point above. On a positive
 * match you MUST follow your legal reporting obligation (NCMEC in the US / IWF in the
 * UK) and preserve evidence per counsel's guidance — do not simply delete.
 *
 * Policy: FAIL-CLOSED. Media is publishable ONLY when it has been scanned and is
 * clear. Unscanned or errored media must not be served publicly (see isPublishable).
 */

export type CsamScanResult =
  | { scanned: true; match: boolean; provider: string; details?: string }
  | { scanned: false; status: "not_configured" | "error"; provider: string; message?: string };

export interface CsamScanInput {
  /** Public or signed URL the provider can fetch. */
  url?: string;
  /** Raw bytes, if scanning before the object is reachable by URL. */
  bytes?: Uint8Array;
  contentType?: string;
}

export interface CsamScanner {
  readonly name: string;
  scan(input: CsamScanInput): Promise<CsamScanResult>;
}

/** Default when no provider is configured: scans nothing, says so loudly. */
class NotConfiguredScanner implements CsamScanner {
  readonly name = "not_configured";
  async scan(): Promise<CsamScanResult> {
    console.warn(
      "[csam] No CSAM scanning provider configured (CSAM_PROVIDER unset). Media is NOT being scanned."
    );
    return { scanned: false, status: "not_configured", provider: this.name };
  }
}

/**
 * Generic HTTP adapter. Adapt the request/response shape to your chosen vendor.
 * Expects a JSON response containing a boolean match indicator.
 */
class HttpScanner implements CsamScanner {
  readonly name: string;
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    name = "http"
  ) {
    this.name = name;
  }

  async scan(input: CsamScanInput): Promise<CsamScanResult> {
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ url: input.url, contentType: input.contentType }),
      });
      if (!res.ok) {
        return { scanned: false, status: "error", provider: this.name, message: `HTTP ${res.status}` };
      }
      const data = (await res.json()) as { match?: boolean; isMatch?: boolean; flagged?: boolean };
      const match = Boolean(data.match ?? data.isMatch ?? data.flagged);
      return { scanned: true, match, provider: this.name };
    } catch (e) {
      return {
        scanned: false,
        status: "error",
        provider: this.name,
        message: e instanceof Error ? e.message : "scan failed",
      };
    }
  }
}

let cached: CsamScanner | null = null;

export function getCsamScanner(): CsamScanner {
  if (cached) return cached;
  const provider = process.env.CSAM_PROVIDER;
  const url = process.env.CSAM_PROVIDER_URL;
  const key = process.env.CSAM_PROVIDER_KEY;
  if (provider && url && key) {
    cached = new HttpScanner(url, key, provider);
  } else {
    cached = new NotConfiguredScanner();
  }
  return cached;
}

export function scanImageForCsam(input: CsamScanInput): Promise<CsamScanResult> {
  return getCsamScanner().scan(input);
}

/**
 * FAIL-CLOSED publishability gate. Media may be served publicly ONLY when it has
 * been scanned and did not match. Callers at the server-side enforcement point
 * should quarantine (do not expose) anything for which this returns false.
 *
 * NOTE: returns false while no provider is configured — intentionally. Flip on
 * enforcement only once a provider is wired, or you will block all uploads.
 */
export function isPublishable(result: CsamScanResult): boolean {
  return result.scanned === true && result.match === false;
}
