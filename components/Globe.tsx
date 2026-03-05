'use client';

import { useEffect, useRef, useCallback } from 'react';
import createGlobe from 'cobe';

/**
 * COBE 点阵旋转地球组件
 * 轻量级 (~5KB)，基于 2D Canvas 模拟 3D 效果
 * 支持：自动旋转、拖拽交互、prefers-reduced-motion、淡入动画
 */
export default function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

  // 响应式尺寸计算
  const getSize = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const base = Math.max(vw, vh);
    if (vw < 640) return Math.round(base * 0.85);
    if (vw < 1024) return Math.round(base * 0.75);
    return Math.round(base * 0.8);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 检测 prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 检测暗色模式
    const isDark = document.documentElement.classList.contains('dark');

    let currentSize = getSize();

    // 配色：亮色模式偏暖白，暗色模式偏深蓝黑
    const baseColor: [number, number, number] = isDark
      ? [0.08, 0.1, 0.14]
      : [0.93, 0.93, 0.93];
    const glowColor: [number, number, number] = isDark
      ? [0.06, 0.08, 0.15]
      : [0.88, 0.88, 0.92];
    const markerColor: [number, number, number] = isDark
      ? [0.4, 0.45, 0.55]
      : [0.25, 0.25, 0.28];

    globeRef.current = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      width: currentSize * 2,
      height: currentSize * 2,
      phi: 0,
      theta: 0.25,
      dark: isDark ? 1 : 0,
      diffuse: 1.4,
      mapSamples: 20000,
      mapBrightness: isDark ? 3 : 6,
      baseColor,
      markerColor,
      glowColor,
      markers: [
        // 7 个全球城市节点 — 突显 "公会全球链接" 叙事
        { location: [31.2304, 121.4737], size: 0.06 },  // 上海
        { location: [39.9042, 116.4074], size: 0.05 },  // 北京
        { location: [22.3193, 114.1694], size: 0.05 },  // 香港
        { location: [35.6762, 139.6503], size: 0.05 },  // 东京
        { location: [37.7749, -122.4194], size: 0.05 }, // 旧金山
        { location: [51.5074, -0.1278], size: 0.05 },   // 伦敦
        { location: [1.3521, 103.8198], size: 0.05 },    // 新加坡
      ],
      onRender: (state) => {
        // 自转（如果用户没有正在拖拽、且无 reduced-motion）
        if (!pointerInteracting.current && !prefersReducedMotion) {
          phiRef.current += 0.002;
        }
        state.phi = phiRef.current + pointerInteractionMovement.current;
        state.width = currentSize * 2;
        state.height = currentSize * 2;
      },
    });

    // Canvas 淡入动画 (1.5s)
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 1.5s ease';
    requestAnimationFrame(() => {
      canvas.style.opacity = '1';
    });

    // 窗口 resize 更新尺寸
    const handleResize = () => {
      currentSize = getSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      globeRef.current?.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, [getSize]);

  // 拖拽交互
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerInteracting.current = e.clientX;
    canvasRef.current!.style.cursor = 'grabbing';
  };

  const handlePointerUp = () => {
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const delta = e.clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta / 200;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
        contain: 'layout paint size',
      }}
      aria-hidden="true"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerUp}
      onPointerMove={handlePointerMove}
    />
  );
}
