"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { ActionButton } from "../_action-button";
import { AdminToggle } from "../_toggle";
import { saveDistrict, deleteDistrict } from "../_reels-actions";

export type DistrictRow = {
  id: string;
  country_code: string;
  province_code: string;
  province_name: string;
  code: string;
  name: string;
  is_active: boolean;
};

export function GeoAdmin({ rows }: { rows: DistrictRow[] }) {
  const [filterProvince, setFilterProvince] = useState("");
  const [country, setCountry] = useState("AF");
  const [provinceCode, setProvinceCode] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [pending, startTx] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "idle"; m: string }>({ kind: "idle", m: "" });

  const provinces = Array.from(
    new Map(
      rows
        .filter((r) => r.country_code === country)
        .map((r) => [r.province_code, r.province_name])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const visible = rows.filter(
    (r) => r.country_code === country && (!filterProvince || r.province_code === filterProvince)
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTx(async () => {
      const r = await saveDistrict({
        countryCode: country,
        provinceCode: provinceCode.trim().toUpperCase(),
        provinceName: provinceName.trim(),
        code: code.trim().toUpperCase(),
        name: name.trim(),
        isActive: true,
      });
      if (r.ok) {
        setMsg({ kind: "ok", m: "Added." });
        setCode("");
        setName("");
        window.setTimeout(() => window.location.reload(), 600);
      } else {
        setMsg({ kind: "err", m: r.message });
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Add form */}
      <form onSubmit={onSubmit} className="rounded-lg border border-asf-border bg-white p-5 space-y-4">
        <h2 className="font-display font-bold text-lg text-asf-text">Add district</h2>
        {msg.kind === "ok" ? <Alert className="border-asf-green/40 bg-asf-green-light text-asf-green">{msg.m}</Alert> : null}
        {msg.kind === "err" ? <Alert className="border-asf-red/40 bg-asf-red-light text-asf-red">{msg.m}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="h-10 w-full rounded-md border border-asf-border bg-white px-3 text-sm"
            >
              <option value="AF">Afghanistan</option>
              <option value="US">United States</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prov_code">Prov code</Label>
            <Input
              id="prov_code"
              required
              value={provinceCode}
              onChange={(e) => setProvinceCode(e.target.value)}
              placeholder="KAB"
              maxLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prov_name">Prov name</Label>
            <Input
              id="prov_name"
              required
              value={provinceName}
              onChange={(e) => setProvinceName(e.target.value)}
              placeholder="Kabul"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dcode">District code</Label>
            <Input
              id="dcode"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="KAB-XYZ"
              maxLength={20}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dname">District name</Label>
            <Input
              id="dname"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <Button type="submit" disabled={pending} className="bg-asf-red text-white hover:bg-asf-red-dark h-10 px-5">
          {pending ? "Adding" : "Add district"}
        </Button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setFilterProvince("");
          }}
          className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm"
        >
          <option value="AF">Afghanistan</option>
          <option value="US">United States</option>
        </select>
        <select
          value={filterProvince}
          onChange={(e) => setFilterProvince(e.target.value)}
          className="h-9 rounded-md border border-asf-border bg-white px-3 text-sm"
        >
          <option value="">All provinces</option>
          {provinces.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <span className="text-xs text-asf-muted ml-auto">
          {visible.length} districts
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-asf-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-asf-off border-b border-asf-border">
            <tr className="text-left">
              <Th>Province</Th>
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Active</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-t border-asf-border">
                <td className="px-4 py-2 text-asf-muted">{r.province_name} <span className="text-asf-muted/60">({r.province_code})</span></td>
                <td className="px-4 py-2 font-mono text-xs text-asf-text">{r.code}</td>
                <td className="px-4 py-2 text-asf-text">{r.name}</td>
                <td className="px-4 py-2">
                  <AdminToggle
                    initial={r.is_active}
                    action={async (v) => saveDistrict({ id: r.id, countryCode: r.country_code, provinceCode: r.province_code, provinceName: r.province_name, code: r.code, name: r.name, isActive: v })}
                    ariaLabel={`Active toggle for ${r.name}`}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <ActionButton
                    action={() => deleteDistrict(r.id)}
                    label="Delete"
                    variant="danger"
                    confirm={`Delete ${r.name}?`}
                  />
                </td>
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-asf-muted text-sm">No districts.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-condensed font-bold text-[0.65rem] tracking-[0.22em] uppercase text-asf-muted">
      {children}
    </th>
  );
}
