/**
 * Who is where at a live event: some people walk (alone or in pairs, facing the
 * way they go), others stand in small circles facing each other and take turns
 * gesturing as they talk. Positions are metres east/north of the venue; the 3D
 * models are drawn by lib/map/people-layer.ts.
 */
/** People are drawn larger than life so they read at street zoom. */
export const PERSON_SCALE = 3;
const SCALE = PERSON_SCALE;
const WANDER_M = 20;
const GAIT_RATE = 4.5;
const PANTS = ["#1f2937", "#374151", "#1e3a8a", "#44403c"];
const SHIRTS = ["#f97316", "#38bdf8", "#f472b6", "#a78bfa", "#facc15", "#ef4444", "#34d399", "#f5f5f4"];

type Person =
  | { kind: "walker"; seed: number; side: number }
  | { kind: "talker"; seed: number; home: { east: number; north: number }; facing: number };

export interface Pose {
  east: number;
  north: number;
  heading: number;
  /** -1..1 stride phase; 0 when standing. */
  swing: number;
  /** 0..1 how far the speaking arm is raised. */
  gesture: number;
  /** Metres the figure is lifted off the ground (while someone holds them up). */
  lift?: number;
  shirt: string;
  pants: string;
}

function chatGroup(seed: number, angle: number, size: number): Person[] {
  const centre = { east: Math.cos(angle) * 11, north: Math.sin(angle) * 11 };
  return Array.from({ length: size }, (_, i) => {
    const around = (i / size) * Math.PI * 2 + seed;
    const ring = 0.7 * SCALE;
    return {
      kind: "talker" as const,
      seed: seed * 10 + i,
      home: { east: centre.east + Math.cos(around) * ring, north: centre.north + Math.sin(around) * ring },
      facing: around + Math.PI, // towards the middle of the circle
    };
  });
}

const walkers = (seed: number, count: number): Person[] =>
  Array.from({ length: count }, (_, i) => ({ kind: "walker" as const, seed, side: count === 1 ? 0 : i - (count - 1) / 2 }));

/** Walkers: three pairs, a group of three and four on their own. Talkers: five circles of two to four. */
const PEOPLE: readonly Person[] = [
  ...walkers(1, 2),
  ...walkers(2, 2),
  ...walkers(3, 2),
  ...walkers(4, 3),
  ...walkers(5, 1),
  ...walkers(6, 1),
  ...walkers(7, 1),
  ...walkers(8, 1),
  ...chatGroup(1, 0.4, 3),
  ...chatGroup(2, 1.7, 4),
  ...chatGroup(3, 2.9, 2),
  ...chatGroup(4, 4.2, 3),
  ...chatGroup(5, 5.4, 3),
];

/** How many of the people (listed first) are walking rather than talking. */
export const WALKER_COUNT = 14;
export const CROWD_SIZE = PEOPLE.length;
function walkPath(seed: number, seconds: number): { east: number; north: number } {
  const t = seconds * (0.05 + (seed % 3) * 0.012);
  return {
    east: Math.sin(t * 1.3 + seed * 2.1) * WANDER_M * (0.6 + (seed % 3) * 0.15),
    north: Math.sin(t + seed * 1.3 + 1) * WANDER_M * (0.55 + (seed % 2) * 0.25),
  };
}

function pose(person: Person, index: number, seconds: number): Pose {
  const shirt = SHIRTS[index % SHIRTS.length];
  const pants = PANTS[index % PANTS.length];
  if (person.kind === "talker") {
    const sway = Math.sin(seconds * 0.8 + person.seed) * 0.12;
    // People take turns: gesturing in pulses, each out of step with the others.
    const gesture = Math.max(0, Math.sin(seconds * 1.7 + person.seed * 2.3));
    return { ...person.home, east: person.home.east + sway, heading: person.facing, swing: 0, gesture, shirt, pants };
  }
  const here = walkPath(person.seed, seconds);
  const ahead = walkPath(person.seed, seconds + 0.5);
  const heading = Math.atan2(ahead.north - here.north, ahead.east - here.east);
  const beside = person.side * SCALE * 1.4;
  return {
    east: here.east + Math.sin(heading) * beside,
    north: here.north - Math.cos(heading) * beside,
    heading,
    swing: Math.sin(seconds * GAIT_RATE + index * 0.7),
    gesture: 0,
    shirt,
    pants,
  };
}

/** Everyone's pose at `seconds`; deterministic, so the same time always gives the same picture. */
export function crowdPoses(seconds: number, spot = 0): Pose[] {
  return PEOPLE.map((person, i) => pose(person, i + spot * 3, seconds));
}
