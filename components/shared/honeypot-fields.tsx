"use client";

import { useState, useEffect } from "react";
import { HONEYPOT_FIELD } from "@/lib/security/honeypot";

/**
 * Drop-in honeypot fields for any form. Renders an off-screen input that bots
 * fill and humans don't, plus a hidden timestamp the server checks against
 * MIN_FILL_MS. Place inside a <form>; pair with detectSpam() in the server
 * action.
 */
export function HoneypotFields() {
  const [renderedAt, setRenderedAt] = useState("");
  useEffect(() => {
    setRenderedAt(String(Date.now()));
  }, []);
  return (
    <>
      <div aria-hidden className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden">
        <label>
          Leave this field empty
          <input
            type="text"
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>
      <input type="hidden" name="rendered_at" value={renderedAt} readOnly />
    </>
  );
}
