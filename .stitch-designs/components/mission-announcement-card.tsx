import React from 'react';

/**
 * 计划用途：任务公告 (Mission Announcement) - 悬浮卡片
 * 格式：React + Tailwind CSS v4
 * 特效：悬停时边框变色、阴影加深、底部按钮平滑弹出
 */

const MissionAnnouncementCard = () => {
    return (
        <div className="group relative w-[190px] h-[254px] bg-[#f5f5f5] p-[1.8rem] border-2 border-[#c3c6ce] rounded-[20px] transition-all duration-500 ease-out hover:border-[#008bf8] hover:shadow-[0_4px_18px_0_rgba(0,0,0,0.25)] overflow-visible">
            {/* 卡片详情区 */}
            <div className="h-full flex flex-col justify-center items-center gap-[0.5em] text-center">
                <p className="text-black text-[1.5em] font-bold leading-tight">Mission Title</p>
                <p className="text-[rgb(134,134,134)] text-sm">Brief details about this super mission</p>
            </div>

            {/* 底部弹出按钮 */}
            <button className="absolute left-1/2 bottom-0 w-[60%] -translate-x-1/2 translate-y-[125%] px-4 py-2 bg-[#008bf8] text-white text-base rounded-[1rem] border-none opacity-0 transition-all duration-300 ease-out 
                       group-hover:translate-y-1/2 group-hover:opacity-100 cursor-pointer">
                More info
            </button>
        </div>
    );
};

export default MissionAnnouncementCard;
