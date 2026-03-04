'use client';

import { CheckCircle, Download, ExternalLink, ShieldCheck, Share2 } from 'lucide-react';
import Link from 'next/link';
import { WalletGatePage } from '@/components/ui/WalletGatePage';

export default function SettlementPage() {
    return (
        <WalletGatePage>
            <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 animate-in fade-in zoom-in duration-1000 relative">

                {/* Ambient Success Aura */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

                <div className="ag-card max-w-lg w-full p-8 md:p-10 relative overflow-hidden group">

                    {/* Subtle top sub-glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-green-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                    <div className="relative text-center space-y-8">

                        {/* Success Icon */}
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-[0_0_40px_rgba(34,197,94,0.15)] relative group-hover:scale-105 transition-transform duration-500">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md opacity-50"></div>
                            <CheckCircle className="w-12 h-12 text-green-400 relative z-10" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-sans font-extrabold text-white mb-2 tracking-tight glowing-text">Settlement Complete</h1>
                            <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">Transaction Verified on Chain</p>
                        </div>

                        {/* Receipt Details */}
                        <div className="glass-panel p-6 space-y-5 text-left bg-white/[0.02]">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-mono text-xs">BOUNTY ID</span>
                                <span className="text-zinc-200 font-mono font-medium">#8821A</span>
                            </div>
                            <div className="h-px w-full bg-white/5"></div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-mono text-xs">PAYOUT</span>
                                <div className="text-right">
                                    <div className="text-white font-bold font-mono text-lg glowing-text">$4,500.00 <span className="text-xs text-zinc-500 font-sans tracking-normal font-normal">USDC</span></div>
                                    <div className="text-[10px] text-green-400 font-mono mt-0.5">+ 500 VCP</div>
                                </div>
                            </div>
                            <div className="h-px w-full bg-white/5"></div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-mono text-xs">NETWORK FEE</span>
                                <span className="text-zinc-400 font-mono text-xs">0.0042 ETH</span>
                            </div>
                            <div className="h-px w-full bg-white/5"></div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-mono text-xs">TIMESTAMP</span>
                                <span className="text-zinc-400 font-mono text-xs">2026-10-24 14:32:01 UTC</span>
                            </div>
                        </div>

                        {/* Secondary Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-2 ag-btn-secondary py-3 text-xs w-full">
                                <Download className="w-4 h-4" />
                                RECEIPT
                            </button>
                            <button className="flex items-center justify-center gap-2 ag-btn-secondary py-3 text-xs w-full">
                                <ExternalLink className="w-4 h-4" />
                                EXPLORER
                            </button>
                        </div>

                        {/* Primary Action */}
                        <div className="pt-2">
                            <Link href="/" className="ag-btn-primary flex items-center justify-center w-full py-4 text-sm font-bold tracking-wide">
                                RETURN TO HUB
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </WalletGatePage>
    );
}
