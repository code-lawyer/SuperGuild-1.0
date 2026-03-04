'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';

interface Service {
    id: string;
    channel: number;
    category: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    icon: string;
    sort_order: number;
    parent_id: string | null;
    unlock_type: string;
    is_active: boolean;
}

export default function AdminServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState(0);
    const [channel, setChannel] = useState(1);
    const [category, setCategory] = useState('');
    const [icon, setIcon] = useState('hub');
    const [isActive, setIsActive] = useState(true);

    const fetchServices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('channel', { ascending: true })
            .order('sort_order', { ascending: true });

        if (!error && data) {
            setServices(data as Service[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchServices();
    }, [supabase]);

    const handleEdit = (service: Service) => {
        setCurrentEditId(service.id);
        setTitle(service.title);
        setDescription(service.description || '');
        setPrice(service.price);
        setChannel(service.channel);
        setCategory(service.category);
        setIcon(service.icon || 'hub');
        setIsActive(service.is_active);
        setIsEditing(true);
    };

    const handleCreateNew = () => {
        setCurrentEditId(null);
        setTitle('');
        setDescription('');
        setPrice(0);
        setChannel(1);
        setCategory('new-category');
        setIcon('hub');
        setIsActive(true);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentEditId(null);
    };

    const handleSave = async () => {
        if (!title.trim()) return;

        const payload = {
            title,
            description,
            price,
            channel,
            category,
            icon,
            is_active: isActive,
            currency: 'USDC',
            unlock_type: 'ITEM', // default
            sort_order: 0 // default
        };

        if (currentEditId) {
            await supabase
                .from('services')
                .update(payload)
                .eq('id', currentEditId);
        } else {
            await supabase
                .from('services')
                .insert([payload]);
        }

        setIsEditing(false);
        fetchServices();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;
        await supabase.from('services').delete().eq('id', id);
        fetchServices();
    };

    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {currentEditId ? 'Edit Service' : 'Create Service'}
                    </h1>
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Price (USDC)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Channel (1-3)</label>
                            <input
                                type="number"
                                min={1}
                                max={3}
                                value={channel}
                                onChange={(e) => setChannel(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category ID</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Material Icon</label>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-5 h-5 rounded text-primary focus:ring-primary"
                        />
                        <label htmlFor="isActive" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            Is Active (Visible to users)
                        </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white px-8">
                            Save Service
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Service Plans</h1>
                <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Create New
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading services...</div>
                ) : services.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No services found.</div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {services.map((service) => (
                            <li key={service.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">{service.icon || 'hub'}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {service.title}
                                            {!service.is_active && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500">Draft</span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1 flex gap-4">
                                            <span>Channel {service.channel}</span>
                                            <span className="font-mono">{service.price} USDC</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                                        Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(service.id)}>
                                        Delete
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
