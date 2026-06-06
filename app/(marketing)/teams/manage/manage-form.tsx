"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, UserPlus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SportPicker } from "@/components/shared/sport-picker";
import { StatePicker } from "@/components/shared/state-picker";
import { ImageUpload } from "@/components/shared/image-upload";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { type SportCode } from "@/lib/data/sports";
import {
  updateTeam,
  findPlayerByUsername,
  addPlayer,
  removePlayer,
  updateMemberRole,
  deleteTeam,
} from "./actions";

type Member = {
  player_id: string;
  role: string;
  position: string | null;
  jersey_number: number | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type ManageInitial = {
  team: {
    id: string;
    name: string;
    slug: string;
    sport: string;
    state_province: string | null;
    city: string | null;
    description: string | null;
    logo_url: string | null;
    banner_url: string | null;
    is_looking_for_players: boolean;
    contact_email: string | null;
    contact_phone: string | null;
    captain_id: string;
  };
  members: Member[];
  currentUserId: string;
};

const ROLES = [
  { code: "player", label: "Player" },
  { code: "vice_captain", label: "Vice captain" },
  { code: "coach", label: "Coach" },
  { code: "manager", label: "Manager" },
];

export function ManageForm({ initial }: { initial: ManageInitial }) {
  return (
    <Tabs defaultValue="details" className="space-y-6">
      <TabsList variant="line" className="border-b border-asf-border w-full justify-start">
        <TabsTrigger value="details">Team details</TabsTrigger>
        <TabsTrigger value="roster">Roster</TabsTrigger>
        <TabsTrigger value="danger">Danger zone</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        <DetailsTab initial={initial} />
      </TabsContent>
      <TabsContent value="roster">
        <RosterTab initial={initial} />
      </TabsContent>
      <TabsContent value="danger">
        <DangerTab initial={initial} />
      </TabsContent>
    </Tabs>
  );
}

/* -------------------------------- Details -------------------------------- */

function DetailsTab({ initial }: { initial: ManageInitial }) {
  const t = initial.team;
  const [name, setName] = useState(t.name);
  const [sport, setSport] = useState<SportCode | "">((t.sport as SportCode) ?? "");
  const [state, setState] = useState(t.state_province ?? "");
  const [city, setCity] = useState(t.city ?? "");
  const [description, setDescription] = useState(t.description ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(t.logo_url);
  const [bannerUrl, setBannerUrl] = useState<string | null>(t.banner_url);
  const [looking, setLooking] = useState(t.is_looking_for_players);
  const [contactEmail, setContactEmail] = useState(t.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(t.contact_phone ?? "");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "idle"; msg: string }>({ kind: "idle", msg: "" });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await updateTeam(t.id, {
        name,
        sport: sport || "",
        state,
        city,
        description,
        logoUrl,
        bannerUrl,
        isLookingForPlayers: looking,
        contactEmail,
        contactPhone,
      });
      setStatus(r.ok ? { kind: "ok", msg: "Saved." } : { kind: "err", msg: r.message });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {status.kind === "ok" ? (
        <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{status.msg}</Alert>
      ) : null}
      {status.kind === "err" ? (
        <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{status.msg}</Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Team name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sport">Sport</Label>
          <SportPicker value={sport} onChange={(v) => setSport(v as SportCode | "")} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <StatePicker value={state} onChange={setState} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} disabled={pending} />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="description">Description</Label>
          <span className={description.length > 500 ? "text-xs text-asf-red" : "text-xs text-asf-muted"}>
            {description.length} / 500
          </span>
        </div>
        <Textarea
          id="description"
          rows={4}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Logo</Label>
          <ImageUpload
            bucket="team-logos"
            pathPrefix={`${t.id}/logo`}
            initialUrl={logoUrl}
            maxBytes={2 * 1024 * 1024}
            aspectRatio="1/1"
            label="Upload logo"
            onUploaded={(u) => setLogoUrl(u)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Banner</Label>
          <ImageUpload
            bucket="team-logos"
            pathPrefix={`${t.id}/banner`}
            initialUrl={bannerUrl}
            maxBytes={5 * 1024 * 1024}
            aspectRatio="16/6"
            label="Upload banner"
            onUploaded={(u) => setBannerUrl(u)}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact_email">Contact email</Label>
          <Input
            id="contact_email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_phone">Contact phone</Label>
          <Input
            id="contact_phone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            disabled={pending}
          />
        </div>
      </div>

      <Toggle
        label="Looking for players"
        checked={looking}
        onChange={setLooking}
        disabled={pending}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Saving" : "Save changes"}
        </Button>
        <Link href={`/teams/${t.slug}`} className="text-sm text-asf-muted hover:text-asf-text">
          View public page
        </Link>
      </div>
    </form>
  );
}

/* --------------------------------- Roster -------------------------------- */

function RosterTab({ initial }: { initial: ManageInitial }) {
  type FoundPlayer = {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  const [members, setMembers] = useState(initial.members);
  const [search, setSearch] = useState("");
  const [found, setFound] = useState<FoundPlayer | null>(null);
  const [searching, startSearch] = useTransition();
  const [pendingAdd, startAdd] = useTransition();
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "idle"; msg: string }>({ kind: "idle", msg: "" });

  function doSearch() {
    setStatus({ kind: "idle", msg: "" });
    startSearch(async () => {
      const r = await findPlayerByUsername(search);
      if (r.ok) setFound(r.data ?? null);
      if (r.ok && r.data == null) setStatus({ kind: "err", msg: "No member with that username." });
    });
  }

  function doAdd(role: string) {
    if (!found) return;
    startAdd(async () => {
      const r = await addPlayer(initial.team.id, found.id, role, null);
      if (r.ok) {
        setMembers((m) => [
          ...m,
          {
            player_id: found.id,
            role,
            position: null,
            jersey_number: null,
            username: found.username,
            full_name: found.full_name,
            avatar_url: found.avatar_url,
          },
        ]);
        setSearch("");
        setFound(null);
        setStatus({ kind: "ok", msg: `Added @${found.username}.` });
      } else {
        setStatus({ kind: "err", msg: r.message });
      }
    });
  }

  async function doRemove(playerId: string) {
    const r = await removePlayer(initial.team.id, playerId);
    if (r.ok) {
      setMembers((m) => m.filter((x) => x.player_id !== playerId));
      setStatus({ kind: "ok", msg: "Player removed." });
    } else {
      setStatus({ kind: "err", msg: r.message });
    }
  }

  async function doRoleChange(playerId: string, role: string) {
    const r = await updateMemberRole(initial.team.id, playerId, role);
    if (r.ok) {
      setMembers((m) => m.map((x) => (x.player_id === playerId ? { ...x, role } : x)));
    } else {
      setStatus({ kind: "err", msg: r.message });
    }
  }

  return (
    <div className="space-y-6">
      {status.kind === "ok" ? (
        <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{status.msg}</Alert>
      ) : null}
      {status.kind === "err" ? (
        <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{status.msg}</Alert>
      ) : null}

      <div className="p-5 rounded-lg bg-white border border-asf-border space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-asf-muted" aria-hidden />
          <span className="font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-text">
            Add a player by username
          </span>
        </div>
        <div className="flex items-stretch gap-2">
          <div className="flex items-stretch h-10 flex-1 rounded-md border border-asf-border bg-white">
            <span className="inline-flex items-center px-3 text-asf-muted text-xs border-r border-asf-border">@</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFound(null);
              }}
              placeholder="username"
              className="flex-1 bg-transparent px-3 text-sm outline-none"
            />
          </div>
          <Button type="button" onClick={doSearch} disabled={searching || !search.trim()} className="bg-asf-navy text-white hover:bg-asf-navy-light h-10">
            {searching ? "Searching" : "Search"}
          </Button>
        </div>

        {found ? (
          <div className="flex items-center gap-3 p-3 rounded-md border border-asf-border bg-asf-off">
            <span className="relative inline-flex w-9 h-9 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-sm overflow-hidden">
              {found.avatar_url ? (
                <Image src={found.avatar_url} alt="" fill className="object-cover" sizes="36px" unoptimized />
              ) : (
                <span aria-hidden>{(found.full_name ?? found.username ?? "?").charAt(0).toUpperCase()}</span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-asf-text truncate">{found.full_name ?? found.username}</p>
              <p className="text-xs text-asf-muted">@{found.username}</p>
            </div>
            <select
              defaultValue="player"
              onChange={(e) => doAdd(e.target.value)}
              disabled={pendingAdd}
              className="h-9 rounded-md border border-asf-border bg-white px-2 text-sm"
            >
              <option value="" disabled>
                Add as...
              </option>
              {ROLES.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
            <Button type="button" onClick={() => doAdd("player")} disabled={pendingAdd} className="h-9 bg-asf-red text-white hover:bg-asf-red-dark">
              <UserPlus className="w-3.5 h-3.5" aria-hidden />
              Add
            </Button>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-asf-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-left">
              <th className="px-4 py-3 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-muted">Player</th>
              <th className="px-4 py-3 font-condensed font-bold text-xs tracking-[0.18em] uppercase text-asf-muted">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const isCaptain = m.player_id === initial.team.captain_id;
              return (
                <tr key={m.player_id} className="border-t border-asf-border">
                  <td className="px-4 py-3">
                    <Link href={`/profile/${m.username}`} className="inline-flex items-center gap-2.5 hover:text-asf-red">
                      <span className="relative inline-flex w-8 h-8 rounded-full bg-asf-navy text-white items-center justify-center font-condensed font-bold text-xs overflow-hidden">
                        {m.avatar_url ? (
                          <Image src={m.avatar_url} alt="" fill className="object-cover" sizes="32px" unoptimized />
                        ) : (
                          <span aria-hidden>
                            {(m.full_name ?? m.username ?? "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span>
                        <span className="block text-asf-text">{m.full_name ?? m.username}</span>
                        <span className="block text-xs text-asf-muted">@{m.username}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {isCaptain ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-asf-red text-white text-[0.65rem] font-condensed font-bold tracking-[0.18em] uppercase">
                        Captain
                      </span>
                    ) : (
                      <select
                        value={m.role}
                        onChange={(e) => doRoleChange(m.player_id, e.target.value)}
                        className="h-8 rounded-md border border-asf-border bg-white px-2 text-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isCaptain ? null : (
                      <button
                        type="button"
                        onClick={() => doRemove(m.player_id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-asf-muted hover:bg-asf-red-light hover:text-asf-red"
                        aria-label={`Remove ${m.username}`}
                      >
                        <X className="w-4 h-4" aria-hidden />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------- Danger -------------------------------- */

function DangerTab({ initial }: { initial: ManageInitial }) {
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function doDelete() {
    setErr(null);
    startTransition(async () => {
      const r = await deleteTeam(initial.team.id, confirm);
      if (!r.ok) setErr(r.message);
    });
  }

  return (
    <div className="rounded-lg border border-asf-red/40 bg-asf-red-light p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Trash2 className="w-5 h-5 text-asf-red mt-0.5" aria-hidden />
        <div>
          <h3 className="font-display font-bold text-lg text-asf-red">Delete this team</h3>
          <p className="text-sm text-asf-text/85 leading-relaxed mt-1">
            Removes the team, the roster, the team page, and all events organized by this team.
            This cannot be undone.
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Type the team name to confirm</Label>
        <Input
          id="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={initial.team.name}
        />
      </div>
      {err ? (
        <Alert className="border-asf-red/40 bg-white text-asf-red">{err}</Alert>
      ) : null}
      <ConfirmDialog
        title="Delete team?"
        description="This action permanently removes the team. There is no undo."
        confirmLabel="Delete forever"
        destructive
        onConfirm={doDelete}
        trigger={
          <Button
            type="button"
            disabled={pending || confirm !== initial.team.name}
            className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5"
          >
            {pending ? "Deleting" : "Delete team"}
          </Button>
        }
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <span className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <span className="w-10 h-6 rounded-full bg-asf-border peer-checked:bg-asf-red transition-colors" />
        <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
      <span className="text-sm font-medium text-asf-text">{label}</span>
    </label>
  );
}
