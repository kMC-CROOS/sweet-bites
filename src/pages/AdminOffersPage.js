import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:8000/api';

const AdminOffersPage = () => {
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
        { value: 'free_delivery', label: 'Free Delivery' },
        { value: 'buy_one_get_one', label: 'Buy One Get One' },
        { value: 'special', label: 'Special Offer' }
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
        minimum_order_amount: '0',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        is_homepage_featured: true,
        is_popup: false,
        background_color: '#FF6B6B',
        text_color: '#FFFFFF',
        max_usage: '',
        target_user_types: [],
        banner_image: null
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
            setItems(Array.isArray(data) ? data : (data.results || []));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingItem(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setForm({
            title: item.title || '',
            description: item.description || '',
            offer_type: item.offer_type || 'percentage',
            status: item.status || 'draft',
            discount_percentage: item.discount_percentage || '',
            discount_amount: item.discount_amount || '',
            minimum_order_amount: item.minimum_order_amount || '0',
            start_date: item.start_date ? new Date(item.start_date).toISOString().slice(0, 16) : '',
            end_date: item.end_date ? new Date(item.end_date).toISOString().slice(0, 16) : '',
            is_homepage_featured: !!item.is_homepage_featured,
            is_popup: !!item.is_popup,
            background_color: item.background_color || '#FF6B6B',
            text_color: item.text_color || '#FFFFFF',
            max_usage: item.max_usage || '',
            target_user_types: item.target_user_types || [],
            banner_image: null
        });
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

            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('offer_type', form.offer_type);
            formData.append('status', form.status);
            formData.append('minimum_order_amount', form.minimum_order_amount);
            formData.append('start_date', form.start_date);
            formData.append('end_date', form.end_date);
            formData.append('is_homepage_featured', form.is_homepage_featured);
            formData.append('is_popup', form.is_popup);
            formData.append('background_color', form.background_color);
            formData.append('text_color', form.text_color);
            formData.append('target_user_types', JSON.stringify(form.target_user_types));

            // Add created_by field for new offers
            if (!editingItem) {
                formData.append('created_by', user.id);
            }

            if (form.discount_percentage) formData.append('discount_percentage', form.discount_percentage);
            if (form.discount_amount) formData.append('discount_amount', form.discount_amount);
            if (form.max_usage) formData.append('max_usage', form.max_usage);
            if (form.banner_image) formData.append('banner_image', form.banner_image);

            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem ? `${API_BASE}/offers/${editingItem.id}/` : `${API_BASE}/offers/`;

            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Token ${token}` },
                body: formData
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Save failed: ${res.status} ${txt}`);
            }

            await loadOffers();
            setShowForm(false);
            setEditingItem(null);
            setForm(emptyForm);
        } catch (err) {
            alert(err.message);
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
                            <h1 className="text-3xl font-bold text-gray-900">Offer Management</h1>
                            <p className="text-gray-600">Create, edit, and schedule offers and banners</p>
                        </div>
                        <button
                            onClick={openCreate}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Add Offer
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>
                )}

                {loading ? (
                    <div className="py-12 text-center text-gray-600">Loading...</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
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
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 max-w-xs truncate" title={item.description}>
                                                    {item.description || '-'}
                                                </div>
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
                                                {item.discount_display || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(item.end_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex space-x-2">
                                                    {item.is_homepage_featured && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Homepage</span>}
                                                    {item.is_popup && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Popup</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => openEdit(item)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="px-6 py-4 border-b flex items-center justify-between">
                                <h4 className="text-lg font-semibold">{editingItem ? 'Edit Offer' : 'Add Offer'}</h4>
                                <button
                                    onClick={() => { setShowForm(false); setEditingItem(null); }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                        <input
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            required
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Offer Type</label>
                                        <select
                                            value={form.offer_type}
                                            onChange={(e) => setForm({ ...form, offer_type: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {offerTypes.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {statusChoices.map(status => (
                                                <option key={status.value} value={status.value}>{status.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.minimum_order_amount}
                                            onChange={(e) => setForm({ ...form, minimum_order_amount: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {form.offer_type === 'percentage' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={form.discount_percentage}
                                                onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}

                                    {form.offer_type === 'fixed' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={form.discount_amount}
                                                onChange={(e) => setForm({ ...form, discount_amount: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                        <input
                                            type="datetime-local"
                                            value={form.start_date}
                                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                        <input
                                            type="datetime-local"
                                            value={form.end_date}
                                            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage (optional)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={form.max_usage}
                                            onChange={(e) => setForm({ ...form, max_usage: e.target.value })}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                                        <input
                                            type="color"
                                            value={form.background_color}
                                            onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                                            className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                                        <input
                                            type="color"
                                            value={form.text_color}
                                            onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                                            className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={3}
                                        required
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setForm({ ...form, banner_image: e.target.files?.[0] || null })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex items-center space-x-6">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={form.is_homepage_featured}
                                            onChange={(e) => setForm({ ...form, is_homepage_featured: e.target.checked })}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Show on Homepage</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={form.is_popup}
                                            onChange={(e) => setForm({ ...form, is_popup: e.target.checked })}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Show as Popup</span>
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); setEditingItem(null); }}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOffersPage;


