"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { AlertCircle, Check, MapPin, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { getSport } from "@/lib/data/sports";
import { getCountryFlag } from "@/lib/data/countries";
import {
  followTeam,
  unfollowTeam,
  completeOnboarding,
} from "../actions";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  slug: string;
  sport: string;
  city: string | null;
  state_province: string | null;
  country_code: string;
  member_count: number;
  follower_count: number;
  is_looking_for_players: boolean;
  is_asf_affiliate: boolean;
  logo_url: string | null;
}

interface Props {
  teams: Team[];
  initialFollowed: string[];
}

export function CommunityForm({ teams, initialFollowed }: Props) {
  const [followed, setFollowed] = useState<Set<string>>(
    new Set(initialFollowed)
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();

  async function toggleFollow(teamId: string) {
    setError(null);
    setBusyId(teamId);
    const isFollowing = followed.has(teamId);

    // Optimistic update
    setFollowed((prev) => {
      const next = new Set(prev);
      if (isFollowing) next.delete(teamId);
      else next.add(teamId);
      return next;
    });

    const res = isFollowing
      ? await unfollowTeam(teamId)
      : await followTeam(teamId);

    if (!res.ok) {
      // Roll back on error
      setFollowed((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.add(teamId);
        else next.delete(teamId);
        return next;
      });
      setError(res.error ?? "Something went wrong.");
    }
    setBusyId(null);
  }

  function onContinue() {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding();
      // completeOnboarding redirects on success; only returns on error
      if (res && !res.ok) setError(res.error);
    });
  }

  const noTeams = teams.length === 0;
  const canContinue = noTeams || followed.size > 0;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {noTeams ? (
        <div className="bg-white border border-asf-border rounded-md shadow-sm p-8 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-asf-navy-pale text-asf-navy flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-black text-asf-text">
            Be among the first
          </h2>
          <p className="text-sm text-asf-muted">
            No teams have joined yet. After you finish onboarding you can create
            your own team and invite friends.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teams.map((team) => {
            const sport = getSport(team.sport);
            const SportIcon = sport?.icon;
            const isFollowing = followed.has(team.id);
            const isBusy = busyId === team.id;
            return (
              <div
                key={team.id}
                className="bg-white border border-asf-border rounded-md p-4 flex items-start gap-3 hover:shadow-sm transition-shadow"
              >
                {/* Logo or initial */}
                <div
                  className={cn(
                    "relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-display font-black text-lg overflow-hidden",
                    team.is_asf_affiliate
                      ? "bg-asf-gold-light text-asf-gold"
                      : "bg-asf-navy text-white"
                  )}
                  aria-hidden
                >
                  {team.logo_url ? (
                    <Image src={team.logo_url} alt="" fill className="object-cover" sizes="48px" unoptimized />
                  ) : (
                    team.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-asf-text truncate">
                      {team.name}
                    </h3>
                    {team.is_asf_affiliate && (
                      <span className="font-condensed text-[10px] font-bold tracking-[0.14em] uppercase bg-asf-gold-light text-asf-gold px-2 py-0.5 rounded-sm shrink-0">
                        Affiliate
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-asf-muted mt-1 flex-wrap">
                    {SportIcon && <SportIcon className="h-3 w-3" />}
                    <span className="capitalize">{sport?.name ?? team.sport}</span>
                    <span className="text-asf-border">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[team.city, team.state_province].filter(Boolean).join(", ") ||
                        team.country_code}
                      <span aria-hidden>{getCountryFlag(team.country_code)}</span>
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-asf-muted">
                    {team.member_count} {team.member_count === 1 ? "player" : "players"}
                  </div>

                  <Button
                    type="button"
                    onClick={() => toggleFollow(team.id)}
                    disabled={isBusy || submitting}
                    className={cn(
                      "mt-3 h-8 px-3 font-condensed font-bold text-xs tracking-[0.14em] uppercase",
                      isFollowing
                        ? "bg-asf-green hover:bg-asf-green text-white"
                        : "bg-asf-off-2 hover:bg-asf-navy hover:text-white text-asf-text"
                    )}
                  >
                    {isBusy ? (
                      <LoadingSpinner size="sm" inline className="text-current" />
                    ) : isFollowing ? (
                      <>
                        <Check className="h-3 w-3 me-1" />
                        Following
                      </>
                    ) : (
                      "Follow"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!noTeams && (
        <p className="text-center text-xs text-asf-muted">
          {followed.size === 0
            ? "Follow at least one team to continue."
            : `Following ${followed.size} ${followed.size === 1 ? "team" : "teams"}.`}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/onboarding/sports"
          className="font-condensed font-bold text-xs tracking-[0.14em] uppercase text-asf-muted hover:text-asf-text px-4 h-11 inline-flex items-center"
        >
          Back
        </Link>
        <Button
          type="button"
          onClick={onContinue}
          disabled={submitting || !canContinue}
          className="flex-1 bg-asf-red hover:bg-asf-red-dark text-white font-condensed font-bold tracking-wide uppercase h-11"
        >
          {submitting ? (
            <LoadingSpinner size="sm" inline className="text-white" />
          ) : noTeams ? (
            "Finish and continue"
          ) : (
            "Done. Take me in"
          )}
        </Button>
      </div>
    </div>
  );
}
