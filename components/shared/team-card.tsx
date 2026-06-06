import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, ArrowRight } from "lucide-react";
import { getSport } from "@/lib/data/sports";
import { US_STATES } from "@/lib/data/us-states";
import { cn } from "@/lib/utils";

/**
 * TeamCard. Per ASF_LAUNCH_PRD.md > STEP 8 list view.
 * 60px circle logo (or initial), name (Playfair), sport, city/state, member
 * count, "Looking for Players" / "ASF Affiliate" badges, View Team CTA.
 */

export type TeamCardData = {
  id: string;
  name: string;
  slug: string;
  sport: string;
  city: string | null;
  state_province: string | null;
  member_count: number | null;
  logo_url: string | null;
  is_looking_for_players: boolean | null;
  is_asf_affiliate: boolean | null;
};

export function TeamCard({ team, className }: { team: TeamCardData; className?: string }) {
  const sport = getSport(team.sport);
  const Icon = sport?.icon;
  const stateName = team.state_province
    ? US_STATES.find((s) => s.code === team.state_province)?.name ?? team.state_province
    : null;

  return (
    <article
      className={cn(
        "group flex flex-col h-full rounded-lg border border-asf-border bg-white overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg",
        className
      )}
    >
      <div className="p-5 pb-3 flex items-start gap-4">
        <span className="relative inline-flex w-14 h-14 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-lg overflow-hidden shrink-0">
          {team.logo_url ? (
            <Image src={team.logo_url} alt="" fill className="object-cover" sizes="56px" unoptimized />
          ) : (
            <span aria-hidden>{team.name.charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-asf-text leading-snug truncate">
            {team.name}
          </h3>
          <p className="text-xs text-asf-muted inline-flex items-center gap-1.5 mt-1">
            {Icon ? <Icon className="w-3.5 h-3.5 text-asf-navy" aria-hidden /> : null}
            <span>{sport?.name ?? team.sport}</span>
          </p>
        </div>
      </div>

      <div className="px-5 pb-3 flex flex-wrap items-center gap-3 text-xs text-asf-muted">
        {team.city || stateName ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" aria-hidden />
            <span>{[team.city, stateName].filter(Boolean).join(", ")}</span>
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" aria-hidden />
          <span>{team.member_count ?? 0} players</span>
        </span>
      </div>

      <div className="px-5 pb-5 mt-auto">
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {team.is_looking_for_players ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-green-light text-asf-green text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
              Looking for players
            </span>
          ) : null}
          {team.is_asf_affiliate ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-gold-light text-asf-text text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
              ASF affiliate
            </span>
          ) : null}
        </div>
        <Link
          href={`/teams/${team.slug}`}
          className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md bg-asf-off-2 text-asf-text hover:bg-asf-navy hover:text-white font-condensed font-bold text-xs tracking-[0.18em] uppercase transition-colors"
        >
          View team
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
