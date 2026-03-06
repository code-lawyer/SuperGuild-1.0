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
    float fresnel = pow(1.0 - max(0.0, dotProduct), 3.0);
    float pulse = (sin(time * 2.0) * 0.5 + 0.5) * 0.5 + 0.5;
    gl_FragColor = vec4(mix(gl_FragColor.rgb, glowColor * pulse, fresnel), gl_FragColor.a);
    `
    );

    return shader;
};

export default function BadgeModel({ glbPath, glowColor, isThumbnail = false }: BadgeModelProps) {
    const { scene } = useGLTF(glbPath);
    const clonedScene = useMemo(() => scene.clone(true), [scene]);
    const materialsRef = useRef<THREE.Material[]>([]);
    const color = useMemo(() => new THREE.Color(glowColor), [glowColor]);

    useEffect(() => {
        materialsRef.current = [];
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (!isThumbnail && mesh.material) {
                    const mat = (mesh.material as THREE.Material).clone();
                    mat.onBeforeCompile = (shader: any) => {
                        injectGlowShader(shader, color);
                        mat.userData.shader = shader;
                    };
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
            <primitive object={clonedScene} scale={isThumbnail ? 1.0 : 1.5} />
        </Float>
    );
}

// 预加载所有特权 NFT 模型
Object.values(PRIVILEGE_NFT.tokens).forEach(token => {
    useGLTF.preload(token.glbPath);
});
