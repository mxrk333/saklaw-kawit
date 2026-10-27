import * as maplibregl from "maplibre-gl";
import type { CustomLayerInterface, MapMouseEvent, MapTouchEvent } from "maplibre-gl";
import { AmbientLight, Camera, DirectionalLight, Group, Matrix4, Scene, Vector3, WebGLRenderer } from "three";
import type { Coordinates } from "@/types";
import { CROWD_SIZE, PERSON_SCALE, crowdPoses, type Pose } from "./crowd";
import { createPerson, type PersonModel } from "./people-model";

export const PEOPLE_LAYER_ID = "saklaw-people";
/** People are specks when zoomed out, so they are only drawn (and the map only repainted) from here in. */
const MIN_ZOOM = 15.5;
/** How close (in screen pixels) a press must be to a person to pick them up. */
const GRAB_PX = 24;
/** Metres per second a dropped person runs back to where they belong. */
const RUN_SPEED_M = 7;
const HELD_LIFT_M = 0.5;
/** Heights along a person (as a share of their size) that count as "on" them when picking. */
const GRAB_HEIGHTS = [0.15, 0.9, 1.6];

type PointerEvent = MapMouseEvent | MapTouchEvent;

/** A person who is not following their normal route: held by the user, or running back to it. */
interface Displaced {
  east: number;
  north: number;
  held: boolean;
}

interface Spot {
  coordinates: Coordinates;
  group: Group;
  people: PersonModel[];
  /** World-to-screen matrix from the last frame, used to pick and drag people. */
  projection: Matrix4;
  displaced: Map<number, Displaced>;
}

interface Grab {
  spot: number;
  person: number;
}

/** A map layer that draws small 3D people walking and chatting at each live event, which can be dragged about. */
export class PeopleLayer implements CustomLayerInterface {
  readonly id = PEOPLE_LAYER_ID;
  readonly type = "custom" as const;
  readonly renderingMode = "3d" as const;

  private map?: maplibregl.Map;
  private renderer?: WebGLRenderer;
  private readonly camera = new Camera();
  private readonly scene = new Scene();
  private spots: Spot[] = [];
  private grab: Grab | null = null;
  private lastFrame = 0;

  onAdd(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map;
    this.renderer = new WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
    this.renderer.autoClear = false;
    const sun = new DirectionalLight(0xffffff, 2.2);
    sun.position.set(0.4, -0.6, 1);
    this.scene.add(new AmbientLight(0xffffff, 1.6), sun);

    map.on("mousedown", this.onPress);
    map.on("touchstart", this.onPress);
    map.on("mousemove", this.onMove);
    map.on("touchmove", this.onMove);
    map.on("mouseup", this.onRelease);
    map.on("touchend", this.onRelease);
    window.addEventListener("mouseup", this.onRelease);
  }

  onRemove(map: maplibregl.Map): void {
    map.off("mousedown", this.onPress);
    map.off("touchstart", this.onPress);
    map.off("mousemove", this.onMove);
    map.off("touchmove", this.onMove);
    map.off("mouseup", this.onRelease);
    map.off("touchend", this.onRelease);
    window.removeEventListener("mouseup", this.onRelease);
    this.renderer?.dispose();
    this.renderer = undefined;
  }

  /** Which live events to draw people at; an empty list clears them. */
  setSpots(coordinates: readonly Coordinates[]): void {
    for (const spot of this.spots) this.scene.remove(spot.group);
    this.grab = null;
    this.spots = coordinates.map((place) => {
      const people = Array.from({ length: CROWD_SIZE }, (_, i) => createPerson(i));
      const group = new Group();
      group.add(...people.map((p) => p.group));
      this.scene.add(group);
      return { coordinates: place, group, people, projection: new Matrix4(), displaced: new Map() };
    });
    this.map?.triggerRepaint();
  }

  private readonly onPress = (event: PointerEvent): void => {
    const grab = this.pick(event.point);
    if (!grab) return;
    // Keep the map from panning while someone is being dragged.
    event.preventDefault();
    const { x, y } = this.spots[grab.spot].people[grab.person].group.position;
    this.spots[grab.spot].displaced.set(grab.person, { east: x, north: y, held: true });
    this.grab = grab;
    this.map?.triggerRepaint();
  };

  private readonly onMove = (event: PointerEvent): void => {
    if (!this.grab) {
      if (event.type === "mousemove" && this.map) this.map.getCanvas().style.cursor = this.pick(event.point) ? "grab" : "";
      return;
    }
    const spot = this.spots[this.grab.spot];
    const held = spot.displaced.get(this.grab.person);
    const ground = this.groundPoint(event.point, spot);
    if (held && ground) {
      held.east = ground.east;
      held.north = ground.north;
    }
    this.map?.triggerRepaint();
  };

  /** Let go: the person runs back to where they are supposed to be. */
  private readonly onRelease = (): void => {
    if (!this.grab) return;
    const held = this.spots[this.grab.spot]?.displaced.get(this.grab.person);
    if (held) held.held = false;
    this.grab = null;
    this.map?.triggerRepaint();
  };

  private screenPoint(position: Vector3, spot: Spot): { x: number; y: number } | undefined {
    const canvas = this.map?.getCanvas();
    if (!canvas) return undefined;
    const ndc = position.clone().applyMatrix4(spot.projection);
    return { x: ((ndc.x + 1) / 2) * canvas.clientWidth, y: ((1 - ndc.y) / 2) * canvas.clientHeight };
  }

  /** The person under a screen point, if any. */
  private pick(point: { x: number; y: number }): Grab | undefined {
    if (!this.map || this.map.getZoom() < MIN_ZOOM) return undefined;
    let best: (Grab & { distance: number }) | undefined;
    this.spots.forEach((spot, s) =>
      spot.people.forEach((person, p) => {
        for (const height of GRAB_HEIGHTS) {
          const at = new Vector3(person.group.position.x, person.group.position.y, spot.group.position.z + height * PERSON_SCALE);
          const screen = this.screenPoint(at, spot);
          const distance = screen ? Math.hypot(screen.x - point.x, screen.y - point.y) : Infinity;
          if (distance <= GRAB_PX && (!best || distance < best.distance)) best = { spot: s, person: p, distance };
        }
      }),
    );
    return best && { spot: best.spot, person: best.person };
  }

  /** Where a screen point lands on the ground around a spot, in metres east/north of the venue. */
  private groundPoint(point: { x: number; y: number }, spot: Spot): { east: number; north: number } | undefined {
    const canvas = this.map?.getCanvas();
    if (!canvas) return undefined;
    const x = (point.x / canvas.clientWidth) * 2 - 1;
    const y = 1 - (point.y / canvas.clientHeight) * 2;
    const inverse = spot.projection.clone().invert();
    const near = new Vector3(x, y, -1).applyMatrix4(inverse);
    const far = new Vector3(x, y, 1).applyMatrix4(inverse);
    const rise = far.z - near.z;
    if (Math.abs(rise) < 1e-9) return undefined;
    const t = (spot.group.position.z - near.z) / rise;
    return { east: near.x + t * (far.x - near.x), north: near.y + t * (far.y - near.y) };
  }

  /** A person's pose, replaced while they are held or running back to their place. */
  private poseFor(spot: Spot, index: number, scheduled: Pose, now: number, elapsed: number): Pose {
    const away = spot.displaced.get(index);
    if (!away) return scheduled;
    if (away.held) {
      return { ...scheduled, east: away.east, north: away.north, swing: Math.sin(now * 16), gesture: 1, lift: HELD_LIFT_M };
    }
    const dx = scheduled.east - away.east;
    const dy = scheduled.north - away.north;
    const distance = Math.hypot(dx, dy);
    const step = RUN_SPEED_M * elapsed;
    if (distance <= step + 0.3) {
      spot.displaced.delete(index);
      return scheduled;
    }
    away.east += (dx / distance) * step;
    away.north += (dy / distance) * step;
    return { ...scheduled, east: away.east, north: away.north, heading: Math.atan2(dy, dx), swing: Math.sin(now * 14), gesture: 0 };
  }

  render(gl: WebGLRenderingContext | WebGL2RenderingContext, args: { defaultProjectionData: { mainMatrix: ArrayLike<number> } }): void {
    const { map, renderer } = this;
    if (!map || !renderer || this.spots.length === 0 || map.getZoom() < MIN_ZOOM) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = performance.now() / 1000;
    const elapsed = Math.min(0.1, now - this.lastFrame);
    this.lastFrame = now;
    const seconds = still ? 0 : now;
    renderer.resetState();
    renderer.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    this.spots.forEach((spot, index) => {
      const mercator = maplibregl.MercatorCoordinate.fromLngLat(spot.coordinates, 0);
      const unit = mercator.meterInMercatorCoordinateUnits();
      // Mercator y points south, so flip y to get east/north/up in metres.
      const toWorld = new Matrix4().makeTranslation(mercator.x, mercator.y, mercator.z).scale(new Vector3(unit, -unit, unit));
      spot.projection = new Matrix4().fromArray(args.defaultProjectionData.mainMatrix).multiply(toWorld);
      this.camera.projectionMatrix = spot.projection;
      this.camera.projectionMatrixInverse.copy(spot.projection).invert();

      crowdPoses(seconds, index).forEach((pose, i) => spot.people[i].apply(this.poseFor(spot, i, pose, now, elapsed)));
      // Stand on the ground, which is raised when terrain is on.
      spot.group.position.z = map.queryTerrainElevation(spot.coordinates) ?? 0;
      this.spots.forEach((other) => (other.group.visible = other === spot));
      renderer.render(this.scene, this.camera);
    });
    if (!still || this.spots.some((spot) => spot.displaced.size > 0)) map.triggerRepaint();
  }
}
