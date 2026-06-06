/**
 * Sports + positions per ASF_LAUNCH_PRD.md > Platform Configuration Defaults.
 * Source of truth for SportPicker, PositionPicker, and the onboarding sport pills.
 */

import type { LucideIcon } from "lucide-react";
import {
  Goal,
  Volleyball,
  Circle,
  Disc,
  TableProperties,
} from "lucide-react";

export type SportCode =
  | "soccer"
  | "basketball"
  | "volleyball"
  | "bowling"
  | "table_tennis";

export interface Position {
  code: string;
  name: string;
}

export interface Sport {
  code: SportCode;
  name: string;
  description: string;
  icon: LucideIcon;
  positions: Position[];
}

export const SPORTS: Sport[] = [
  {
    code: "soccer",
    name: "Soccer",
    description: "The world's game, played on every continent.",
    icon: Goal,
    positions: [
      { code: "GK",  name: "Goalkeeper" },
      { code: "CB",  name: "Center Back" },
      { code: "LB",  name: "Left Back" },
      { code: "RB",  name: "Right Back" },
      { code: "CDM", name: "Defensive Midfielder" },
      { code: "CM",  name: "Central Midfielder" },
      { code: "CAM", name: "Attacking Midfielder" },
      { code: "LW",  name: "Left Winger" },
      { code: "RW",  name: "Right Winger" },
      { code: "ST",  name: "Striker" },
    ],
  },
  {
    code: "basketball",
    name: "Basketball",
    description: "Five on five, pace and skill.",
    icon: Circle,
    positions: [
      { code: "PG", name: "Point Guard" },
      { code: "SG", name: "Shooting Guard" },
      { code: "SF", name: "Small Forward" },
      { code: "PF", name: "Power Forward" },
      { code: "C",  name: "Center" },
    ],
  },
  {
    code: "volleyball",
    name: "Volleyball",
    description: "Fast hands and sharp tactics.",
    icon: Volleyball,
    positions: [
      { code: "S",   name: "Setter" },
      { code: "OH",  name: "Outside Hitter" },
      { code: "OPP", name: "Opposite" },
      { code: "MB",  name: "Middle Blocker" },
      { code: "L",   name: "Libero" },
      { code: "DS",  name: "Defensive Specialist" },
    ],
  },
  {
    code: "bowling",
    name: "Bowling",
    description: "Strikes, spares, ten frames.",
    icon: Disc,
    positions: [],
  },
  {
    code: "table_tennis",
    name: "Table Tennis",
    description: "Precision, spin, fast reactions.",
    icon: TableProperties,
    positions: [],
  },
];

export const SPORT_BY_CODE: Record<SportCode, Sport> = SPORTS.reduce(
  (acc, s) => {
    acc[s.code] = s;
    return acc;
  },
  {} as Record<SportCode, Sport>
);

export function getSport(code: string): Sport | undefined {
  return SPORT_BY_CODE[code as SportCode];
}

export function getPositionsForSport(code: string): Position[] {
  return getSport(code)?.positions ?? [];
}
