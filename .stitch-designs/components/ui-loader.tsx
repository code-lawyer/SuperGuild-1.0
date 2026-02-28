import React from 'react';

/**
 * 计划用途：界面切换 (Navigation/Loading) - 读条加载组件
 * 格式：React + Tailwind CSS v4
 * 特效：45度旋转、蛇形路径动画、多方块延迟跟随
 */

const UILoader = () => {
    const squares = Array.from({ length: 7 });

    return (
        <div className="flex items-center justify-center p-10 bg-black/5 rounded-2xl">
            <div className="relative w-24 h-24 rotate-45">
                {squares.map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-0 left-0 w-7 h-7 m-0.5 bg-white animate-[square-animation_10s_ease-in-out_infinite_both]"
                        style={{
                            animationDelay: `${-i * (10 / 7)}s`
                        }}
                    />
                ))}
            </div>

            <style jsx global>{`
        @keyframes square-animation {
          0%, 10.5% { left: 0; top: 0; }
          12.5%, 23% { left: 32px; top: 0; }
          25%, 35.5% { left: 64px; top: 0; }
          37.5%, 48% { left: 64px; top: 32px; }
          50%, 60.5% { left: 32px; top: 32px; }
          62.5%, 73% { left: 32px; top: 64px; }
          75%, 85.5% { left: 0; top: 64px; }
          87.5%, 98% { left: 0; top: 32px; }
          100% { left: 0; top: 0; }
        }
      `}</style>
        </div>
    );
};

export default UILoader;
