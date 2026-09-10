"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, ContactShadows } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

useGLTF.preload("/models/tvrobot.glb");

const ACCENT: Record<string, string> = {
  idle: "#4ecdc4",
  listening: "#5aa0ff",
  thinking: "#a98cff",
  talking: "#4ecdc4",
  protecting: "#37b8c9",
  alert: "#ff6b6b",
  happy: "#ffd166",
};

const FACE_COLOR: Record<string, string> = {
  idle: "#7ff0e6",
  listening: "#9cc6ff",
  thinking: "#c9b2ff",
  talking: "#7ff0e6",
  protecting: "#8fe6f2",
  alert: "#ff9a9a",
  happy: "#ffe79a",
};

// ---- tune these to sit the face in the screen recess ----
const FACE_POS: [number, number, number] = [0, 0.19, 0.31];
const FACE_SIZE: [number, number] = [0.4, 0.33];

function drawFace(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  state: string,
  t: number,
  eyeOpen: number
) {
  ctx.clearRect(0, 0, W, H);
  const col = FACE_COLOR[state] ?? "#7ff0e6";
  const cx = W / 2;
  ctx.save();
  ctx.shadowColor = col;
  ctx.shadowBlur = 34;
  ctx.fillStyle = col;
  ctx.strokeStyle = col;

  // eyes
  const eyeY = H * 0.4;
  const gap = W * 0.17;
  const eyeW = W * 0.07;
  const eyeH = Math.max(1.5, W * 0.075 * eyeOpen);
  const surprised = state === "alert" ? 1.25 : 1;
  const eye = (x: number) => {
    ctx.beginPath();
    ctx.ellipse(x, eyeY, eyeW, eyeH * surprised, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  eye(cx - gap);
  eye(cx + gap);

  // mouth
  ctx.lineWidth = W * 0.03;
  ctx.lineCap = "round";
  const my = H * 0.62;
  const mw = W * 0.15;
  ctx.beginPath();
  if (state === "talking") {
    const open = (Math.sin(t * 12) * 0.5 + 0.5) * (H * 0.05) + 3;
    ctx.ellipse(cx, my, mw * 0.55, open, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (state === "alert") {
    ctx.ellipse(cx, my + 4, mw * 0.4, H * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (state === "thinking") {
    ctx.arc(cx + mw * 0.3, my - 2, mw * 0.5, 0.1 * Math.PI, 0.7 * Math.PI);
    ctx.stroke();
  } else if (state === "happy") {
    ctx.arc(cx, my - H * 0.05, mw * 1.15, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
  } else {
    ctx.arc(cx, my - H * 0.02, mw, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

function Robot({ state }: { state: string }) {
  const { scene } = useGLTF("/models/tvrobot.glb");

  const { obj, fit } = useMemo(() => {
    const s = scene.clone(true);
    s.traverse((o: THREE.Object3D) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat) mat.envMapIntensity = 0.7;
      }
    });
    const box = new THREE.Box3().setFromObject(s);
    const c = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(c);
    box.getSize(size);
    const inner = new THREE.Group();
    inner.add(s);
    inner.position.set(-c.x, -c.y, -c.z);
    const pivot = new THREE.Group();
    pivot.add(inner);
    pivot.rotation.y = 0.42; // multiview mesh faces ~25deg off — turn screen toward camera
    return { obj: pivot, fit: 1.72 / size.y };
  }, [scene]);

  const root = useRef<THREE.Group>(null);

  // dynamic glowing face
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 280;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: tex };
  }, []);
  const blink = useRef({ next: 1.6, phase: 0 });

  useFrame((st) => {
    const g = root.current;
    const t = st.clock.elapsedTime;

    // ---- body motion ----
    if (g) {
      let bob = Math.sin(t * 1.5) * 0.025;
      let swayZ = Math.sin(t * 0.9) * 0.03;
      let leanX = 0;
      let rotY = Math.sin(t * 0.5) * 0.05;
      let scaleMul = 1;
      switch (state) {
        case "talking": bob = Math.sin(t * 5) * 0.04; break;
        case "thinking": leanX = 0.14; rotY = Math.sin(t * 0.7) * 0.16; break;
        case "listening": leanX = 0.09; rotY = Math.sin(t * 0.5) * 0.03; break;
        case "protecting": scaleMul = 1.06; leanX = -0.05; break;
        case "alert": swayZ = Math.sin(t * 24) * 0.035; break;
        case "happy": bob = Math.abs(Math.sin(t * 3.2)) * 0.11; rotY = Math.sin(t * 2) * 0.13; break;
      }
      g.position.y += (bob - g.position.y) * 0.18;
      g.rotation.z += (swayZ - g.rotation.z) * 0.1;
      g.rotation.x += (leanX - g.rotation.x) * 0.1;
      g.rotation.y = rotY;
      const target = fit * scaleMul * (1 + Math.sin(t * 1.5) * 0.008);
      g.scale.x += (target - g.scale.x) * 0.12;
      g.scale.y = g.scale.z = g.scale.x;
    }

    // ---- face: blink + redraw ----
    const b = blink.current;
    let eyeOpen = 1;
    if (b.phase <= 0 && t > b.next) {
      b.phase = 1;
      b.next = t + 2 + Math.random() * 2.5;
    }
    if (b.phase > 0) {
      b.phase -= 0.16;
      eyeOpen = Math.abs(Math.cos((1 - Math.max(0, b.phase)) * Math.PI));
      if (b.phase <= 0) b.phase = 0;
    }
    const ctx = canvas.getContext("2d");
    if (ctx) {
      drawFace(ctx, canvas.width, canvas.height, state, t, eyeOpen);
      texture.needsUpdate = true;
    }
  });

  return (
    <group ref={root} scale={fit}>
      <primitive object={obj} />
      <mesh position={FACE_POS}>
        <planeGeometry args={FACE_SIZE} />
        <meshBasicMaterial
          map={texture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function ShieldRing({ state }: { state: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const on = state === "protecting";
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.z += dt * 0.6;
    const target = on ? 1 : 0.0001;
    const next = m.scale.x + (target - m.scale.x) * 0.12;
    m.scale.setScalar(next);
    (m.material as THREE.MeshBasicMaterial).opacity = Math.min(1, next) * 0.5;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0.2]} scale={0.0001}>
      <torusGeometry args={[1.35, 0.02, 8, 64]} />
      <meshBasicMaterial color="#37b8c9" transparent opacity={0} toneMapped={false} />
    </mesh>
  );
}

function Scene({ state }: { state: string }) {
  const color = ACCENT[state] ?? "#4ecdc4";
  return (
    <>
      <hemisphereLight args={["#ffffff", "#191d26", 0.95]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <directionalLight position={[0, 1.4, 5]} intensity={1.7} />
      <directionalLight position={[-4, 2, -1]} intensity={1.0} color={color} />
      <directionalLight position={[0, 0.4, 4]} intensity={0.6} color={color} />
      <Suspense fallback={null}>
        <Robot state={state} />
      </Suspense>
      <ShieldRing state={state} />
      <ContactShadows position={[0, -0.92, 0]} opacity={0.5} blur={2.7} scale={4} far={2.5} color="#000000" />
    </>
  );
}

export default function Avatar3D({ state }: { state: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 4.0], fov: 32 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
    >
      <Scene state={state} />
    </Canvas>
  );
}
