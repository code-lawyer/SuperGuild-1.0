'use client';

import { ReactNode } from 'react';
import { WalletGatePage } from '@/components/ui/WalletGatePage';
import { PageHeader } from '@/components/ui/PageHeader';

export function ServicePageLayout({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <WalletGatePage>
            <div className="relative min-h-screen">
                {/* Background grid */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.04] dark:opacity-[0.07]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50 dark:to-zinc-950/80" />
                </div>
                {/* Left accent rail */}
                <div className="fixed left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent pointer-events-none z-0" />

                <div className="max-w-[1280px] mx-auto px-6 py-8 relative z-10">
                    {/* System status bar */}
                    <div className="flex items-center gap-3 mb-6 text-[10px] font-mono text-slate-400 dark:text-zinc-600 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>SYS // AUTONOMOUS_OFFICE</span>
                        <span className="text-slate-300 dark:text-zinc-700">—</span>
                        <span>MODULE ONLINE</span>
                    </div>
                    <PageHeader title={title} description={description} />
                    {children}
                </div>
            </div>
        </WalletGatePage>
    );
}
