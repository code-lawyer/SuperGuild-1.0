'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { useAdminAction } from '@/hooks/useAdminAction';

interface ServiceDoc {
    name: string;
    url: string;
    size: string;
}

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
    documents: ServiceDoc[];
    price_usdc: number | null;
    expert_avatar_url: string | null;
    expert_tags: string[] | null;
}

export default function AdminServicesPage() {
    const t = useT();
    const { callAdmin } = useAdminAction();
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
    const [documents, setDocuments] = useState<ServiceDoc[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // New fields for channel-specific data
    const [priceUsdc, setPriceUsdc] = useState<number | ''>('');
    const [expertAvatarUrl, setExpertAvatarUrl] = useState('');
    const [expertTags, setExpertTags] = useState('');
    const [parentId, setParentId] = useState('');
    // Channel filter for list view
    const [channelFilter, setChannelFilter] = useState(0);

    const fetchServices = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('channel', { ascending: true })
            .order('sort_order', { ascending: true });

        if (!error && data) {
            setServices(data.map((s: any) => ({
                ...s,
                documents: s.documents || [],
            })) as Service[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleEdit = (service: Service) => {
        setCurrentEditId(service.id);
        setTitle(service.title);
        setDescription(service.description || '');
        setPrice(service.price);
        setChannel(service.channel);
        setCategory(service.category);
        setIcon(service.icon || 'hub');
        setIsActive(service.is_active);
        setDocuments(service.documents || []);
        setPriceUsdc(service.price_usdc ?? '');
        setExpertAvatarUrl(service.expert_avatar_url || '');
        setExpertTags((service.expert_tags || []).join(', '));
        setParentId(service.parent_id || '');
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
        setDocuments([]);
        setPriceUsdc('');
        setExpertAvatarUrl('');
        setExpertTags('');
        setParentId('');
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
            sort_order: 0,
            documents,
            price_usdc: priceUsdc !== '' ? Number(priceUsdc) : null,
            expert_avatar_url: expertAvatarUrl || null,
            expert_tags: expertTags ? expertTags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
            parent_id: parentId || null,
        };

        try {
            const action = currentEditId ? `update-service:${currentEditId}` : 'create-service';
            await callAdmin('/api/admin/services', 'POST', action, {
                id: currentEditId,
                ...payload,
            });
        } catch (err: any) {
            console.error('Admin service save error:', err);
            alert(err.message || 'Failed to save service');
            return;
        }

        setIsEditing(false);
        fetchServices();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t.admin.serviceDeleteConfirm)) return;

        try {
            // Storage cleanup still uses client-side Supabase (public bucket, read-only risk is low)
            const service = services.find(s => s.id === id);
            if (service?.documents?.length) {
                const paths = service.documents.map(d => {
                    const url = new URL(d.url);
                    const match = url.pathname.match(/\/service-docs\/(.+)/);
                    return match ? match[1] : '';
                }).filter(Boolean);
                if (paths.length > 0) {
                    await supabase.storage.from('service-docs').remove(paths);
                }
            }

            // Server-side delete with signature + NFT verification
            await callAdmin('/api/admin/services', 'DELETE', `delete-service:${id}`, { id });
        } catch (err: any) {
            console.error('Admin service delete error:', err);
            alert(err.message || 'Failed to delete service');
            return;
        }
        fetchServices();
    };

    // ── Document management ──

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = `${currentEditId || 'new'}/${timestamp}_${safeName}`;

            const { error } = await supabase.storage
                .from('service-docs')
                .upload(filePath, file, { upsert: false });

            if (error) {
                console.error('Upload error:', error);
                setUploading(false);
                return;
            }

            const { data: urlData } = supabase.storage
                .from('service-docs')
                .getPublicUrl(filePath);

            setDocuments(prev => [...prev, {
                name: file.name,
                url: urlData.publicUrl,
                size: formatFileSize(file.size),
            }]);
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDocDelete = async (index: number) => {
        if (!window.confirm(t.admin.serviceDocDeleteConfirm)) return;

        const doc = documents[index];
        // Try to delete from storage
        try {
            const url = new URL(doc.url);
            const match = url.pathname.match(/\/service-docs\/(.+)/);
            if (match) {
                await supabase.storage.from('service-docs').remove([decodeURIComponent(match[1])]);
            }
        } catch { /* ignore storage delete errors */ }

        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    // ── Render: Editing ──

    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {currentEditId ? t.admin.serviceEdit : t.admin.serviceCreate}
                    </h1>
                    <Button variant="outline" onClick={handleCancel}>{t.common.cancel}</Button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.admin.serviceFormTitle}</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.admin.serviceFormPrice}</label>
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
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.admin.serviceFormChannel}</label>
                            <select
                                value={channel}
                                onChange={(e) => setChannel(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value={1}>{t.admin.channelFilterInfra}</option>
                                <option value={2}>{t.admin.channelFilterCore}</option>
                                <option value={3}>{t.admin.channelFilterConsulting}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.admin.serviceFormCategory}</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.admin.serviceFormIcon}</label>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Parent ID (for child items in channel 2/3) */}
                    {(channel === 2 || channel === 3) && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                {t.admin.parentIdLabel}
                            </label>
                            <select
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="">{t.admin.parentIdNone}</option>
                                {services.filter(s => s.channel === channel && !s.parent_id).map(s => (
                                    <option key={s.id} value={s.id}>{s.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Channel 1: price_usdc */}
                    {channel === 1 && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                {t.admin.priceUsdcLabel}
                            </label>
                            <input
                                type="number"
                                value={priceUsdc}
                                onChange={(e) => setPriceUsdc(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder={t.admin.priceUsdcPlaceholder}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Channel 3: expert fields */}
                    {channel === 3 && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {t.admin.expertAvatarLabel}
                                </label>
                                <input
                                    type="text"
                                    value={expertAvatarUrl}
                                    onChange={(e) => setExpertAvatarUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {t.admin.expertTagsLabel}
                                </label>
                                <input
                                    type="text"
                                    value={expertTags}
                                    onChange={(e) => setExpertTags(e.target.value)}
                                    placeholder={t.admin.expertTagsPlaceholder}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t.admin.serviceFormDescription}</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    {/* Document attachments */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            {t.admin.serviceDocuments}
                        </label>

                        {documents.length === 0 ? (
                            <p className="text-sm text-slate-400 mb-3">{t.admin.serviceDocEmpty}</p>
                        ) : (
                            <ul className="space-y-2 mb-3">
                                {documents.map((doc, idx) => (
                                    <li key={idx} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <span className="material-symbols-outlined text-primary !text-[20px]">description</span>
                                        <div className="flex-1 min-w-0">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-primary truncate block"
                                            >
                                                {doc.name}
                                            </a>
                                            <span className="text-xs text-slate-400">{doc.size}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDocDelete(idx)}
                                            className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined !text-[16px]">delete</span>
                                            {t.admin.serviceDocDelete}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleDocUpload}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.zip,.rar,.md,.txt,.xlsx,.csv,.pptx"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined !text-[18px]">
                                {uploading ? 'hourglass_top' : 'upload_file'}
                            </span>
                            {uploading ? t.admin.serviceDocUploading : t.admin.serviceDocUpload}
                        </Button>
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
                            {t.admin.serviceFormActive}
                        </label>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white px-8">
                            {t.admin.serviceSave}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Render: List ──

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t.admin.serviceTitle}</h1>
                <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    {t.admin.serviceCreate}
                </Button>
            </div>

            {/* Channel filter */}
            <div className="flex gap-2">
                {[
                    { value: 0, label: t.admin.channelFilterAll },
                    { value: 1, label: t.admin.channelFilterInfra },
                    { value: 2, label: t.admin.channelFilterCore },
                    { value: 3, label: t.admin.channelFilterConsulting },
                ].map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setChannelFilter(opt.value)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded-lg transition-colors ${
                            channelFilter === opt.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/40'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">{t.admin.serviceLoading}</div>
                ) : services.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">{t.admin.serviceEmpty}</div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {services.filter(s => channelFilter === 0 || s.channel === channelFilter).map((service) => (
                            <li key={service.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">{service.icon || 'hub'}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {service.title}
                                            {!service.is_active && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500">{t.admin.serviceDraft}</span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1 flex gap-4 flex-wrap">
                                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                                service.channel === 1 ? 'bg-blue-500/10 text-blue-500' :
                                                service.channel === 2 ? 'bg-emerald-500/10 text-emerald-500' :
                                                'bg-purple-500/10 text-purple-500'
                                            }`}>
                                                CH{service.channel}
                                            </span>
                                            <span className="font-mono">{service.price} USDC</span>
                                            {service.parent_id && <span className="text-xs text-slate-400">{t.admin.childItem}</span>}
                                            {service.documents?.length > 0 && (
                                                <span className="flex items-center gap-1 text-primary">
                                                    <span className="material-symbols-outlined !text-[14px]">attach_file</span>
                                                    {service.documents.length}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                                        {t.common.edit}
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(service.id)}>
                                        {t.common.delete}
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
