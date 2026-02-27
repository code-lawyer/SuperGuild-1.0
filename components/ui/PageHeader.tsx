import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    action?: ReactNode; // Optional right-side action like a button
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="w-full pt-16 pb-8 mb-8 border-b border-border-light dark:border-border-dark flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    {title}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-lg font-medium tracking-wide">
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
