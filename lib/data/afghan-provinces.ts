/**
 * Afghanistan: 34 provinces with their codes used by the geo_districts table.
 * Districts are stored in the DB (geo_districts) and editable via /admin/geo;
 * provinces are static and don't change, so they live here.
 */

export interface AfghanProvince {
  code: string;
  name: string;
}

export const AFGHAN_PROVINCES: AfghanProvince[] = [
  { code: "BDK", name: "Badakhshan" },
  { code: "BDG", name: "Badghis" },
  { code: "BGL", name: "Baghlan" },
  { code: "BAL", name: "Balkh" },
  { code: "BAM", name: "Bamyan" },
  { code: "DAY", name: "Daykundi" },
  { code: "FRH", name: "Farah" },
  { code: "FRY", name: "Faryab" },
  { code: "GHZ", name: "Ghazni" },
  { code: "GHO", name: "Ghor" },
  { code: "HEL", name: "Helmand" },
  { code: "HER", name: "Herat" },
  { code: "JOW", name: "Jowzjan" },
  { code: "KAB", name: "Kabul" },
  { code: "KAN", name: "Kandahar" },
  { code: "KAP", name: "Kapisa" },
  { code: "KHO", name: "Khost" },
  { code: "KNR", name: "Kunar" },
  { code: "KUN", name: "Kunduz" },
  { code: "LAG", name: "Laghman" },
  { code: "LOG", name: "Logar" },
  { code: "NAN", name: "Nangarhar" },
  { code: "NIM", name: "Nimruz" },
  { code: "NUR", name: "Nuristan" },
  { code: "PKA", name: "Paktia" },
  { code: "PKK", name: "Paktika" },
  { code: "PAN", name: "Panjshir" },
  { code: "PAR", name: "Parwan" },
  { code: "SAM", name: "Samangan" },
  { code: "SAR", name: "Sar-e Pol" },
  { code: "TAK", name: "Takhar" },
  { code: "URU", name: "Uruzgan" },
  { code: "WAR", name: "Maidan Wardak" },
  { code: "ZAB", name: "Zabul" },
];

export const AFGHAN_PROVINCE_BY_CODE: Record<string, AfghanProvince> =
  AFGHAN_PROVINCES.reduce((acc, p) => ((acc[p.code] = p), acc), {} as Record<string, AfghanProvince>);
