import React from 'react';

/**
 * 计划用途：任务结算 (Settlement) - 打分评价组件
 * 格式：React + Tailwind CSS v4
 * 特效：粒子爆炸(伪)、辉光、缩放、Peer状态联动
 */

const RatingStars = () => {
  const stars = [5, 4, 3, 2, 1]; // 逆序排列以支持 CSS 兄弟选择器逻辑（如果需要纯 CSS 实现）

  return (
    <div className="flex flex-row-reverse justify-center gap-2.5 group">
      {stars.map((star) => (
        <React.Fragment key={star}>
          <input
            type="radio"
            id={`star-${star}`}
            name="rating"
            value={star}
            className="peer absolute appearance-none"
          />
          <label
            htmlFor={`star-${star}`}
            title={`${star} stars`}
            className="relative cursor-pointer text-3xl transition-all duration-300 
                       hover:scale-120 hover:animate-pulse
                       peer-checked:scale-110
                       /* 伪元素粒子效果模拟 */
                       before:content-[''] before:absolute before:-top-4 before:left-1/2 before:-translate-x-1/2 before:w-1.5 before:h-1.5 before:bg-[#ff9e0b] before:rounded-full before:opacity-0 before:scale-0 hover:before:opacity-100 hover:before:scale-150 before:transition-all before:duration-400
                       after:content-[''] after:absolute after:-bottom-4 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-[#ff9e0b] after:rounded-full after:opacity-0 after:scale-0 hover:after:opacity-100 hover:after:scale-150 after:transition-all after:duration-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="1em"
              viewBox="0 0 576 512"
              className="fill-[#666] transition-all duration-300 
                         group-hover:fill-[#ff9e0b]
                         peer-checked:fill-[#ff9e0b] peer-checked:drop-shadow-[0_0_15px_rgba(255,158,11,0.9)]
                         peer-hover:fill-[#ff9e0b] peer-hover:drop-shadow-[0_0_15px_rgba(255,158,11,0.9)]
                         peer-hover:animate-[shimmer_1s_infinite_alternate]"
            >
              <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
            </svg>
          </label>
        </React.Fragment>
      ))}

      <style jsx global>{`
        @keyframes shimmer {
          0% { filter: drop-shadow(0 0 10px rgba(255, 158, 11, 0.5)); }
          100% { filter: drop-shadow(0 0 20px rgba(255, 158, 11, 1)); }
        }
      `}</style>
    </div>
  );
};

export default RatingStars;
