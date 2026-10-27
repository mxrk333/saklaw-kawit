import { describe, expect, it } from "vitest";
import { CROWD_SIZE, WALKER_COUNT, crowdPoses } from "@/lib/map/crowd";

const dist = (a: { east: number; north: number }, b: { east: number; north: number }) => Math.hypot(a.east - b.east, a.north - b.north);
const walkers = (seconds: number) => crowdPoses(seconds).slice(0, WALKER_COUNT);
const talkers = (seconds: number) => crowdPoses(seconds).slice(WALKER_COUNT);

describe("crowdPoses", () => {
  it("has a crowd of walkers and talkers", () => {
    expect(crowdPoses(0)).toHaveLength(CROWD_SIZE);
    expect(walkers(0)).toHaveLength(WALKER_COUNT);
    expect(CROWD_SIZE).toBeGreaterThanOrEqual(25);
    expect(talkers(0)).toHaveLength(CROWD_SIZE - WALKER_COUNT);
  });

  it("keeps everyone close to the venue, all day", () => {
    for (const seconds of [0, 37, 600, 5000]) {
      for (const p of crowdPoses(seconds)) expect(Math.hypot(p.east, p.north)).toBeLessThan(40);
    }
  });

  it("has walkers who move at a human pace, swinging their limbs", () => {
    const speed = dist(walkers(100)[0], walkers(101)[0]);
    expect(speed).toBeGreaterThan(0);
    expect(speed).toBeLessThan(2.5);
    const swings = [0, 0.1, 0.2, 0.3, 0.4].map((s) => walkers(s)[0].swing);
    expect(new Set(swings).size).toBeGreaterThan(1);
  });

  it("has talkers who stay in their circle, facing the middle, and gesture in turns", () => {
    expect(dist(talkers(0)[0], talkers(300)[0])).toBeLessThan(1);
    expect(talkers(0).every((p) => p.swing === 0)).toBe(true);
    const gestures = [0, 1, 2, 3, 4, 5].map((s) => talkers(s)[0].gesture);
    expect(Math.max(...gestures)).toBeGreaterThan(0.5);
    expect(Math.min(...gestures)).toBe(0);
  });

  it("is repeatable", () => {
    expect(crowdPoses(5, 1)).toEqual(crowdPoses(5, 1));
  });
});
