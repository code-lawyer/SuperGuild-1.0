'use client';

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Float } from '@react-three/drei';
import { PRIVILEGE_NFT } from '@/constants/nft-config';

interface BadgeModelProps {
    glbPath: string;
    glowColor: string;
    isThumbnail?: boolean;
}

/**
 * Fresnel edge-glow shader injected in modal (non-thumbnail) mode only.
 * Adds an animated pulse at silhouette edges using the badge's glowColor.
 */
const injectGlowShader = (shader: any, glowColor: THREE.Color) => {
    shader.uniforms.glowColor = { value: glowColor };
    shader.uniforms.time = { value: 0 };

    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
    varying vec3 vViewDirection;
    varying vec3 vWorldNormal;`
    );
    shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
    vWorldNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
    varying vec3 vViewDirection;
    varying vec3 vWorldNormal;
    uniform vec3 glowColor;
    uniform float time;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
    float dotProduct = dot(vViewDirection, vWorldNormal);
    float fresnel = pow(clamp(1.0 - abs(dotProduct), 0.0, 1.0), 3.0) * 0.55;
    float pulse = (sin(time * 2.0) * 0.5 + 0.5) * 0.3 + 0.7;
    gl_FragColor = vec4(mix(gl_FragColor.rgb, glowColor * pulse, fresnel), gl_FragColor.a);`
    );

    return shader;
};

function computeNormalizedScale(scene: THREE.Object3D, targetSize: number): number {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim === 0) return 1;
    return targetSize / maxDim;
}

export default function BadgeModel({ glbPath, glowColor, isThumbnail = false }: BadgeModelProps) {
    const { scene } = useGLTF(glbPath);
    const clonedScene = useMemo(() => scene.clone(true), [scene]);
    const materialsRef = useRef<THREE.Material[]>([]);
    const color = useMemo(() => new THREE.Color(glowColor), [glowColor]);

    const normalizedScale = useMemo(
        () => computeNormalizedScale(clonedScene, isThumbnail ? 1.8 : 2.8),
        [clonedScene, isThumbnail],
    );

    useEffect(() => {
        materialsRef.current = [];
        clonedScene.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;
            const mesh = child as THREE.Mesh;

            // Handle both single material and material arrays
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            const newMats = mats.map((srcMat) => {
                if (!srcMat) return srcMat;
                // Replace with MeshStandardMaterial so we have full control.
                // Original material type is discarded — GLB models are plain white
                // geometry with no meaningful embedded color anyway.
                const mat = new THREE.MeshStandardMaterial({
                    color: color.clone(),   // exact glowColor — source of truth for appearance
                    metalness: 0.55,
                    roughness: 0.35,
                    envMapIntensity: 0,     // CRITICAL: disable IBL so no env preset can override color
                });

                if (!isThumbnail) {
                    mat.onBeforeCompile = (shader: any) => {
                        injectGlowShader(shader, color);
                        mat.userData.shader = shader;
                    };
                    // needsUpdate so onBeforeCompile fires on next render
                    mat.needsUpdate = true;
                }

                materialsRef.current.push(mat);
                return mat;
            });

            mesh.material = Array.isArray(mesh.material) ? newMats : newMats[0];
        });
    }, [clonedScene, isThumbnail, color]);

    useFrame((state) => {
        if (!isThumbnail) {
            materialsRef.current.forEach((mat) => {
                if (mat.userData.shader) {
                    mat.userData.shader.uniforms.time.value = state.clock.elapsedTime;
                }
            });
        }
    });

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
