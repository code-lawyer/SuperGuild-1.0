'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF, Float } from '@react-three/drei';
import { PRIVILEGE_NFT } from '@/constants/nft-config';

interface BadgeModelProps {
    glbPath: string;
    glowColor: string;
    isThumbnail?: boolean;
}

function computeNormalizedScale(scene: THREE.Object3D, targetSize: number): number {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) return 1;
    return targetSize / maxDim;
}

export default function BadgeModel({ glbPath, isThumbnail = false }: BadgeModelProps) {
    const { scene } = useGLTF(glbPath);
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    const normalizedScale = useMemo(
        () => computeNormalizedScale(clonedScene, isThumbnail ? 1.8 : 2.8),
        [clonedScene, isThumbnail],
    );

    // Clone each mesh's material so we never mutate the shared GLB cache.
    // All original material properties — textures, PBR values, emissive maps — are preserved.
    useEffect(() => {
        clonedScene.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;
            const mesh = child as THREE.Mesh;
            if (Array.isArray(mesh.material)) {
                mesh.material = mesh.material.map(m => m?.clone() ?? m);
            } else if (mesh.material) {
                mesh.material = (mesh.material as THREE.Material).clone();
            }
        });
    }, [clonedScene]);

    return (
        <Float
            speed={isThumbnail ? 1 : 2}
            rotationIntensity={isThumbnail ? 0.5 : 1}
            floatIntensity={isThumbnail ? 0.5 : 1.5}
        >
            <primitive object={clonedScene} scale={normalizedScale} />
        </Float>
    );
}

// Preload all privilege NFT models
Object.values(PRIVILEGE_NFT.tokens).forEach(token => {
    useGLTF.preload(token.glbPath);
});
