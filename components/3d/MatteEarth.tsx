"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

function EarthModel() {
    const earthRef = useRef<THREE.Mesh>(null);

    // Slow rotation for the earth
    useFrame((state, delta) => {
        if (earthRef.current) {
            // Very slow rotation
            earthRef.current.rotation.y += delta * 0.02;
        }
    });

    return (
        <group>
            {/* 
        Lighting setup to emphasize the "Matte" and "Clay" feel.
        We want soft, diffused lighting with low contrast to maintain the grayscale/minimalist vibe.
      */}
            <ambientLight intensity={1.5} color="#f8fafc" />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" castShadow />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#e2e8f0" />

            {/* 
        The Earth Sphere
        Position changed to bottom-right to create "floating above it" aesthetics
      */}
            <Sphere ref={earthRef} args={[4, 64, 64]} position={[3, -2.5, -2]}>
                <meshStandardMaterial
                    color="#f1f5f9" // Very light gray/slate-100
                    roughness={1} // Maximum roughness for matte feel
                    metalness={0.0} // No metallic reflection
                    flatShading={true} // Low-poly / flat shading gives it a structural, architectural feel
                />
            </Sphere>

            {/* 
        Optional: Wireframe layer 
      */}
            <Sphere args={[4.02, 32, 32]} position={[3, -2.5, -2]}>
                <meshBasicMaterial
                    color="#cbd5e1" // Slate-300 wireframe
                    wireframe={true}
                    transparent
                    opacity={0.3}
                />
            </Sphere>
        </group>
    );
}

export function MatteEarth() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <EarthModel />
            </Canvas>
        </div>
    );
}
