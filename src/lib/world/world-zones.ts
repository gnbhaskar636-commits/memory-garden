import type { WorldZoneId, ZoneBounds } from "./world-types";

/**
 * Connected world layout:
 *
 *              FOREST (north)
 *                  |
 *  MEADOW ————— HOME ————— LAKE
 *   (west)              (east)
 */
export const ZONES: Record<WorldZoneId, ZoneBounds> = {
  home: {
    id: "home",
    label: "Home Garden",
    minX: -12,
    maxX: 12,
    minZ: -12,
    maxZ: 12,
    centerX: 0,
    centerZ: 0,
    groundColor: "#879d76",
    accentColor: "#9aaf7a",
  },
  meadow: {
    id: "meadow",
    label: "Happy Meadow",
    minX: -42,
    maxX: -14,
    minZ: -18,
    maxZ: 18,
    centerX: -28,
    centerZ: 0,
    groundColor: "#aabd86",
    accentColor: "#f0d878",
  },
  forest: {
    id: "forest",
    label: "Growth Forest",
    minX: -14,
    maxX: 14,
    minZ: 14,
    maxZ: 44,
    centerX: 0,
    centerZ: 29,
    groundColor: "#668262",
    accentColor: "#5a7d4a",
  },
  lake: {
    id: "lake",
    label: "Reflection Lake",
    minX: 14,
    maxX: 44,
    minZ: -18,
    maxZ: 18,
    centerX: 29,
    centerZ: 0,
    groundColor: "#78968d",
    accentColor: "#7a9aaa",
  },
};

export const ZONE_LIST = Object.values(ZONES);

/** Soft outer boundary of the entire world (camera clamp) */
export const WORLD_BOUNDS = {
  minX: -48,
  maxX: 50,
  minZ: -24,
  maxZ: 50,
};
