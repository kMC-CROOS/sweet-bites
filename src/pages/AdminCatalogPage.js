import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:8000/api';

const AdminCatalogPage = () => {
    const { isAuthenticated, user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'cakes';
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        setSearchParams({ tab: activeTab });
    }, [activeTab, setSearchParams]);

    if (!isAuthenticated || !user || user.user_type !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Unauthorized</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Catalog Management</h1>
                            <p className="text-gray-600">Manage cakes, categories, and offers</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <nav className="flex space-x-8">
                            {[
                                { id: 'cakes', name: 'Cakes' },
                                { id: 'categories', name: 'Categories' },
                                { id: 'offers', name: 'Offers' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'cakes' && <CakesCrud />}

                        {activeTab === 'categories' && <CategoriesCrud />}

                        {activeTab === 'offers' && <OffersCrud />}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CakesCrud = () => {
    const { isAuthenticated, user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);

    const emptyForm = {
        name: '',
        description: '',
        price: '',
        category: '',
        is_available: true,
        is_customizable: true,
        preparation_time: '2-3 hours',
        ingredients: [],
        allergens: [],
        image: null,
        existingImage: null
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('token');
                // Load cakes (admin list)
                const res = await fetch(`${API_BASE}/admin/cakes/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                if (!res.ok) throw new Error(`Load cakes failed: ${res.status}`);
                const data = await res.json();
                setItems(Array.isArray(data) ? data : (data.results || []));

                // Load categories
                const catRes = await fetch(`${API_BASE}/categories/`);
                const catData = await catRes.json();
                setCategories(Array.isArray(catData) ? catData : (catData.results || []));
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const openCreate = () => {
        setEditingItem(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setForm({
            name: item.name || '',
            description: item.description || '',
            price: item.price || '',
            category: item.category?.id || item.category || '',
            is_available: item.is_available,
            is_customizable: item.is_customizable,
            preparation_time: item.preparation_time || '2-3 hours',
            ingredients: item.ingredients || [],
            allergens: item.allergens || [],
            image: null, // Will be handled separately to preserve existing image
            existingImage: item.image // Store existing image URL
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this cake?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/admin/cakes/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
            setItems((prev) => prev.filter((x) => x.id !== id));
        } catch (e) {
            alert(e.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const token = localStorage.getItem('token');

            // Handle image for editing vs creating
            if (editingItem && !form.image) {
                // For editing without new image, use JSON payload
                const payload = {
                    name: form.name,
                    description: form.description,
                    price: form.price,
                    category: form.category,
                    is_available: form.is_available,
                    is_customizable: form.is_customizable,
                    preparation_time: form.preparation_time,
                    ingredients: form.ingredients || [],
                    allergens: form.allergens || []
                };

                const res = await fetch(`${API_BASE}/admin/cakes/${editingItem.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(`Save failed: ${res.status} ${JSON.stringify(errorData)}`);
                }

                // Refresh the data
                const listRes = await fetch(`${API_BASE}/admin/cakes/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                const list = await listRes.json();
                setItems(Array.isArray(list) ? list : (list.results || []));
                setShowForm(false);
                setEditingItem(null);
                setForm(emptyForm);
                return;
            } else {
                // For creating new items or editing with new image, use FormData
                const fd = new FormData();
                fd.append('name', form.name);
                fd.append('description', form.description);
                fd.append('price', form.price);
                fd.append('category', form.category);
                fd.append('is_available', form.is_available);
                fd.append('is_customizable', form.is_customizable);
                fd.append('preparation_time', form.preparation_time);
                fd.append('ingredients', JSON.stringify(form.ingredients || []));
                fd.append('allergens', JSON.stringify(form.allergens || []));

                if (form.image) {
                    fd.append('image', form.image);
                }

                const method = editingItem ? 'PATCH' : 'POST';
                const url = editingItem
                    ? `${API_BASE}/admin/cakes/${editingItem.id}/`
                    : `${API_BASE}/admin/cakes/`;
                const res = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': `Token ${token}`
                    },
                    body: fd
                });

                if (!res.ok) {
                    const txt = await res.text();
                    throw new Error(`Save failed: ${res.status} ${txt}`);
                }

                // Refresh the data
                const listRes = await fetch(`${API_BASE}/admin/cakes/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                const list = await listRes.json();
                setItems(Array.isArray(list) ? list : (list.results || []));
                setShowForm(false);
                setEditingItem(null);
                setForm(emptyForm);
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isAuthenticated || !user || user.user_type !== 'admin') {
        return null;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Cakes</h3>
                <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Add Cake
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>
            )}

            {loading ? (
                <div className="py-12 text-center text-gray-600">Loading...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr className="bg-gray-50 text-left text-sm">
                                <th className="p-3 border-b">Image</th>
                                <th className="p-3 border-b">Name</th>
                                <th className="p-3 border-b">Description</th>
                                <th className="p-3 border-b">Category</th>
                                <th className="p-3 border-b">Price</th>
                                <th className="p-3 border-b">Available</th>
                                <th className="p-3 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(items || []).map((item) => (
                                <tr key={item.id} className="text-sm hover:bg-gray-50">
                                    <td className="p-3 border-b">
                                        {item.image && (
                                            <img src={item.image.startsWith('/media/') ? `${API_BASE.replace('/api', '')}${item.image}` : item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                        )}
                                    </td>
                                    <td className="p-3 border-b font-medium">{item.name}</td>
                                    <td className="p-3 border-b max-w-xs truncate" title={item.description}>{item.description || '-'}</td>
                                    <td className="p-3 border-b">{item.category?.name || '-'}</td>
                                    <td className="p-3 border-b">RS {item.price}</td>
                                    <td className="p-3 border-b">{item.is_available ? 'Yes' : 'No'}</td>
                                    <td className="p-3 border-b space-x-2">
                                        <button onClick={() => openEdit(item)} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Edit</button>
                                        <button onClick={() => handleDelete(item.id)} className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h4 className="text-lg font-semibold">{editingItem ? 'Edit Cake' : 'Add Cake'}</h4>
                            <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Name</label>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Price (RS)</label>
                                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full border rounded px-3 py-2" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-600 mb-1">Description</label>
                                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Category</label>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="w-full border rounded px-3 py-2">
                                        <option value="" disabled>Choose category</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Preparation Time</label>
                                    <input value={form.preparation_time} onChange={(e) => setForm({ ...form, preparation_time: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Available</label>
                                    <select value={form.is_available ? '1' : '0'} onChange={(e) => setForm({ ...form, is_available: e.target.value === '1' })} className="w-full border rounded px-3 py-2">
                                        <option value="1">Yes</option>
                                        <option value="0">No</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Customizable</label>
                                    <select value={form.is_customizable ? '1' : '0'} onChange={(e) => setForm({ ...form, is_customizable: e.target.value === '1' })} className="w-full border rounded px-3 py-2">
                                        <option value="1">Yes</option>
                                        <option value="0">No</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-600 mb-1">Image</label>
                                    {form.existingImage && (
                                        <div className="mb-2">
                                            <p className="text-sm text-gray-500 mb-1">Current image:</p>
                                            <img
                                                src={form.existingImage.startsWith('/media/') ? `${API_BASE.replace('/api', '')}${form.existingImage}` : form.existingImage}
                                                alt="Current"
                                                className="w-20 h-20 object-cover rounded border"
                                            />
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} className="w-full" />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }} className="px-4 py-2 rounded border">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                                    {saving ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCatalogPage;

const CategoriesCrud = () => {
    const { isAuthenticated, user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);

    const emptyForm = {
        name: '',
        description: '',
        is_active: true
    };
    const [form, setForm] = useState(emptyForm);

    const load = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/admin/categories/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (!res.ok) throw new Error(`Load categories failed: ${res.status}`);
            const data = await res.json();
            setItems(Array.isArray(data) ? data : (data.results || []));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditingItem(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setForm({
            name: item.name || '',
            description: item.description || '',
            is_active: !!item.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/admin/categories/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.status !== 204) throw new Error(`Delete failed: ${res.status}`);
            setItems((prev) => prev.filter((x) => x.id !== id));
        } catch (e) {
            alert(e.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const payload = {
                name: form.name,
                description: form.description,
                is_active: form.is_active
            };
            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem
                ? `${API_BASE}/admin/categories/${editingItem.id}/`
                : `${API_BASE}/admin/categories/`;
            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Save failed: ${res.status} ${txt}`);
            }
            await load();
            setShowForm(false);
            setEditingItem(null);
            setForm(emptyForm);
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isAuthenticated || !user || user.user_type !== 'admin') {
        return null;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Categories</h3>
                <button onClick={openCreate} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    Add Category
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>
            )}

            {loading ? (
                <div className="py-12 text-center text-gray-600">Loading...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr className="bg-gray-50 text-left text-sm">
                                <th className="p-3 border-b">Name</th>
                                <th className="p-3 border-b">Description</th>
                                <th className="p-3 border-b">Active</th>
                                <th className="p-3 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(items || []).map((item) => (
                                <tr key={item.id} className="text-sm hover:bg-gray-50">
                                    <td className="p-3 border-b font-medium">{item.name}</td>
                                    <td className="p-3 border-b">{item.description || '-'}</td>
                                    <td className="p-3 border-b">{item.is_active ? 'Yes' : 'No'}</td>
                                    <td className="p-3 border-b">
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(item)} className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200">Edit</button>
                                            <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h4 className="text-lg font-semibold">{editingItem ? 'Edit Category' : 'Add Category'}</h4>
                            <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Name</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Active</label>
                                <select value={form.is_active ? '1' : '0'} onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })} className="w-full border rounded px-3 py-2">
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }} className="px-4 py-2 rounded border">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60">
                                    {saving ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};



const OffersCrud = () => {
    const { isAuthenticated, user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [saving, setSaving] = useState(false);

    const offerTypes = [
        { value: 'percentage', label: 'Percentage Discount' },
        { value: 'fixed', label: 'Fixed Amount Discount' },
        { value: 'free_shipping', label: 'Free Shipping' },
        { value: 'buy_one_get_one', label: 'Buy One Get One' }
    ];

    const statusChoices = [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' },
        { value: 'expired', label: 'Expired' },
        { value: 'paused', label: 'Paused' }
    ];

    const emptyForm = {
        title: '',
        description: '',
        offer_type: 'percentage',
        status: 'draft',
        discount_percentage: '',
        discount_amount: '',
        minimum_order_amount: '',
        start_date: '',
        end_date: '',
        homepage_featured: false,
        popup_display: false,
        background_color: '#FF6B6B',
        text_color: '#FFFFFF',
        max_usage_count: '',
        target_user_types: [],
        banner_image: null,
        existingBannerImage: null
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        loadOffers();
    }, []);

    const loadOffers = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/offers/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (!res.ok) throw new Error(`Load offers failed: ${res.status}`);
            const data = await res.json();
            setItems(data.results || data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setForm(emptyForm);
        setEditingItem(null);
        setShowForm(true);
    };

    const openEdit = (item) => {
        setForm({
            ...item,
            start_date: item.start_date ? item.start_date.split('T')[0] : '',
            end_date: item.end_date ? item.end_date.split('T')[0] : '',
            target_user_types: item.target_user_types || [],
            banner_image: null, // Will be handled separately to preserve existing image
            existingBannerImage: item.banner_image // Store existing banner image URL
        });
        setEditingItem(item);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this offer?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/offers/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${token}` }
            });
            if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
            loadOffers();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError('');
            const token = localStorage.getItem('token');
            const formData = new FormData();

            // Add all form fields
            Object.keys(form).forEach(key => {
                if (key === 'banner_image' && form[key]) {
                    formData.append(key, form[key]);
                } else if (key === 'target_user_types' && Array.isArray(form[key])) {
                    form[key].forEach(type => formData.append(key, type));
                } else if (form[key] !== null && form[key] !== '') {
                    formData.append(key, form[key]);
                }
            });

            // Add created_by for new offers
            if (!editingItem) {
                formData.append('created_by', user.id);
            }

            const url = editingItem ? `${API_BASE}/offers/${editingItem.id}/` : `${API_BASE}/offers/`;
            const method = editingItem ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Token ${token}` },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`Save failed: ${res.status} ${JSON.stringify(errorData)}`);
            }

            setShowForm(false);
            setEditingItem(null);
            loadOffers();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'draft': return 'bg-gray-100 text-gray-800';
            case 'expired': return 'bg-red-100 text-red-800';
            case 'paused': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="py-12 text-center text-gray-600">Loading...</div>;
    if (error) return <div className="py-12 text-center text-red-600">Error: {error}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Offers Management</h2>
                <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                    Add Offer
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {(items || []).map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {offerTypes.find(t => t.value === item.offer_type)?.label || item.offer_type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.offer_type === 'percentage'
                                        ? `${item.discount_percentage}%`
                                        : item.offer_type === 'fixed'
                                            ? `Rs. ${item.discount_amount}`
                                            : item.offer_type
                                    }
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'No expiry'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex space-x-2">
                                        {item.homepage_featured && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Homepage</span>}
                                        {item.popup_display && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Popup</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold">{editingItem ? 'Edit Offer' : 'Create Offer'}</h3>
                            <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Title *</label>
                                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Offer Type *</label>
                                    <select value={form.offer_type} onChange={(e) => setForm({ ...form, offer_type: e.target.value })} required className="w-full border rounded px-3 py-2">
                                        {offerTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Description</label>
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border rounded px-3 py-2" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Status *</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required className="w-full border rounded px-3 py-2">
                                        {statusChoices.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Minimum Order Amount</label>
                                    <input type="number" value={form.minimum_order_amount} onChange={(e) => setForm({ ...form, minimum_order_amount: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                            </div>

                            {form.offer_type === 'percentage' && (
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Discount Percentage *</label>
                                    <input type="number" min="0" max="100" value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })} required className="w-full border rounded px-3 py-2" />
                                </div>
                            )}

                            {form.offer_type === 'fixed' && (
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Discount Amount (Rs.) *</label>
                                    <input type="number" min="0" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} required className="w-full border rounded px-3 py-2" />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                                    <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">End Date</label>
                                    <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Background Color</label>
                                    <input type="color" value={form.background_color} onChange={(e) => setForm({ ...form, background_color: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Text Color</label>
                                    <input type="color" value={form.text_color} onChange={(e) => setForm({ ...form, text_color: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Max Usage Count</label>
                                    <input type="number" min="0" value={form.max_usage_count} onChange={(e) => setForm({ ...form, max_usage_count: e.target.value })} className="w-full border rounded px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Banner Image</label>
                                    {form.existingBannerImage && (
                                        <div className="mb-2">
                                            <p className="text-sm text-gray-500 mb-1">Current banner image:</p>
                                            <img
                                                src={form.existingBannerImage.startsWith('/media/') ? `${API_BASE.replace('/api', '')}${form.existingBannerImage}` : form.existingBannerImage}
                                                alt="Current banner"
                                                className="w-32 h-16 object-cover rounded border"
                                            />
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, banner_image: e.target.files[0] })} className="w-full border rounded px-3 py-2" />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep current image</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm text-gray-600 mb-1">Display Options</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={form.homepage_featured} onChange={(e) => setForm({ ...form, homepage_featured: e.target.checked })} className="mr-2" />
                                        Homepage Featured
                                    </label>
                                    <label className="flex items-center">
                                        <input type="checkbox" checked={form.popup_display} onChange={(e) => setForm({ ...form, popup_display: e.target.checked })} className="mr-2" />
                                        Popup Display
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }} className="px-4 py-2 rounded border">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60">
                                    {saving ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

