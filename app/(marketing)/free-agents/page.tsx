import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, UserSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionLabel } from "@/components/shared/section-label";
import { SPORTS, getSport, getPositionsForSport } from "@/lib/data/sports";
import { US_STATES } from "@/lib/data/us-states";
import { COUNTRIES } from "@/lib/data/countries";
import { isFeatureEnabled } from "@/lib/features/flags";
import { ModuleDisabled } from "@/components/shared/module-disabled";
import { FillImage } from "@/components/shared/optimized-image";

export const metadata: Metadata = {
  title: "Free agents",
  description:
    "Players looking for a team across the ASF community. Filter by sport and state.",
};

type SearchParams = { sport?: string; state?: string };

export default async function FreeAgentsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  if (!(await isFeatureEnabled("module.free_agents"))) return <ModuleDisabled name="Free agents" />;
  const sp = (searchParams ? await searchParams : {}) as SearchParams;

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, bio, city, state_province, country_code, sport, position",
    )
    .eq("is_player", true)
    .eq("is_free_agent", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(60);

  if (sp.sport) query = query.eq("sport", sp.sport);
  if (sp.state) query = query.eq("state_province", sp.state);

  const { data } = await query;
  const list = data ?? [];

  return (
    <>
      <PageHero
        eyebrow="Free agents"
        title="Players looking for a team."
        subtitle="Captains, find your next signing. Players, advertise yourself by switching on Free Agent in your profile settings."
      />

      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-asf-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-asf-muted text-xs font-condensed font-bold tracking-[0.18em] uppercase">
            <UserSearch className="w-3.5 h-3.5" aria-hidden />
            Filters
          </span>
          <form className="contents">
            <select
              name="sport"
              defaultValue={sp.sport ?? ""}
              className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm"
              aria-label="Sport"
            >
              <option value="">All sports</option>
              {SPORTS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              name="state"
              defaultValue={sp.state ?? ""}
              className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm max-w-[10rem]"
              aria-label="State"
            >
              <option value="">All states</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-9 px-4 rounded-md bg-asf-navy text-white text-xs font-condensed font-bold tracking-[0.16em] uppercase hover:bg-asf-navy-light"
            >
              Apply
            </button>
          </form>
          <span className="ms-auto text-xs text-asf-muted">{list.length} players</span>
        </div>
      </div>

      <section className="w-full bg-asf-off">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
          {list.length === 0 ? (
            <EmptyState
              icon={<UserSearch className="w-5 h-5" aria-hidden />}
              title="No free agents match those filters."
              description="Try clearing a filter, or invite players to flip the Free Agent toggle in their profile."
            />
          ) : (
            <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => {
                const sport = p.sport ? getSport(p.sport) : undefined;
                const Icon = sport?.icon;
                const stateName = p.state_province
                  ? US_STATES.find((s) => s.code === p.state_province)?.name
                  : undefined;
                const country = p.country_code
                  ? COUNTRIES.find((c) => c.code === p.country_code)
                  : undefined;
                const position =
                  p.sport && p.position
                    ? getPositionsForSport(p.sport).find((x) => x.code === p.position)
                    : undefined;
                const initial = (p.full_name ?? p.username ?? "?").charAt(0).toUpperCase();
                return (
                  <li key={p.id}>
                    <Link
                      href={`/profile/${p.username}`}
                      className="group flex flex-col h-full p-5 rounded-lg border border-asf-border bg-white hover:border-asf-red/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="relative inline-flex w-12 h-12 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold overflow-hidden">
                          {p.avatar_url ? (
                            <FillImage src={p.avatar_url} alt="" className="object-cover" sizes="48px" />
                          ) : (
                            <span aria-hidden>{initial}</span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-base text-asf-text truncate">
                            {p.full_name ?? p.username}
                          </p>
                          <p className="text-xs text-asf-muted">@{p.username}</p>
                        </div>
                        <span className="ms-auto inline-flex items-center px-2 py-0.5 rounded bg-asf-gold text-asf-text text-[0.6rem] font-condensed font-bold tracking-[0.18em] uppercase">
                          Free agent
                        </span>
                      </div>
                      <SectionLabel className="mt-4">Plays</SectionLabel>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-asf-muted">
                        {sport ? (
                          <span className="inline-flex items-center gap-1.5 text-asf-text">
                            {Icon ? <Icon className="w-3.5 h-3.5 text-asf-navy" aria-hidden /> : null}
                            {sport.name}
                          </span>
                        ) : null}
                        {position ? <span>{position.name}</span> : null}
                        {p.city || stateName ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" aria-hidden />
                            {[p.city, stateName].filter(Boolean).join(", ")}
                          </span>
                        ) : null}
                        {country && country.code !== "US" ? (
                          <span aria-hidden>{country.flag}</span>
                        ) : null}
                      </div>
                      {p.bio ? (
                        <p className="mt-3 text-sm text-asf-muted line-clamp-2">{p.bio}</p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
