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

const injectGlowShader = (shader: any, glowColor: THREE.Color) => {
    shader.uniforms.glowColor = { value: glowColor };
    shader.uniforms.time = { value: 0 };

    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
    #include <common>
    varying vec3 vViewDirection;
    varying vec3 vWorldNormal;
    `
    );
    shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
    #include <worldpos_vertex>
    vWorldNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
    `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
    #include <common>
    varying vec3 vViewDirection;
    varying vec3 vWorldNormal;
    uniform vec3 glowColor;
    uniform float time;
    `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
    #include <dithering_fragment>
    float dotProduct = dot(vViewDirection, vWorldNormal);
    float fresnel = pow(clamp(1.0 - abs(dotProduct), 0.0, 1.0), 3.0);
    fresnel = fresnel * 0.6; // cap glow intensity to preserve original material color
    float pulse = (sin(time * 2.0) * 0.5 + 0.5) * 0.3 + 0.7;
    gl_FragColor = vec4(mix(gl_FragColor.rgb, glowColor * pulse, fresnel), gl_FragColor.a);
    `
    );

    return shader;
};

/**
 * Compute a uniform scale factor that fits any model into a target size.
 * This solves the problem of GLB models having wildly different native sizes
 * (some 10cm, some 5m) — they all get normalized to the same visual size.
 */
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

    // Auto-normalize: thumbnail fits in ~1.8 units, modal fits in ~2.8 units
    const normalizedScale = useMemo(
        () => computeNormalizedScale(clonedScene, isThumbnail ? 1.8 : 2.8),
        [clonedScene, isThumbnail],
    );

    useEffect(() => {
        materialsRef.current = [];
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    const mat = (mesh.material as THREE.Material).clone();

                    // Apply glowColor as a strong base tint (60% color, 40% white).
                    // The lerp target is a light grey rather than pure white so the
                    // tint remains visible even under bright lighting.
                    if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                        const std = mat as THREE.MeshStandardMaterial;
                        const lightGrey = new THREE.Color(0xd0d0d0);
                        const tint = color.clone().lerp(lightGrey, 0.4);
                        std.color.set(tint);
                        std.metalness = 0.4;
                        std.roughness = 0.45;
                        std.envMapIntensity = 0.6;
                    }

                    if (!isThumbnail) {
                        mat.onBeforeCompile = (shader: any) => {
                            injectGlowShader(shader, color);
                            mat.userData.shader = shader;
                        };
                    }
                    mesh.material = mat;
                    materialsRef.current.push(mat);
                }
            }
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

// 预加载所有特权 NFT 模型
Object.values(PRIVILEGE_NFT.tokens).forEach(token => {
    useGLTF.preload(token.glbPath);
});
