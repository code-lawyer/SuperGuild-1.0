export function VotePanelSkeleton() {
    return (
        <div className="w-full bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="w-full">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    </div>
                    <div className="h-8 w-2/3 max-w-[400px] bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
                <div className="hidden md:block text-right shrink-0">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-2 ml-auto" />
                    <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                </div>
            </div>

            {/* Vote Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                {[1, 2].map((i) => (
                    <div key={i} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/10 h-32 flex flex-col justify-end">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
                        <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="flex gap-3">
                    <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
