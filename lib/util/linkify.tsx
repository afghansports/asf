import Link from "next/link";

/**
 * Linkify text: turn #hashtags into Next links to /hashtags/<tag> and
 * @mentions into links to /profile/<username>. Returns a flat array of
 * React nodes that can be rendered in any text context.
 */
export function linkify(text: string): React.ReactNode[] {
  if (!text) return [];
  const out: React.ReactNode[] = [];
  const rx = /(#[A-Za-z0-9_]{1,50})|(@[A-Za-z0-9_]{3,30})/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = rx.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const hit = m[0];
    if (hit.startsWith("#")) {
      const tag = hit.slice(1).toLowerCase();
      out.push(
        <Link key={`h-${key++}`} href={`/hashtags/${tag}`} className="text-asf-red hover:underline">
          #{hit.slice(1)}
        </Link>,
      );
    } else {
      const u = hit.slice(1);
      out.push(
        <Link key={`m-${key++}`} href={`/profile/${u}`} className="text-asf-red hover:underline">
          @{u}
        </Link>,
      );
    }
    last = m.index + hit.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
