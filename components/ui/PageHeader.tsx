import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="w-full pt-16 pb-8 mb-8 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row md:items-end justify-between gap-4 relative">
            {/* Protocol Background Decoration */}
            <div className="absolute top-0 left-0 w-32 h-32 opacity-5 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 border-r border-b border-primary" />
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0_0,var(--color-primary)_0%,transparent_70%)]" />
            </div>

            <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        {title}
                    </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg font-medium tracking-tight pl-5 border-l border-slate-200 dark:border-slate-800 ml-1">
                    {description}
                </p>
            </div>
            {action && (
                <div className="relative z-10 shrink-0 mb-1">
                    {action}
                </div>
            )}
        </div>
    );
}
