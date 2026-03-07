# Cinder Throne Visual Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite `/council/ai` (Throne of Kindling page) with white background, 13 black stone slabs orbiting a rotating icosahedron, hover-to-flip interaction with member popup and connecting dialog stub.

**Architecture:** Single file rewrite of `app/council/ai/page.tsx`. All 3D logic stays in R3F components within the file. Mock data defined at module level with a `fetchGuildElders()` stub for future real integration. Dialog state managed with React `useState`.

**Tech Stack:** React Three Fiber, Three.js, @react-three/drei (`Html`, `OrbitControls`), Framer Motion (dialog animation), Tailwind CSS, useT() for i18n.

---

### Task 1: Define mock data and types

**Files:**
- Modify: `app/council/ai/page.tsx` (top of file, before components)

**Step 1: Replace the entire file with the new scaffold — data + types only**

```tsx
'use client';

import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/PageHeader';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { useRef, useState, Suspense } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

interface GuildElder {
    id: string;
    codename: string;
    vcp: number;
}

const MOCK_ELDERS: GuildElder[] = [
    { id: '1',  codename: 'ARBITER-∆1',  vcp: 12480 },
    { id: '2',  codename: 'CIPHER-∆2',   vcp: 8320  },
    { id: '3',  codename: 'WARDEN-∆3',   vcp: 7150  },
    { id: '4',  codename: 'ORACLE-∆4',   vcp: 6800  },
    { id: '5',  codename: 'HERALD-∆5',   vcp: 5940  },
    { id: '6',  codename: 'VOIDEX-∆6',   vcp: 5120  },
    { id: '7',  codename: 'NEXUS-∆7',    vcp: 4380  },
    { id: '8',  codename: 'PRAXIS-∆8',   vcp: 3760  },
    { id: '9',  codename: 'ETHOS-∆9',    vcp: 3200  },
    { id: '10', codename: 'AXIOM-∆10',   vcp: 2840  },
    { id: '11', codename: 'SIGIL-∆11',   vcp: 2310  },
    { id: '12', codename: 'RELIC-∆12',   vcp: 1980  },
    { id: '13', codename: 'EMBER-∆13',   vcp: 1540  },
];

// TODO: Replace with real query
// Query: profiles WHERE vcp_cache >= (totalVCPSupply * 0.01)
// OR: user_medals WHERE token_id IN [specific privileged NFT IDs]
async function fetchGuildElders(): Promise<GuildElder[]> {
    return MOCK_ELDERS;
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: compiles cleanly (rest of file is not yet written — add a temporary stub export)

```tsx
export default function ThroneOfKindlingPage() { return null; }
```

**Step 3: Commit**

```bash
git add app/council/ai/page.tsx
git commit -m "feat(throne): scaffold data types and mock elders"
```

---

### Task 2: Central Icosahedron component

**Files:**
- Modify: `app/council/ai/page.tsx` — add `CentralIcosahedron` component

**Step 1: Add the component after the mock data**

```tsx
function CentralIcosahedron() {
    const meshRef = useRef<THREE.Mesh>(null);
    const wireRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.4;
            meshRef.current.rotation.x += delta * 0.1;
        }
        if (wireRef.current) {
            wireRef.current.rotation.y += delta * 0.4;
            wireRef.current.rotation.x += delta * 0.1;
        }
    });

    return (
        <group>
            <mesh
                ref={meshRef}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
            >
                <icosahedronGeometry args={[1.8, 0]} />
                <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.6} />
            </mesh>
            <mesh ref={wireRef}>
                <icosahedronGeometry args={[1.85, 0]} />
                <meshBasicMaterial color="#333333" wireframe transparent opacity={0.4} />
            </mesh>
            {hovered && (
                <Html position={[0, 2.8, 0]} center zIndexRange={[100, 0]}>
                    <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 pointer-events-none whitespace-nowrap">
                        RHYTHM · CORE
                        {/* TODO: connect to Rhythm chat interface */}
                    </div>
                </Html>
            )}
        </group>
    );
}
```

**Step 2: Verify build**
Run: `pnpm build`

**Step 3: Commit**
```bash
git add app/council/ai/page.tsx
git commit -m "feat(throne): add CentralIcosahedron component"
```

---

### Task 3: Elder Slab component

**Files:**
- Modify: `app/council/ai/page.tsx` — add `ElderSlab` component

**Step 1: Add component**

```tsx
function ElderSlab({
    elder,
    angle,
    index,
    isPaused,
    isHovered,
    onHover,
    onUnhover,
    onConnect,
}: {
    elder: GuildElder;
    angle: number;
    index: number;
    isPaused: boolean;
    isHovered: boolean;
    onHover: () => void;
    onUnhover: () => void;
    onConnect: () => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    const ORBIT_RADIUS = 6;
    const x = Math.cos(angle) * ORBIT_RADIUS;
    const z = Math.sin(angle) * ORBIT_RADIUS;

    // Target rotation: when hovered, face camera (angle + PI); else face outward (angle + PI/2)
    const targetRotY = isHovered ? angle + Math.PI : angle + Math.PI / 2;

    useFrame((state, delta) => {
        if (!groupRef.current || !meshRef.current) return;

        // Float animation
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2 + index * 0.8) * 0.25;

        // Smooth rotation lerp toward target
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
            meshRef.current.rotation.y,
            targetRotY,
            delta * 8
        );
    });

    return (
        <group ref={groupRef} position={[x, 0, z]}>
            <mesh
                ref={meshRef}
                rotation-y={angle + Math.PI / 2}
                onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; onHover(); }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; onUnhover(); }}
            >
                <boxGeometry args={[1.2, 3.5, 0.08]} />
                <meshStandardMaterial
                    color="#0a0a0a"
                    roughness={0.5}
                    metalness={0.3}
                />
            </mesh>

            {isHovered && (
                <Html
                    position={[0, 0, 0.2]}
                    center
                    zIndexRange={[100, 0]}
                    style={{ pointerEvents: 'auto' }}
                >
                    <div className="bg-black/90 px-4 py-3 flex flex-col items-center gap-2 min-w-[140px]">
                        <span className="text-white font-mono font-bold tracking-widest text-[11px] uppercase">
                            {elder.codename}
                        </span>
                        <div className="w-full h-px bg-white/20" />
                        <span className="text-white/60 font-mono text-[10px]">
                            {elder.vcp.toLocaleString()} VCP
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onConnect(); }}
                            className="mt-1 px-3 py-1 text-[10px] font-mono font-bold text-black bg-white hover:bg-white/80 transition-colors tracking-widest"
                        >
                            与 TA 交流
                        </button>
                    </div>
                </Html>
            )}
        </group>
    );
}
```

**Step 2: Verify build**
Run: `pnpm build`

**Step 3: Commit**
```bash
git add app/council/ai/page.tsx
git commit -m "feat(throne): add ElderSlab component with hover flip + popup"
```

---

### Task 4: AICluster — orchestrate slabs + icosahedron

**Files:**
- Modify: `app/council/ai/page.tsx` — add `AICluster` component

**Step 1: Add component**

```tsx
function AICluster({
    onConnect,
}: {
    onConnect: (elder: GuildElder) => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const isPaused = hoveredIndex !== null;

    useFrame((_, delta) => {
        if (groupRef.current && !isPaused) {
            groupRef.current.rotation.y += delta * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            <CentralIcosahedron />
            {MOCK_ELDERS.map((elder, i) => {
                const angle = (i / MOCK_ELDERS.length) * Math.PI * 2;
                return (
                    <ElderSlab
                        key={elder.id}
                        elder={elder}
                        angle={angle}
                        index={i}
                        isPaused={isPaused}
                        isHovered={hoveredIndex === i}
                        onHover={() => setHoveredIndex(i)}
                        onUnhover={() => setHoveredIndex(null)}
                        onConnect={() => onConnect(elder)}
                    />
                );
            })}
        </group>
    );
}
```

**Step 2: Verify build**
Run: `pnpm build`

**Step 3: Commit**
```bash
git add app/council/ai/page.tsx
git commit -m "feat(throne): add AICluster orchestrating slabs and icosahedron"
```

---

### Task 5: Connecting dialog (stub modal)

**Files:**
- Modify: `app/council/ai/page.tsx` — add `ConnectingDialog` component

**Step 1: Add component**

```tsx
function ConnectingDialog({
    elder,
    onClose,
}: {
    elder: GuildElder | null;
    onClose: () => void;
}) {
    return (
        <AnimatePresence>
            {elder && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border border-slate-200 p-8 flex flex-col items-center gap-4 min-w-[280px]"
                    >
                        <span className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                            {elder.codename}
                        </span>

                        {/* Spinner */}
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-black rounded-full animate-spin" />

                        <p className="text-sm font-mono text-slate-600">
                            {/* TODO: connect to elder persona agent */}
                            连接中...
                        </p>

                        <button
                            onClick={onClose}
                            className="mt-2 text-[11px] font-mono text-slate-400 hover:text-black transition-colors tracking-widest"
                        >
                            × 关闭
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
```

**Step 2: Verify build**
Run: `pnpm build`

**Step 3: Commit**
```bash
git add app/council/ai/page.tsx
git commit -m "feat(throne): add ConnectingDialog stub modal"
```

---

### Task 6: Main page component + i18n keys

**Files:**
- Modify: `app/council/ai/page.tsx` — add main export
- Modify: `lib/i18n/zh.ts` — add/verify `throneOfKindling` key
- Modify: `lib/i18n/en.ts` — add/verify `throneOfKindling` key

**Step 1: Replace the stub export with the real page**

```tsx
export default function ThroneOfKindlingPage() {
    const t = useT();
    const [connectingElder, setConnectingElder] = useState<GuildElder | null>(null);

    return (
        <div className="relative selection:bg-primary/20">
            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col w-full">
                <PageHeader
                    title={t.council.throneOfKindling}
                    description={t.council.throneOfKindlingDesc}
                />

                <div className="mt-8 w-full" style={{ height: '70vh' }}>
                    <Canvas
                        camera={{ position: [0, 6, 20], fov: 50 }}
                        style={{ background: '#ffffff' }}
                    >
                        <ambientLight intensity={2.5} />
                        <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
                        <directionalLight position={[-5, -5, -5]} intensity={0.5} color="#dddddd" />

                        <Suspense fallback={null}>
                            <AICluster onConnect={setConnectingElder} />
                        </Suspense>

                        <OrbitControls
                            enableZoom={false}
                            enablePan={false}
                            maxPolarAngle={Math.PI / 2.1}
                            minPolarAngle={Math.PI / 2.1}
                            autoRotate={false}
                        />
                    </Canvas>
                </div>
            </div>

            <ConnectingDialog
                elder={connectingElder}
                onClose={() => setConnectingElder(null)}
            />
        </div>
    );
}
```

**Step 2: Verify i18n keys exist** — check `lib/i18n/zh.ts` and `lib/i18n/en.ts` for `council.throneOfKindling` and `council.throneOfKindlingDesc`. If missing, add them.

**Step 3: Build and verify**
Run: `pnpm build`
Expected: clean build, no errors

**Step 4: Commit**
```bash
git add app/council/ai/page.tsx lib/i18n/zh.ts lib/i18n/en.ts
git commit -m "feat(throne): complete Cinder Throne visual redesign"
```

---

### Task 7: Push

```bash
git push origin master
```

---

## Testing Checklist (manual)

- [ ] White background on canvas, no dark container
- [ ] 13 black slabs visible, orbiting icosahedron
- [ ] Icosahedron rotates continuously on Y + X axes
- [ ] Hovering a slab: system pauses, slab flips to face camera
- [ ] Popup shows codename + VCP + "与 TA 交流" button
- [ ] Mouse out: slab returns, system resumes
- [ ] Clicking "与 TA 交流": dialog appears with codename + spinner + "连接中..."
- [ ] Dialog closes on × or backdrop click
- [ ] No console errors
