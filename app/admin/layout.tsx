'use client';

import { AdminGuard } from '@/components/admin/AdminGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: 'dashboard' },
        { name: 'Bulletin Board', href: '/admin/bulletins', icon: 'campaign' },
        { name: 'Service Plans', href: '/admin/services', icon: 'build' },
    ];

    return (
        <AdminGuard>
            <div className="flex min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-bg-dark">

                {/* Admin Sidebar */}
                <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 flex flex-col">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                            SuperGuild Admin
                        </h2>
                    </div>

                    <nav className="p-4 flex-grow space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                            ? 'bg-primary/10 text-primary font-bold'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-grow p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}
