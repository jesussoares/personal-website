import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const COLOR_A = '#4f7cff';
const COLOR_B = '#8b5cf6';
const COLOR_C = '#38bdf8';
const SPOTLIGHT_RADIUS = 240;
const GLYPHS = ['{', '}', '<', '>', '/', ';', '(', ')', '[', ']', '=', '+', '*', '#', '0', '1'];

/* ---------- Shaders ---------- */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uDisperse;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uRadius;
  uniform vec2 uView;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  attribute vec2 aHome;
  attribute vec2 aTarget;
  attribute vec3 aSeed;
  attribute float aLetter; // 1 = forms part of "JS", 0 = ambient

  varying float vAlpha;
  varying vec3 vColor;
  varying float vGlyph;

  void main() {
    float tau = 6.28318;

    // Idle drift around the home position, a tiny wobble once letters form
    vec2 home = aHome + vec2(sin(uTime * 0.35 + aSeed.x * tau), cos(uTime * 0.3 + aSeed.y * tau)) * 8.0;
    vec2 target = aTarget + vec2(sin(uTime * 1.1 + aSeed.x * tau), cos(uTime * 0.9 + aSeed.y * tau)) * 2.0;

    // Staggered morph so particles don't all move in lockstep
    float m = smoothstep(0.0, 1.0, clamp(uMorph * 1.5 - aSeed.z * 0.5, 0.0, 1.0));
    float inLetter = m * aLetter;
    vec2 pos = mix(home, target, inLetter);

    // Disperse outward from the centre
    float d = smoothstep(0.0, 1.0, clamp(uDisperse * 1.4 - aSeed.y * 0.4, 0.0, 1.0));
    pos += normalize(aHome + 0.001) * d * (250.0 + aSeed.x * 700.0);
    pos.y += d * aSeed.z * 180.0;

    // Spotlight: nothing moves, glyphs near the cursor light up and grow
    float light = 1.0 - smoothstep(0.0, uRadius, distance(pos, uMouse));
    float base = mix(0.3, 0.75, inLetter);            // letters stay legible in the dark
    float glow = mix(base, 1.0, light);
    float grow = light * mix(0.9, 0.3, inLetter);     // letters grow less so they don't overlap

    // Ambient glyphs step back while the initials are on stage
    float ambientFade = mix(1.0, 0.35, m * (1.0 - aLetter));
    float variance = mix(0.45 + 0.55 * aSeed.x, 0.7 + 0.3 * aSeed.x, inLetter);
    vAlpha = (1.0 - d) * variance * glow * ambientFade;

    vGlyph = floor(fract(aSeed.x * 7.13 + aSeed.y) * 16.0);
    float gx = clamp(pos.x / uView.x + 0.5, 0.0, 1.0);
    vColor = mix(mix(uColorA, uColorB, gx), uColorC, aSeed.z * aSeed.z * 0.6);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
    float sizeVariance = mix(0.75 + 0.5 * aSeed.y, 0.85 + 0.25 * aSeed.y, inLetter);
    gl_PointSize = uSize * uPixelRatio * sizeVariance * (1.0 + grow);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vGlyph;

  void main() {
    vec2 cell = vec2(mod(vGlyph, 4.0), floor(vGlyph / 4.0));
    float alpha = texture2D(uAtlas, (cell + gl_PointCoord) / 4.0).a;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

/* ---------- Layout helpers ---------- */

function particleCount(w: number, h: number) {
  return Math.round(THREE.MathUtils.clamp((w * h) / 520, 1100, 3200));
}

function glyphSize(w: number) {
  return w < 640 ? 13 : 15;
}

/** Scatter points across the viewport, sparse in the middle so the headline stays readable. */
function homePositions(count: number, w: number, h: number) {
  const out = new Float32Array(count * 2);
  let i = 0;
  while (i < count) {
    const x = (Math.random() - 0.5) * w * 1.1;
    const y = (Math.random() - 0.5) * h * 1.1;
    const e = Math.hypot(x / (w * 0.34), y / (h * 0.32));
    const keep = THREE.MathUtils.smoothstep(e, 0.5, 1.25);
    if (Math.random() < keep * 0.95 + 0.05) {
      out[i * 2] = x;
      out[i * 2 + 1] = y;
      i++;
    }
  }
  return out;
}

/**
 * Slots for the "JS" initials, one glyph per slot so none overlap.
 * Returns target positions plus a per-particle flag for whether it belongs to the letters;
 * particles without a slot keep their home position as ambient.
 */
function initialsLayout(home: Float32Array, w: number, h: number) {
  const count = home.length / 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(w);
  canvas.height = Math.ceil(h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const fontSize = Math.min(w * (w < 640 ? 0.62 : 0.42), h * 0.55);
  ctx.font = `700 ${fontSize}px "Geist Variable", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  ctx.fillText('JS', w / 2, h * 0.46);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Blue-noise sampling: random spots inside the letters, but never closer than minDist,
  // so the glyphs look loose and organic without piling up on each other
  const minDist = glyphSize(w) * 0.72;
  const candidates: number[] = [];
  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      if (data[(y * canvas.width + x) * 4 + 3] > 128) candidates.push(x, y);
    }
  }
  const cellSize = minDist / Math.SQRT2;
  const cols = Math.ceil(canvas.width / cellSize);
  const grid = new Map<number, [number, number]>();
  const slots: number[] = [];
  const order = Array.from({ length: candidates.length / 2 }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (const k of order) {
    const x = candidates[k * 2];
    const y = candidates[k * 2 + 1];
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    let free = true;
    for (let dy = -2; dy <= 2 && free; dy++) {
      for (let dx = -2; dx <= 2 && free; dx++) {
        const other = grid.get((cy + dy) * cols + cx + dx);
        if (other && Math.hypot(other[0] - x, other[1] - y) < minDist) free = false;
      }
    }
    if (!free) continue;
    grid.set(cy * cols + cx, [x, y]);
    slots.push(x - w / 2, h / 2 - y);
  }

  // Slots come out in random order, so if there are more than particles any prefix is an even subset
  const used = Math.min(slots.length / 2, count);

  const target = home.slice();
  const letter = new Float32Array(count);
  for (let i = 0; i < used; i++) {
    target[i * 2] = slots[i * 2];
    target[i * 2 + 1] = slots[i * 2 + 1];
    letter[i] = 1;
  }
  return { target, letter };
}

/** 4x4 grid of code glyphs, white on transparent; the shader tints them. */
function glyphAtlas() {
  const cell = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = cell * 4;
  const ctx = canvas.getContext('2d')!;
  ctx.font = `500 ${cell * 0.72}px "Geist Mono Variable", ui-monospace, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  GLYPHS.forEach((g, i) => ctx.fillText(g, (i % 4) * cell + cell / 2, Math.floor(i / 4) * cell + cell / 2));
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false; // match gl_PointCoord's top-left origin
  return texture;
}

/* ---------- Scene ---------- */

interface Driver {
  /** 0→1 while the hero is pinned (headline → initials) */
  progress: number;
  /** 0→1 as the unpinned hero scrolls away (initials disperse) */
  exit: number;
  pointer: { x: number; y: number; active: boolean };
}

function Particles({ driver, animate }: { driver: React.RefObject<Driver>; animate: boolean }) {
  const { size, viewport } = useThree();
  const smooth = useRef({ morph: 0, disperse: 0, mx: 9999, my: 9999 });

  // Only rebuild on real layout changes (ignore mobile URL-bar height jitter)
  const [dims, setDims] = useState({ w: size.width, h: size.height });
  useEffect(() => {
    setDims((d) =>
      Math.abs(d.w - size.width) > 1 || Math.abs(d.h - size.height) > 150 ? { w: size.width, h: size.height } : d,
    );
  }, [size.width, size.height]);

  const geometry = useMemo(() => {
    const count = particleCount(dims.w, dims.h);
    const home = homePositions(count, dims.w, dims.h);
    const seeds = new Float32Array(count * 3).map(() => Math.random());
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aHome', new THREE.BufferAttribute(home, 2));
    g.setAttribute('aTarget', new THREE.BufferAttribute(home.slice(), 2));
    g.setAttribute('aLetter', new THREE.BufferAttribute(new Float32Array(count), 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    // Positions are computed in the shader; keep the whole field in view
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
    return g;
  }, [dims]);

  // Letter targets need the web font, so fill them in once it's ready
  useEffect(() => {
    let cancelled = false;
    document.fonts.load('700 100px "Geist Variable"').finally(() => {
      if (cancelled) return;
      const home = geometry.getAttribute('aHome').array as Float32Array;
      const { target, letter } = initialsLayout(home, dims.w, dims.h);
      const targetAttr = geometry.getAttribute('aTarget') as THREE.BufferAttribute;
      const letterAttr = geometry.getAttribute('aLetter') as THREE.BufferAttribute;
      targetAttr.copyArray(target);
      letterAttr.copyArray(letter);
      targetAttr.needsUpdate = letterAttr.needsUpdate = true;
    });
    return () => {
      cancelled = true;
      geometry.dispose();
    };
  }, [geometry, dims]);

  // Build the material ourselves: R3F copies a `uniforms` prop, which would detach our per-frame writes
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uDisperse: { value: 0 },
          uSize: { value: 15 },
          uAtlas: { value: null as THREE.Texture | null },
          uPixelRatio: { value: 1 },
          uMouse: { value: new THREE.Vector2(9999, 9999) },
          uRadius: { value: SPOTLIGHT_RADIUS },
          uView: { value: new THREE.Vector2(1, 1) },
          uColorA: { value: new THREE.Color(COLOR_A) },
          uColorB: { value: new THREE.Color(COLOR_B) },
          uColorC: { value: new THREE.Color(COLOR_C) },
        },
      }),
    [],
  );
  const uniforms = material.uniforms;

  useEffect(() => {
    document.fonts.load('500 100px "Geist Mono Variable"').finally(() => {
      uniforms.uAtlas.value = glyphAtlas();
    });
    return () => {
      uniforms.uAtlas.value?.dispose();
      material.dispose();
    };
  }, [material, uniforms]);

  useEffect(() => {
    uniforms.uPixelRatio.value = viewport.dpr;
    uniforms.uSize.value = glyphSize(dims.w);
    uniforms.uView.value.set(dims.w, dims.h);
  }, [viewport.dpr, dims, uniforms]);

  useFrame(({ clock }, delta) => {
    const s = smooth.current;
    const dt = Math.min(delta, 0.1);
    const { progress, exit, pointer } = driver.current;
    const t = clock.elapsedTime;

    const morphTarget = THREE.MathUtils.smoothstep(progress, 0.15, 0.7);
    const disperseTarget = THREE.MathUtils.smoothstep(exit, 0, 0.7);
    s.morph = THREE.MathUtils.damp(s.morph, morphTarget, 9, dt);
    s.disperse = THREE.MathUtils.damp(s.disperse, disperseTarget, 9, dt);

    // Until the user moves the mouse (or on touch), a "ghost" light wanders slowly
    const tx = pointer.active ? pointer.x : Math.sin(t * 0.4) * dims.w * 0.3;
    const ty = pointer.active ? pointer.y : Math.cos(t * 0.3) * dims.h * 0.25;
    s.mx = s.mx === 9999 ? tx : THREE.MathUtils.damp(s.mx, tx, 8, dt);
    s.my = s.my === 9999 ? ty : THREE.MathUtils.damp(s.my, ty, 8, dt);

    uniforms.uTime.value = animate ? t : 0;
    uniforms.uMorph.value = s.morph;
    uniforms.uDisperse.value = s.disperse;
    if (animate) {
      uniforms.uMouse.value.set(s.mx, s.my);
    } else {
      // Reduced motion: no roaming light, just show every glyph fully lit
      uniforms.uMouse.value.set(0, 0);
      uniforms.uRadius.value = 1e5;
    }
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

export default function ParticleField() {
  const driver = useRef<Driver>({ progress: 0, exit: 0, pointer: { x: 0, y: 0, active: false } });
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const reduceMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(hero);
    if (reduceMotion) return () => io.disconnect();

    const trigger = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => (driver.current.progress = self.progress),
    });
    const exitTrigger = ScrollTrigger.create({
      trigger: hero,
      start: 'bottom bottom',
      end: 'bottom top',
      onUpdate: (self) => (driver.current.exit = self.progress),
    });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const p = driver.current.pointer;
      p.x = e.clientX - window.innerWidth / 2;
      p.y = window.innerHeight / 2 - e.clientY;
      p.active = true;
    };
    const onLeave = () => (driver.current.pointer.active = false);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      io.disconnect();
      trigger.kill();
      exitTrigger.kill();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [reduceMotion]);

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 100], zoom: 1 }}
      className="transition-opacity duration-1000"
      style={{ opacity: ready ? 1 : 0 }}
      frameloop={!visible ? 'never' : reduceMotion ? 'demand' : 'always'}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      onCreated={() => setReady(true)}
      fallback={null}
      aria-hidden
    >
      <Particles driver={driver} animate={!reduceMotion} />
    </Canvas>
  );
}
