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
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:60px_60px]" />
                </div>
                <div className="max-w-[1280px] mx-auto px-6 py-8 relative z-10">
                    <PageHeader title={title} description={description} />
                    {children}
                </div>
            </div>
        </WalletGatePage>
    );
}
