import { ReactNode } from 'react';

export default function CouncilLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative min-h-screen selection:bg-primary/20">
            {/* Terminal Grid Background */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>

            <main className="relative z-10 w-full min-h-screen">
                {children}
            </main>
        </div>
    );
}
