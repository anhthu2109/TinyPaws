import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { CONFIG } from '../../constants/config';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'food',
        subcategories: []
    });

    const [subcategoryForm, setSubcategoryForm] = useState({
        name: '',
        target: 'both',
        description: ''
    });

    // Fetch categories
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${CONFIG.API.BASE_URL}/api/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const data = response.data.success ? response.data.data : response.data;
            setCategories(data);
        } catch (error) {
            console.error('Fetch categories error:', error);
            alert('Không thể tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            
            if (editingCategory) {
                // Update
                await axios.put(
                    `${CONFIG.API.BASE_URL}/api/categories/${editingCategory._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Cập nhật danh mục thành công!');
            } else {
                // Create
                await axios.post(
                    `${CONFIG.API.BASE_URL}/api/categories`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('Thêm danh mục thành công!');
            }
            
            fetchCategories();
            closeModal();
        } catch (error) {
            console.error('Submit error:', error);
            alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${CONFIG.API.BASE_URL}/api/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert('Xóa danh mục thành công!');
            fetchCategories();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Không thể xóa danh mục: ' + (error.response?.data?.message || error.message));
        }
    };

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                type: category.type,
                subcategories: category.subcategories || []
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                type: 'food',
                subcategories: []
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            type: 'food',
            subcategories: []
        });
        setSubcategoryForm({
            name: '',
            target: 'both',
            description: ''
        });
    };

    const addSubcategory = () => {
        if (!subcategoryForm.name.trim()) {
            alert('Vui lòng nhập tên danh mục con');
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            subcategories: [...prev.subcategories, { ...subcategoryForm }]
        }));
        
        setSubcategoryForm({
            name: '',
            target: 'both',
            description: ''
        });
    };

    const removeSubcategory = (index) => {
        setFormData(prev => ({
            ...prev,
            subcategories: prev.subcategories.filter((_, i) => i !== index)
        }));
    };

    const toggleExpand = (id) => {
        setExpandedCategories(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getTypeLabel = (type) => {
        const types = {
            food: 'Thức ăn',
            accessory: 'Phụ kiện',
            toy: 'Đồ chơi',
            hygiene: 'Vệ sinh & Làm đẹp'
        };
        return types[type] || type;
    };

    const getTargetLabel = (target) => {
        const targets = {
            dog: 'Chó',
            cat: 'Mèo',
            both: 'Cả hai'
        };
        return targets[target] || target;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-gray-600">Đang tải...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý danh mục</h1>
                    <p className="text-gray-600 mt-1">Quản lý danh mục sản phẩm trong cửa hàng</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Thêm danh mục
                </button>
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tên danh mục
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Loại
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Danh mục con
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mô tả
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories.map((category) => (
                                <tr key={category._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Tag size={18} className="text-blue-600" />
                                            <span className="font-medium text-gray-900">{category.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            {getTypeLabel(category.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">
                                                {category.subcategories?.length || 0} danh mục con
                                            </span>
                                            {category.subcategories?.length > 0 && (
                                                <button
                                                    onClick={() => toggleExpand(category._id)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    {expandedCategories[category._id] ? (
                                                        <ChevronUp size={16} />
                                                    ) : (
                                                        <ChevronDown size={16} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        {expandedCategories[category._id] && category.subcategories?.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {category.subcategories.map((sub, idx) => (
                                                    <div key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
                                                        • {sub.name} ({getTargetLabel(sub.target)})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">
                                            {category.description || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(category)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Category Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên danh mục *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="VD: Thức ăn, Phụ kiện..."
                                    required
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Loại danh mục *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="food">Thức ăn</option>
                                    <option value="accessory">Phụ kiện</option>
                                    <option value="toy">Đồ chơi</option>
                                    <option value="hygiene">Vệ sinh & Làm đẹp</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mô tả
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows="3"
                                    placeholder="Mô tả về danh mục..."
                                />
                            </div>

                            {/* Subcategories */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Danh mục con
                                </label>
                                
                                {/* Add Subcategory Form */}
                                <div className="bg-gray-50 p-4 rounded-lg mb-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                        <input
                                            type="text"
                                            value={subcategoryForm.name}
                                            onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Tên danh mục con"
                                        />
                                        <select
                                            value={subcategoryForm.target}
                                            onChange={(e) => setSubcategoryForm({ ...subcategoryForm, target: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="dog">Chó</option>
                                            <option value="cat">Mèo</option>
                                            <option value="both">Cả hai</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={addSubcategory}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Thêm
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={subcategoryForm.description}
                                        onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Mô tả danh mục con (tùy chọn)"
                                    />
                                </div>

                                {/* Subcategories List */}
                                {formData.subcategories.length > 0 && (
                                    <div className="space-y-2">
                                        {formData.subcategories.map((sub, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                                <div>
                                                    <span className="font-medium text-gray-900">{sub.name}</span>
                                                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                        {getTargetLabel(sub.target)}
                                                    </span>
                                                    {sub.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{sub.description}</p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubcategory(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
