import React from 'react';

/**
 * 计划用途：柴薪王座 (Pyre Throne) - AI 人格展示橱窗
 * 格式：React + Tailwind CSS v4
 * 特性：3D 透视、Z轴位移、3D旋转
 */

const AIThroneCard = () => {
    return (
        <div className="[perspective:500px]">
            <div className="group relative w-[200px] h-[250px] bg-[#16161d] border-2 border-[#555] rounded-sm [transform-style:preserve-3d] transition-transform duration-500 will-change-transform hover:[transform:translateZ(10px)_rotateX(20deg)_rotateY(20deg)]">
                <div className="absolute top-1/2 right-5 -translate-y-1/2 text-white font-bold text-2xl font-mono transition-transform duration-500 
                        [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]
                        group-hover:[transform:translateZ(50px)]">
                    AI ID
                </div>

                {/* 建议以后在这里增加 AI 头像层，并赋予 translateZ(30px) */}
                <div className="absolute inset-0 border border-white/5 pointer-events-none"></div>
            </div>
        </div>
    );
};

export default AIThroneCard;
