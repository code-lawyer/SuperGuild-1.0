"use client";

import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    length: number;
    angle: number;
    color: string;
    speed: number;
    baseVx: number;
    baseVy: number;
}

export function MouseGlowBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        // Google Antigravity themed colors
        const colorPalette = [
            "#4285F4", // Blue
            "#EA4335", // Red
            "#FBBC05", // Yellow
            "#34A853", // Green
            "#8E44AD"  // Purple
        ];

        let mouse = { x: -1000, y: -1000, vx: 0, vy: 0, radius: 400, isMoving: false };
        let mouseTimeout: NodeJS.Timeout;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            // Calculate amount based on screen size for performance
            const numParticles = Math.max(80, Math.floor((canvas.width * canvas.height) / 12000));

            for (let i = 0; i < numParticles; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 0.4 + 0.1; // gentle base drift speed

                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    baseVx: Math.cos(angle) * speed,
                    baseVy: Math.sin(angle) * speed,
                    length: Math.random() * 30 + 10,
                    angle,
                    color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
                    speed,
                });
            }
        };

        const drawParticles = () => {
            // Clear with transparent background so it sits behind the actual page background
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.globalCompositeOperation = "source-over";

            particles.forEach((p) => {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (mouse.isMoving && distance < mouse.radius) {
                    // Attract strongly to form a stream
                    const force = Math.pow((mouse.radius - distance) / mouse.radius, 1.2);
                    p.vx += (dx / distance) * force * 1.5;
                    p.vy += (dy / distance) * force * 1.5;

                    // Drag along with mouse velocity
                    p.vx += mouse.vx * force * 0.03;
                    p.vy += mouse.vy * force * 0.03;
                } else if (!mouse.isMoving && mouse.x !== -1000 && distance < mouse.radius * 0.6) {
                    // Scatter gracefully when stopped
                    const force = Math.pow((mouse.radius * 0.6 - distance) / (mouse.radius * 0.6), 2);
                    p.vx -= (dx / distance) * force * 0.5;
                    p.vy -= (dy / distance) * force * 0.5;
                }

                // Apply friction and return to base velocity
                p.vx *= 0.92;
                p.vy *= 0.92;

                p.vx += (p.baseVx) * 0.06;
                p.vy += (p.baseVy) * 0.06;

                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around screen boundaries seamlessly
                if (p.x < -100) p.x = canvas.width + 100;
                if (p.x > canvas.width + 100) p.x = -100;
                if (p.y < -100) p.y = canvas.height + 100;
                if (p.y > canvas.height + 100) p.y = -100;

                // Calculate dynamic angle based on actual current velocity (direction of movement)
                const currentVelocity = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                const dynamicAngle = Math.atan2(p.vy, p.vx);

                // Stretch length slightly based on speed for motion blur illusion
                const dynamicLength = p.length + (currentVelocity * 3);

                // Draw particle as a glowing dash
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(dynamicAngle);

                ctx.beginPath();
                // Draw line segment
                ctx.moveTo(-dynamicLength / 2, 0);
                ctx.lineTo(dynamicLength / 2, 0);

                ctx.lineWidth = 2; // slightly thicker
                ctx.strokeStyle = p.color;

                // Add subtle glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                // Global opacity lower so it does not interfere with reading text
                ctx.globalAlpha = 0.25;

                ctx.stroke();
                ctx.restore();
            });
        };

        const render = () => {
            drawParticles();
            animationFrameId = requestAnimationFrame(render);
        };

        window.addEventListener("resize", resizeCanvas);

        const handleMouseMove = (e: MouseEvent) => {
            mouse.vx = e.clientX - mouse.x;
            mouse.vy = e.clientY - mouse.y;
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.isMoving = true;

            clearTimeout(mouseTimeout);
            mouseTimeout = setTimeout(() => {
                mouse.isMoving = false;
            }, 100);
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        }

        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);

        resizeCanvas();
        render();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[-1]"
            style={{
                width: "100%",
                height: "100%",
            }}
        />
    );
}
