import React from 'react';

/**
 * 计划用途：燎原广场 (Ledger Square) - 议案联署卡片
 * 格式：React + Tailwind CSS v4
 */

const ProposalCard = () => {
    return (
        <div className="relative cursor-move bg-white p-4 rounded-lg shadow-[0_2px_8px_0_rgba(99,99,99,0.1)] mb-4 border-3 border-dashed border-transparent transition-all duration-300 max-w-[350px] hover:shadow-[0_2px_8px_0_rgba(99,99,99,0.3)] hover:border-[#a2b7cf33]">
            <div className="w-full flex items-center justify-between">
                <span className="bg-[#1389eb] text-white text-[12px] px-[13px] py-[4px] rounded-full">
                    Govenance
                </span>
                <button className="bg-transparent border-0 text-[#c4cad3] text-[17px] cursor-pointer">
                    <svg className="fill-[#9fa4aa] w-5" viewBox="0 0 20 20">
                        <circle cx="10" cy="5" r="2" />
                        <circle cx="10" cy="10" r="2" />
                        <circle cx="10" cy="15" r="2" />
                    </svg>
                </button>
            </div>

            <p className="text-[15px] text-[#2e2e2f] my-[1.2rem] leading-snug">
                Proposed: Upgrade the AI Oracle engine to support multimodal verification.
            </p>

            <div className="relative w-full text-[#9fa4aa] text-[12px] flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center h-5 cursor-pointer hover:text-blue-500">
                        <svg className="h-full mr-1.5 stroke-[#9fa4aa]" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                        </svg>
                        <span>12</span>
                    </div>
                    <div className="flex items-center h-5 cursor-pointer hover:text-red-500">
                        <svg className="h-full mr-1.5 stroke-[#9fa4aa]" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>45</span>
                    </div>
                </div>

                <div className="flex items-center">
                    <div className="flex viewer">
                        <span className="h-[30px] w-[30px] bg-blue-600 -mr-2.5 rounded-full border border-white flex items-center justify-center font-bold text-white text-[10px] z-30">AD</span>
                        <span className="h-[30px] w-[30px] bg-indigo-600 -mr-2.5 rounded-full border border-white flex items-center justify-center font-bold text-white text-[10px] z-20">LZ</span>
                        <span className="h-[30px] w-[30px] bg-slate-500 rounded-full border border-white flex items-center justify-center font-bold text-white text-[10px] z-10">
                            <svg className="w-4 h-4 stroke-white" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                <path d="M12 4v16m8-8H4" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalCard;
