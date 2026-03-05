'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function SpaceStation() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <motion.div
            className="relative w-full h-full pointer-events-none select-none"
            // 核心浮动动画：在 Y 轴上下浮动，并伴随极其轻微的旋转
            animate={{
                y: [0, -25, 0],
                rotate: [-1, 2, -1], // 模拟在太空中的失重晃动
            }}
            transition={{
                duration: 12, // 呼吸般的缓慢节奏
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            <div className="absolute inset-0 max-w-full max-h-full flex items-center justify-center">
                <Image
                    src="/iss.png"
                    alt="International Space Station"
                    fill
                    // 核心魔法：
                    // 1. grayscale + contrast + brightness: 将浅灰色的棋盘格强行“爆亮”成纯白，保留深色建筑线条
                    // 2. mix-blend-multiply: 纯白在 multiply 模式下完全透明，完美溶于亮色背景
                    // 3. dark:invert + dark:mix-blend-screen: 暗黑模式下反相图片（白变黑），screen 模式下黑色完全透明，线条变为发光的白色
                    className="object-contain w-full h-auto opacity-70 grayscale contrast-[1.5] brightness-[1.1] mix-blend-multiply dark:invert dark:mix-blend-screen dark:opacity-60"
                    priority
                />
            </div>
        </motion.div>
    );
}
