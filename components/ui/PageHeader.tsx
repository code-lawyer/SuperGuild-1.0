import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="w-full pt-12 pb-8 mb-8 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row md:items-end justify-between gap-4 relative">
            {/* Ambient glow decoration */}
            <div className="absolute top-0 left-0 w-48 h-48 opacity-[0.06] pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_0_0,#137fec_0%,transparent_70%)]" />
            </div>

            <div className="flex flex-col gap-2.5 relative z-10">
                {/* Title row with primary accent */}
                <div className="flex items-center gap-3">
                    <div className="w-1 h-9 rounded-full bg-primary" style={{ boxShadow: '0 0 12px rgba(19,127,236,0.5)' }} />
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                        {title}
                    </h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 max-w-xl text-sm md:text-base font-medium leading-relaxed pl-4">
                    {description}
                </p>
            </div>

            {action && (
                <div className="relative z-10 shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}
