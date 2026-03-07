'use client';

import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/PageHeader';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { useRef, useState, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types & Data ─────────────────────────────────────────────────────────────

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

// TODO: Replace MOCK_ELDERS with real query
// Query: profiles WHERE vcp_cache >= (totalVCPSupply * 0.01)
// OR: user_medals WHERE token_id IN [specific privileged NFT IDs]

// ── Central Icosahedron ───────────────────────────────────────────────────────

function CentralIcosahedron({ label }: { label: string }) {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.4;
            groupRef.current.rotation.x += delta * 0.1;
        }
    });

    return (
        <group>
            <group ref={groupRef}>
                <mesh
                    onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
                    onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
                >
                    <icosahedronGeometry args={[1.8, 0]} />
                    <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.6} />
                </mesh>
                <mesh>
                    <icosahedronGeometry args={[1.85, 0]} />
                    <meshBasicMaterial color="#333333" wireframe transparent opacity={0.4} />
                </mesh>
            </group>
            {hovered && (
                <Html position={[0, 2.8, 0]} center zIndexRange={[100, 0]}>
                    <div className="text-[10px] font-mono font-bold tracking-widest text-slate-400 pointer-events-none whitespace-nowrap">
                        {label}
                        {/* TODO: connect to Rhythm chat interface */}
                    </div>
                </Html>
            )}
        </group>
    );
}

// ── Elder Slab ────────────────────────────────────────────────────────────────

function ElderSlab({
    elder,
    angle,
    index,
    isHovered,
    onHover,
    onUnhover,
    onConnect,
    connectLabel,
}: {
    elder: GuildElder;
    angle: number;
    index: number;
    isHovered: boolean;
    onHover: () => void;
    onUnhover: () => void;
    onConnect: () => void;
    connectLabel: string;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    const ORBIT_RADIUS = 6;
    const x = Math.cos(angle) * ORBIT_RADIUS;
    const z = Math.sin(angle) * ORBIT_RADIUS;

    const targetRotY = isHovered ? angle + Math.PI : angle + Math.PI / 2;

    useFrame((state, delta) => {
        if (!groupRef.current || !meshRef.current) return;
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2 + index * 0.8) * 0.25;
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
                <meshStandardMaterial color="#0a0a0a" roughness={0.5} metalness={0.3} />
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
                            {connectLabel}
                        </button>
                    </div>
                </Html>
            )}
        </group>
    );
}

// ── AI Cluster ────────────────────────────────────────────────────────────────

function AICluster({ onConnect, rhythmLabel, connectLabel }: { onConnect: (elder: GuildElder) => void; rhythmLabel: string; connectLabel: string }) {
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
            <CentralIcosahedron label={rhythmLabel} />
            {MOCK_ELDERS.map((elder, i) => {
                const angle = (i / MOCK_ELDERS.length) * Math.PI * 2;
                return (
                    <ElderSlab
                        key={elder.id}
                        elder={elder}
                        angle={angle}
                        index={i}
                        isHovered={hoveredIndex === i}
                        onHover={() => setHoveredIndex(i)}
                        onUnhover={() => setHoveredIndex(null)}
                        onConnect={() => onConnect(elder)}
                        connectLabel={connectLabel}
                    />
                );
            })}
        </group>
    );
}

// ── Connecting Dialog ─────────────────────────────────────────────────────────

function ConnectingDialog({ elder, onClose, connectingText, closeText }: { elder: GuildElder | null; onClose: () => void; connectingText: string; closeText: string }) {
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
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-black rounded-full animate-spin" />
                        <p className="text-sm font-mono text-slate-600">
                            {/* TODO: connect to elder persona agent */}
                            {connectingText}
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-2 text-[11px] font-mono text-slate-400 hover:text-black transition-colors tracking-widest"
                        >
                            {closeText}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ThroneOfKindlingPage() {
    const t = useT();
    const [connectingElder, setConnectingElder] = useState<GuildElder | null>(null);

    useEffect(() => {
        return () => { document.body.style.cursor = 'auto'; };
    }, []);

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
                            <AICluster
                                onConnect={setConnectingElder}
                                rhythmLabel={t.council.rhythmCore}
                                connectLabel={t.council.talkToElder}
                            />
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
                connectingText={t.council.connecting}
                closeText={t.council.closeDialog}
            />
        </div>
    );
}
