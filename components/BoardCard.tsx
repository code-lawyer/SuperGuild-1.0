'use client';

import Link from 'next/link';
import { formatUnits, zeroAddress } from 'viem';
import { useTokenSymbol } from '@/hooks/useContract';
import { BoardView } from '@/types/types';
import { getNativeTokenSymbol } from '@/utils/chain';
import { useAccount } from 'wagmi';
import Image from 'next/image';

export default function BoardCard({
  board,
  creatorProfile
}: {
  board: BoardView;
  creatorProfile?: {
    nickname: string;
    avatar: string;
  }
}) {
  const { chain } = useAccount();
  const { data: tokenSymbol } = useTokenSymbol(board.rewardToken);

  const tokenLabel = tokenSymbol ?? ((board.rewardToken === zeroAddress && getNativeTokenSymbol(chain)) || '');
  const amountLabel = board.totalPledged ? formatUnits(board.totalPledged, 18) : '0';

  return (
    <Link key={board.id.toString()} href={`/board/${board.id}`}>
      <div className="bg-white rounded-2xl p-8 group cursor-pointer relative overflow-hidden flex flex-col h-full border border-slate-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-slate-200">
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-2 duration-300">
          <span className="material-symbols-outlined text-slate-400">arrow_outward</span>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-3 items-center">
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">Live</span>
            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full font-mono border border-slate-100">ID: #{board.id.toString()}</span>
          </div>
        </div>

        {board.img && (
          <div className="relative w-12 h-12 mb-4 overflow-hidden rounded-xl border border-slate-100 shadow-sm flex-shrink-0">
            <Image
              src={board.img}
              alt={board.name}
              fill
              className="object-cover"
              sizes="48px"
              priority={false}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.png';
              }}
            />
          </div>
        )}

        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">
          {board.name}
        </h3>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed font-light line-clamp-3">
          {board.description}
        </p>

        <div className="mt-auto space-y-6">
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Reward</div>
              <div className="text-xl font-mono font-bold text-slate-900 tracking-tight">{amountLabel} {tokenLabel}</div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Creator</div>
              <div className="flex items-center gap-1">
                {creatorProfile?.avatar ? (
                  <Image
                    src={creatorProfile.avatar}
                    alt="Creator"
                    width={16}
                    height={16}
                    className="w-4 h-4 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[10px] text-slate-400">person</span>
                  </div>
                )}
                <span className="text-xs font-medium text-slate-600 max-w-[80px] truncate">
                  {creatorProfile?.nickname || `${board.creator.slice(0, 6)}...`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
