export function ProposalSkeleton() {
    return (
        <div className="w-full flex flex-col md:flex-row gap-6 p-8 rounded-2xl bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 animate-pulse">
            {/* Left side: Header & Body */}
            <div className="flex-1">
                {/* Header tags */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700/50 rounded-md" />
                    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-md" />
                </div>

                {/* Title */}
                <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700/50 rounded-lg mb-3" />

                {/* Description lines */}
                <div className="space-y-2 mb-6">
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700/50 rounded" />
                    <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700/50 rounded" />
                </div>

                {/* Proposer Info */}
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700/50 rounded-full" />
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700/50 rounded" />
                </div>
            </div>

            {/* Right side: Stats & Action */}
            <div className="w-full md:w-64 shrink-0 flex flex-col justify-between p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <div className="space-y-4">
                    {/* Progress Header */}
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700/50 rounded" />

                    {/* Values */}
                    <div className="flex items-baseline gap-2">
                        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-lg" />
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700/50 rounded" />
                    </div>

                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700/50 rounded" />
                </div>

                {/* Buton Space */}
                <div className="mt-6 flex justify-between items-center">
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700/50 rounded" />
                    <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
