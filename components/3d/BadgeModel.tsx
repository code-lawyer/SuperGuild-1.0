'use client';

import { Suspense, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGraph, useFrame } from '@react-three/fiber';
import { useGLTF, Float, Clone } from '@react-three/drei';

interface BadgeModelProps {
    type: 'pioneer' | 'flame' | 'lantern';
    isThumbnail?: boolean;
}

// 提取着色器逻辑
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

export default function BadgeModel({ type, isThumbnail = false }: BadgeModelProps) {
    const gltfPath = type === 'pioneer' ? '/models/pioneer.glb' : type === 'flame' ? '/models/flame.glb' : '/models/lantern.glb';
    const { scene } = useGLTF(gltfPath);

    // 必须克隆场景！否则多个 Canvas 重复使用相同 GLTF 实例会导致材质和节点冲突
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    const materialsRef = useRef<THREE.Material[]>([]);

    const colors = {
        pioneer: new THREE.Color('#3b82f6'),
        flame: new THREE.Color('#ef4444'),
        lantern: new THREE.Color('#eab308'),
    };

    useEffect(() => {
        materialsRef.current = [];
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                // 如果是缩略图，我们尽量保留原有的 PBR 材质即可，橱窗里才加动态 Shader 避免性能问题
                if (!isThumbnail) {
                    // 克隆材质，防止污染原材质
                    if (mesh.material) {
                        const mat = (mesh.material as THREE.Material).clone();
                        mat.onBeforeCompile = (shader: any) => {
                            injectGlowShader(shader, colors[type]);
                            mat.userData.shader = shader;
                        };
                        mesh.material = mat;
                        materialsRef.current.push(mat);
                    }
                }
            }
        });
    }, [clonedScene, isThumbnail, type]);

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

// 预加载模型，提升 UX
useGLTF.preload('/models/pioneer.glb');
useGLTF.preload('/models/flame.glb');
useGLTF.preload('/models/lantern.glb');
