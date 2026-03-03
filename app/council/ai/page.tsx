'use client';

import { useT } from '@/lib/i18n';
import { PageHeader } from '@/components/ui/PageHeader';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useRef, useState, Suspense } from 'react';
import * as THREE from 'three';

function CentralMonolith() {
    return (
        <group>
            {/* The core monolith Rhythm */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[2, 12, 2]} />
                <meshStandardMaterial color="#1a1f2e" roughness={0.15} metalness={0.7} />
            </mesh>
            {/* Glowing inner core wires */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[2.05, 12.05, 2.05]} />
                <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.35} />
            </mesh>

            <Html position={[0, 6.5, 0]} center zIndexRange={[100, 0]}>
                <div className="bg-black/80 text-sky-400 font-mono text-xs px-4 py-1 rounded border border-sky-500/50 flex flex-col items-center">
                    <span className="font-bold tracking-widest uppercase">Rhythm</span>
                    <span className="text-[8px] opacity-70">Guild Core AI</span>
                </div>
            </Html>
        </group>
    );
}

function AgentSlab({ angle, radius, name, status, index }: { angle: number, radius: number, name: string, status: string, index: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            // Slabs float up and down slightly
            meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5 + index) * 0.3;
            // Face outwards continuously
            meshRef.current.rotation.y = -angle;
        }
    });

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Determine status color
    const isOnline = status === 'Online';
    const accentColor = isOnline ? "#10b981" : "#64748b"; // Emerald vs Slate

    return (
        <mesh
            ref={meshRef}
            position={[x, 0, z]}
            onPointerOver={() => {
                document.body.style.cursor = 'pointer';
                setHovered(true);
            }}
            onPointerOut={() => {
                document.body.style.cursor = 'auto';
                setHovered(false);
            }}
            scale={hovered ? 1.05 : 1}
        >
            <boxGeometry args={[1.5, 4, 0.3]} />
            <meshStandardMaterial
                color={hovered ? "#2a3148" : "#1e2536"}
                roughness={0.2}
                metalness={0.85}
                emissive={hovered ? accentColor : "#1a2030"}
                emissiveIntensity={hovered ? 0.5 : 0.1}
            />

            <Html position={[0, 2.8, 0]} center zIndexRange={[100, 0]} style={{ transition: 'all 0.2s', opacity: hovered ? 1 : 0, pointerEvents: 'none' }}>
                <div className="bg-slate-900/90 text-white font-mono text-xs px-4 py-2 rounded border border-slate-700 whitespace-nowrap shadow-xl backdrop-blur-md flex flex-col items-center gap-1">
                    <span className="font-bold tracking-widest text-[#e2e8f0]">{name}</span>
                    <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-slate-500'}`} />
                        <span className={`text-[9px] uppercase tracking-wider ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>{status}</span>
                    </div>
                </div>
            </Html>

            {/* Wireframe accent container */}
            <mesh>
                <boxGeometry args={[1.52, 4.02, 0.32]} />
                <meshBasicMaterial color={hovered ? accentColor : "#556"} wireframe transparent opacity={hovered ? 0.5 : 0.3} />
            </mesh>
        </mesh>
    );
}

function AICluster() {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Rotate the entire cluster slowly
            groupRef.current.rotation.y += delta * 0.05;
        }
    });

    const agents = Array.from({ length: 16 }, (_, i) => ({
        id: `AG-${i.toString(16).padStart(3, '0').toUpperCase()}`,
        name: `Proxy Intelligence 0x${Math.floor(Math.random() * 9000 + 1000)}`,
        status: Math.random() > 0.3 ? 'Online' : 'Dormant'
    }));

    return (
        <group ref={groupRef}>
            <CentralMonolith />
            {agents.map((agent, i) => {
                const angle = (i / agents.length) * Math.PI * 2;
                return (
                    <AgentSlab
                        key={agent.id}
                        angle={angle}
                        radius={7}
                        name={agent.name}
                        status={agent.status}
                        index={i}
                    />
                );
            })}
        </group>
    );
}

export default function ThroneOfKindlingPage() {
    const t = useT();

    return (
        <div className="relative selection:bg-primary/20">

            <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col w-full h-full min-h-[calc(100vh-80px)]">
                <PageHeader
                    title={t.council.throneOfKindling}
                    description={t.council.throneOfKindlingDesc}
                />

                <div className="mt-8 flex-1 w-full bg-[#030712] rounded-3xl overflow-hidden relative border border-slate-800 shadow-2xl flex flex-col max-h-[800px] min-h-[600px]">
                    {/* UI Overlay */}
                    <div className="absolute top-6 left-6 z-10 pointer-events-none">
                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 px-4 py-3 rounded-xl flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                <span className="text-white font-bold text-sm tracking-wider uppercase font-mono">System Online</span>
                            </div>
                            <div className="w-px h-4 bg-slate-700" />
                            <div className="flex flex-col">
                                <span className="text-slate-400 text-[9px] uppercase tracking-widest">Active Personas</span>
                                <span className="text-emerald-400 font-mono text-sm font-bold">11 / 16</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
                        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 px-6 py-2 rounded-full flex items-center gap-2 text-slate-300 text-xs font-medium tracking-wide">
                            <span className="material-symbols-outlined !text-[14px]">mouse</span>
                            Drag to rotate view (Horizontal only)
                        </div>
                    </div>

                    {/* 3D Canvas */}
                    <Canvas camera={{ position: [0, 2, 18], fov: 45 }}>
                        <color attach="background" args={['#0a101c']} />
                        <ambientLight intensity={1.5} />
                        <directionalLight position={[10, 10, 5]} intensity={2.0} color="#ffffff" />
                        <pointLight position={[-10, 0, -10]} intensity={1.5} color="#0ea5e9" />
                        <pointLight position={[10, -5, 10]} intensity={0.8} color="#f59e0b" />

                        <Suspense fallback={null}>
                            <AICluster />
                        </Suspense>

                        {/* Lock vertical rotation to strictly focus on the front view as requested */}
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
        </div>
    );
}
