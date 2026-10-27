import { BackSide, CapsuleGeometry, Group, Mesh, MeshLambertMaterial, SphereGeometry } from "three";
import { PERSON_SCALE, type Pose } from "./crowd";

/** Real-world proportions in metres, z up, facing +y. The whole figure is scaled up by PERSON_SCALE. */
const HIP_Z = 0.9;
const SHOULDER_Z = 1.43;
const SKIN = "#e0ac86";
const HAIR = ["#1c1917", "#3b2a20", "#57534e", "#0c0a09"];

const upright = (geometry: CapsuleGeometry): CapsuleGeometry => geometry.rotateX(Math.PI / 2);
const LEG = upright(new CapsuleGeometry(0.075, 0.7, 4, 10));
const ARM = upright(new CapsuleGeometry(0.052, 0.46, 4, 8));
const TORSO = upright(new CapsuleGeometry(0.16, 0.3, 4, 12));
const HEAD = new SphereGeometry(0.115, 16, 12);

// Back faces: the map's projection mirrors winding, so what is culled and lit "backwards" is the real front.
const material = (color: string) => new MeshLambertMaterial({ color, side: BackSide });
const skin = material(SKIN);

export interface PersonModel {
  group: Group;
  apply: (pose: Pose) => void;
}

/** One articulated figure whose legs and arms swing and whose speaking arm lifts. */
export function createPerson(index: number): PersonModel {
  const group = new Group();
  const body = new Group();
  group.add(body);

  const limb = (geometry: CapsuleGeometry, color: ReturnType<typeof material>, x: number, z: number, length: number) => {
    const pivot = new Group();
    pivot.position.set(x, 0, z);
    const mesh = new Mesh(geometry, color);
    mesh.position.z = -length / 2;
    pivot.add(mesh);
    body.add(pivot);
    return pivot;
  };

  const pants = material("#000000");
  const shirt = material("#ffffff");
  const legL = limb(LEG, pants, -0.1, HIP_Z, 0.85);
  const legR = limb(LEG, pants, 0.1, HIP_Z, 0.85);
  const armL = limb(ARM, shirt, -0.235, SHOULDER_Z, 0.57);
  const armR = limb(ARM, shirt, 0.235, SHOULDER_Z, 0.57);

  const torso = new Mesh(TORSO, shirt);
  torso.scale.set(1.2, 0.7, 1);
  torso.position.z = HIP_Z + 0.32;
  body.add(torso);

  const head = new Group();
  head.position.z = 1.63;
  const face = new Mesh(HEAD, skin);
  const hair = new Mesh(HEAD, material(HAIR[index % HAIR.length]));
  hair.scale.set(1.06, 1.05, 0.82);
  hair.position.set(0, -0.012, 0.035);
  head.add(face, hair);
  body.add(head);

  group.scale.setScalar(PERSON_SCALE);
  // The map supplies its own camera matrix, which three's frustum test does not understand.
  group.traverse((object) => (object.frustumCulled = false));

  return {
    group,
    apply(pose) {
      pants.color.set(pose.pants);
      shirt.color.set(pose.shirt);
      group.position.set(pose.east, pose.north, 0);
      group.rotation.z = pose.heading - Math.PI / 2;
      // Walkers bob a little with each step and lean into it; talkers stand still.
      body.position.z = Math.abs(pose.swing) * 0.025 + (pose.lift ?? 0);
      body.rotation.x = Math.abs(pose.swing) > 0 ? 0.05 : 0;
      legL.rotation.x = pose.swing * 0.6;
      legR.rotation.x = -pose.swing * 0.6;
      armL.rotation.x = -pose.swing * 0.5;
      armR.rotation.x = pose.swing * 0.5 + pose.gesture * 1.25;
      head.rotation.x = pose.gesture * 0.08;
    },
  };
}
