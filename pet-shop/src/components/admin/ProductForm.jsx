import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTrash, FaImage, FaTags, FaEye, FaStar } from 'react-icons/fa';
import axios from 'axios';
import { CONFIG } from '../../constants/config';

const ProductForm = ({ 
    mode = 'add', // 'add' hoặc 'edit'
    initialData = null,
    onSubmit,
    loading = false 
}) => {
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        sale_price: '',
        stock_quantity: '',
        category: '',
        brand: '',
        tags: [],
        images: [],
        is_active: true,
        is_featured: false
    });

    // UI states - 2 cấp dropdown
    const [primaryCategories] = useState([
        { id: 'thuc-an', name: 'Thức ăn' },
        { id: 'phu-kien', name: 'Phụ kiện' },
        { id: 'san-pham-ve-sinh', name: 'Vệ sinh & Làm đẹp' },
        { id: 'do-choi', name: 'Đồ chơi' }
    ]);
    
    const [targetAnimals] = useState([
        { id: 'cho', name: 'Chó' },
        { id: 'meo', name: 'Mèo' },
        { id: 'ca-cho-va-meo', name: 'Cả chó và mèo' }
    ]);

    const [brandOptions] = useState({
        cho: ['DoggyMan', 'Goodies', 'Orgo', 'SmartHeart', 'Ganador', 'Pawise', 'Natural Core', 'ANF', 'Zenith'],
        meo: ['PetQ', 'Me-O', 'Royal Canin', 'Whiskas'],
        'ca-cho-va-meo': ['DoggyMan', 'Goodies', 'Orgo', 'SmartHeart', 'Ganador', 'Pawise', 'Natural Core', 'ANF', 'Zenith', 'PetQ', 'Me-O', 'Royal Canin', 'Whiskas'],
        'san-pham-ve-sinh': ['Yu', 'SOS', 'Absorb Plus', 'Natural Core', 'Alkin', 'Dorrikey']
    });

    // Category selection states
    const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState('');
    const [selectedTargetAnimal, setSelectedTargetAnimal] = useState('');
    const [newTag, setNewTag] = useState('');
    const [errors, setErrors] = useState({});
    const [showPreview, setShowPreview] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0); // Thêm state cho ảnh chính
    const [thumbnailImage, setThumbnailImage] = useState(null); // Ảnh thumbnail chính
    const [galleryImages, setGalleryImages] = useState([]); // Các ảnh khác
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false); // Loading state cho thumbnail
    const [uploadingGallery, setUploadingGallery] = useState(false); // Loading state cho gallery
    const fileInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);

    // Combine category function
    const combineCategory = (primary, target) => {
        if (!primary || !target) return '';
        
        const primaryName = primaryCategories.find(cat => cat.id === primary)?.name || '';
        const targetName = targetAnimals.find(animal => animal.id === target)?.name || '';
        
        // Xử lý trường hợp đặc biệt cho "cả chó và mèo"
        if (target === 'ca-cho-va-meo') {
            return `${primaryName} cho chó và mèo`;
        }
        
        return `${primaryName} cho ${targetName.toLowerCase()}`;
    };

    // Parse existing category for edit mode
    const parseCategoryForEdit = (categoryString) => {
        if (!categoryString) return { primary: '', target: '' };
        
        // Map existing categories to new structure
        const categoryMap = {
            'Thức ăn cho chó': { primary: 'thuc-an', target: 'cho' },
            'Thức ăn cho mèo': { primary: 'thuc-an', target: 'meo' },
            'Thức ăn cho chó và mèo': { primary: 'thuc-an', target: 'ca-cho-va-meo' },
            'Phụ kiện': { primary: 'phu-kien', target: '' },
            'Phụ kiện cho chó': { primary: 'phu-kien', target: 'cho' },
            'Phụ kiện cho mèo': { primary: 'phu-kien', target: 'meo' },
            'Phụ kiện cho chó và mèo': { primary: 'phu-kien', target: 'ca-cho-va-meo' },
            'Vệ sinh & Làm đẹp': { primary: 'san-pham-ve-sinh', target: '' },
            'Sản phẩm vệ sinh': { primary: 'san-pham-ve-sinh', target: '' },
            'Sản phẩm vệ sinh cho chó': { primary: 'san-pham-ve-sinh', target: 'cho' },
            'Sản phẩm vệ sinh cho mèo': { primary: 'san-pham-ve-sinh', target: 'meo' },
            'Sản phẩm vệ sinh cho chó và mèo': { primary: 'san-pham-ve-sinh', target: 'ca-cho-va-meo' },
            'Đồ chơi': { primary: 'do-choi', target: '' },
            'Đồ chơi cho chó': { primary: 'do-choi', target: 'cho' },
            'Đồ chơi cho mèo': { primary: 'do-choi', target: 'meo' },
            'Đồ chơi cho chó và mèo': { primary: 'do-choi', target: 'ca-cho-va-meo' }
        };
        
        return categoryMap[categoryString] || { primary: '', target: '' };
    };

    // Handle category changes
    const handlePrimaryChange = (value) => {
        setSelectedPrimaryCategory(value);
        setSelectedTargetAnimal(''); // Reset target when primary changes
        
        // Set category to just the primary category ID/name
        const primaryName = primaryCategories.find(cat => cat.id === value)?.name || '';
        setFormData(prev => ({ ...prev, category: primaryName }));
        
        if (errors.category) {
            setErrors(prev => ({ ...prev, category: '' }));
        }
    };

    const handleTargetChange = (value) => {
        console.log('🎯 Target changed to:', value);
        setSelectedTargetAnimal(value);
        
        // Keep category as primary only, store target separately
        setFormData(prev => {
            const updated = { ...prev, target: value };
            console.log('📝 Updated formData:', updated);
            return updated;
        });
        
        if (errors.category) {
            setErrors(prev => ({ ...prev, category: '' }));
        }
    };

    // Khởi tạo dữ liệu khi edit
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            // Xử lý images - chuyển string thành object format
            const processedImages = (initialData.images || []).map(img => {
                if (typeof img === 'string') {
                    return {
                        url: img,
                        name: 'Existing Image',
                        type: 'url'
                    };
                }
                return img;
            });

            // Parse category for edit mode
            const categoryString = initialData.category?.name || initialData.category || '';
            
            // Map category name to ID
            const categoryToId = {
                'Thức ăn': 'thuc-an',
                'Phụ kiện': 'phu-kien',
                'Vệ sinh & Làm đẹp': 'san-pham-ve-sinh',
                'Sản phẩm vệ sinh': 'san-pham-ve-sinh',
                'Đồ chơi': 'do-choi'
            };
            
            // Map target from backend to frontend format
            const targetMap = {
                'dog': 'cho',
                'cat': 'meo',
                'both': 'ca-cho-va-meo'
            };
            
            const parsedCategory = {
                primary: categoryToId[categoryString] || '',
                target: targetMap[initialData.target] || initialData.target || 'ca-cho-va-meo'
            };
            
            // Tách thumbnail và gallery images
            const thumb = processedImages.length > 0 ? processedImages[0] : null;
            const gallery = processedImages.slice(1);
            
            setThumbnailImage(thumb);
            setGalleryImages(gallery);
            
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                price: initialData.price || '',
                sale_price: initialData.sale_price || '',
                stock_quantity: initialData.stock_quantity || '',
                category: categoryString,
                target: initialData.target || parsedCategory.target || 'ca-cho-va-meo',
                brand: initialData.brand || '',
                tags: initialData.tags || [],
                images: processedImages,
                is_active: initialData.is_active !== undefined ? initialData.is_active : true,
                is_featured: initialData.is_featured !== undefined ? initialData.is_featured : false
            });

            // Set dropdown states for edit mode
            setSelectedPrimaryCategory(parsedCategory.primary);
            setSelectedTargetAnimal(parsedCategory.target);
        }
    }, [mode, initialData]);

    // Xử lý thay đổi input
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Xóa lỗi khi người dùng nhập lại
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Upload thumbnail lên Cloudinary
    const handleThumbnailUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadingThumbnail(true);
        try {
            // Chuẩn bị dữ liệu gửi API backend
            const formDataUpload = new FormData();
            formDataUpload.append("image", file);

            const res = await axios.post(
                `${CONFIG.API.BASE_URL}/api/upload`,
                formDataUpload,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (res.data.success) {
                const imageData = {
                    url: res.data.url,
                    name: file.name,
                    type: "url",
                };
                setThumbnailImage(imageData);
                updateFormImages(imageData, galleryImages);
                console.log("✅ Thumbnail uploaded:", res.data.url);
            } else {
                alert("❌ Upload thất bại: " + res.data.message);
            }
        } catch (error) {
            console.error("Upload thumbnail error:", error);
            alert("Lỗi khi upload ảnh thumbnail. Vui lòng thử lại.");
        } finally {
            setUploadingThumbnail(false);
        }

        event.target.value = "";
    };


    // Upload gallery images lên Cloudinary
    const handleGalleryUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        if (galleryImages.length + files.length > 10) {
            alert("Tối đa 10 ảnh gallery");
            return;
        }

        setUploadingGallery(true);
        for (const file of files) {
            try {
                const formDataUpload = new FormData();
                formDataUpload.append("image", file);

                const res = await axios.post(
                    `${CONFIG.API.BASE_URL}/api/upload`,
                    formDataUpload,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                );

                if (res.data.success) {
                    const imageData = {
                        url: res.data.url,
                        name: file.name,
                        type: "url",
                    };

                    setGalleryImages((prev) => {
                        const newGallery = [...prev, imageData];
                        updateFormImages(thumbnailImage, newGallery);
                        return newGallery;
                    });

                    console.log("✅ Gallery image uploaded:", res.data.url);
                } else {
                    alert("❌ Upload thất bại: " + res.data.message);
                }
            } catch (error) {
                console.error("Upload gallery error:", error);
                alert(`Lỗi upload ảnh ${file.name}`);
            }
        }
        setUploadingGallery(false);
        event.target.value = "";
    };


    // Cập nhật formData.images từ thumbnail và gallery
    const updateFormImages = (thumb, gallery) => {
        const allImages = [];
        if (thumb) allImages.push(thumb);
        allImages.push(...gallery);
        
        setFormData(prev => ({
            ...prev,
            images: allImages
        }));
    };


    // Xóa thumbnail
    const handleRemoveThumbnail = () => {
        setThumbnailImage(null);
        updateFormImages(null, galleryImages);
    };

    // Xóa gallery image
    const handleRemoveGalleryImage = (index) => {
        const newGallery = galleryImages.filter((_, i) => i !== index);
        setGalleryImages(newGallery);
        updateFormImages(thumbnailImage, newGallery);
    };

    // Thêm tag
    const handleAddTag = () => {
        if (!newTag.trim()) return;
        
        if (formData.tags.includes(newTag.trim())) {
            alert('Tag này đã tồn tại');
            return;
        }

        setFormData(prev => ({
            ...prev,
            tags: [...prev.tags, newTag.trim()]
        }));
        setNewTag('');
    };

    // Xóa tag
    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };


    // Validation
    const validateForm = () => {
        const newErrors = {};

        // Tên sản phẩm
        if (!formData.name || !formData.name.trim()) {
            newErrors.name = 'Tên sản phẩm là bắt buộc';
        }

        // Mô tả
        if (!formData.description || !formData.description.trim()) {
            newErrors.description = 'Mô tả sản phẩm là bắt buộc';
        }

        // Danh mục
        if (!formData.category || !formData.category.trim()) {
            newErrors.category = 'Vui lòng chọn danh mục';
        }

        // Giá gốc
        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Giá gốc phải lớn hơn 0';
        }

        // Giá khuyến mãi
        if (formData.sale_price && parseFloat(formData.sale_price) >= parseFloat(formData.price)) {
            newErrors.sale_price = 'Giá khuyến mãi phải nhỏ hơn giá gốc';
        }

        // Số lượng kho
        if (formData.stock_quantity === '' || parseInt(formData.stock_quantity) < 0) {
            newErrors.stock_quantity = 'Số lượng kho phải lớn hơn hoặc bằng 0';
        }

        // Hình ảnh - yêu cầu ít nhất thumbnail
        if (!thumbnailImage) {
            newErrors.images = 'Vui lòng thêm ảnh thumbnail';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = (e) => {
        e.preventDefault();
        
        console.log('🚀 Form submitted with data:', formData);
        console.log('💰 Price value:', formData.price, 'Type:', typeof formData.price);
        console.log('🖼️ Images:', formData.images);
        console.log('🎯 Target value:', formData.target);
        
        if (!validateForm()) {
            console.log('❌ Validation failed:', errors);
            return;
        }

        // Chuẩn bị dữ liệu submit - chuyển images về dạng URL string
        const processedImages = formData.images.map(img => {
            return typeof img === 'string' ? img : img.url;
        });

        // Đảm bảo dữ liệu đúng format
        const submitData = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            category: formData.category.trim(),
            target: formData.target || 'ca-cho-va-meo',
            brand: formData.brand ? formData.brand.trim() : null,
            tags: formData.tags || [],
            images: processedImages,
            price: Math.round(parseFloat(formData.price)),
            sale_price: formData.sale_price ? Math.round(parseFloat(formData.sale_price)) : null,
            stock_quantity: parseInt(formData.stock_quantity) || 0,
            is_featured: formData.is_featured !== undefined ? formData.is_featured : false,
            is_active: formData.is_active !== undefined ? formData.is_active : true
        };

        console.log('✅ Submit data:', submitData);

        onSubmit(submitData);
    };

    // Preview Modal Component
    const PreviewModal = () => {
        if (!showPreview) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Xem trước sản phẩm</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold">{formData.name || 'Tên sản phẩm'}</h4>
                            <p className="text-sm text-gray-600">Danh mục: {formData.category || 'Chưa chọn'}</p>
                            <div className="flex gap-4">
                                <span className="text-xl font-bold text-blue-600">
                                    {formData.price ? `${parseInt(formData.price).toLocaleString()}đ` : '0đ'}
                                </span>
                                {formData.sale_price && (
                                    <span className="text-lg text-gray-500 line-through">
                                        {parseInt(formData.sale_price).toLocaleString()}đ
                                    </span>
                                )}
                            </div>
                            <p className="text-sm">Tồn kho: {formData.stock_quantity || 0}</p>
                            {formData.description && (
                                <div className="prose max-w-none">
                                    <p className="product-description text-gray-600">
                                        {formData.description}
                                    </p>
                                </div>
                            )}
                            {(thumbnailImage || galleryImages.length > 0) && (
                                <div className="space-y-3">
                                    {thumbnailImage && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Ảnh thumbnail:</p>
                                            <img 
                                                src={thumbnailImage.url}
                                                alt="Thumbnail preview"
                                                className="w-20 h-20 object-cover rounded-lg border"
                                            />
                                        </div>
                                    )}
                                    {galleryImages.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Gallery ({galleryImages.length}):</p>
                                            <div className="grid grid-cols-4 gap-1">
                                                {galleryImages.slice(0, 4).map((img, index) => (
                                                    <img 
                                                        key={index}
                                                        src={img.url} 
                                                        alt={`Gallery ${index + 1}`}
                                                        className="w-full aspect-square object-cover rounded"
                                                    />
                                                ))}
                                            </div>
                                            {galleryImages.length > 4 && (
                                                <p className="text-xs text-gray-400 mt-1">+{galleryImages.length - 4} ảnh khác</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Layout 2 cột - 70% trái, 30% phải */}
                <div className="flex gap-6">
                    {/* Cột trái - Thông tin cơ bản (70%) */}
                    <div className="w-[70%] space-y-5">
                        {/* Card thông tin cơ bản */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                            
                            {/* Tên sản phẩm */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên sản phẩm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                        errors.name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập tên sản phẩm..."
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            {/* Danh mục - 2 cấp */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Danh mục <span className="text-red-500">*</span>
                                </label>
                                
                                {/* Cấp 1: Loại sản phẩm chính */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Loại sản phẩm
                                        </label>
                                        <select
                                            value={selectedPrimaryCategory}
                                            onChange={(e) => handlePrimaryChange(e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${
                                                errors.category ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        >
                                            <option value="">Chọn loại sản phẩm</option>
                                            {primaryCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Cấp 2: Đối tượng */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Đối tượng
                                        </label>
                                        <select
                                            value={selectedTargetAnimal}
                                            onChange={(e) => handleTargetChange(e.target.value)}
                                            disabled={!selectedPrimaryCategory}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm ${
                                                errors.category ? 'border-red-300' : 'border-gray-300'
                                            } ${!selectedPrimaryCategory ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">Chọn đối tượng</option>
                                            {targetAnimals.map(animal => (
                                                <option key={animal.id} value={animal.id}>{animal.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Hiển thị danh mục đã chọn */}
                                {formData.category && (
                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            <span className="font-medium">Danh mục đã chọn:</span> {formData.category}
                                            {formData.target && ` (${targetAnimals.find(a => a.id === formData.target)?.name || formData.target})`}
                                        </p>
                                    </div>
                                )}

                                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                            </div>

                            {/* Brand */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Thương hiệu
                                </label>
                                <select
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleInputChange}
                                    disabled={!selectedTargetAnimal && selectedPrimaryCategory !== 'san-pham-ve-sinh'}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                        (!selectedTargetAnimal && selectedPrimaryCategory !== 'san-pham-ve-sinh') ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Chọn thương hiệu (tùy chọn)</option>
                                    {/* Brand cho thức ăn (theo đối tượng) */}
                                    {selectedTargetAnimal && brandOptions[selectedTargetAnimal]?.map(brand => (
                                        <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                    {/* Brand cho sản phẩm vệ sinh */}
                                    {selectedPrimaryCategory === 'san-pham-ve-sinh' && brandOptions['san-pham-ve-sinh']?.map(brand => (
                                        <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                </select>
                                {!selectedTargetAnimal && selectedPrimaryCategory !== 'san-pham-ve-sinh' && (
                                    <p className="text-xs text-gray-500 mt-1">Vui lòng chọn loại sản phẩm hoặc đối tượng trước</p>
                                )}
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mô tả sản phẩm
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={5}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                    placeholder="Nhập mô tả chi tiết về sản phẩm, tính năng, lợi ích..."
                                    style={{ height: '120px' }}
                                />
                            </div>
                        </div>

                        {/* Card Tags */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FaTags className="text-blue-500" />
                                Tags sản phẩm
                            </h3>
                            
                            {/* Thêm tag */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nhập tag mới..."
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                                >
                                    <FaPlus size={12} />
                                    Thêm
                                </button>
                            </div>

                            {/* Hiển thị tags */}
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cột phải - Giá bán & Tồn kho (30%) */}
                    <div className="w-[30%] space-y-5">
                        {/* Card giá bán */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Giá bán & Tồn kho</h3>
                            
                            {/* Giá gốc */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giá gốc (VNĐ) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                        errors.price ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    min="0"
                                />
                                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                            </div>

                            {/* Giá khuyến mãi */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giá khuyến mãi (VNĐ)
                                </label>
                                <input
                                    type="number"
                                    name="sale_price"
                                    value={formData.sale_price}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                        errors.sale_price ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    min="0"
                                />
                                {errors.sale_price && <p className="text-red-500 text-sm mt-1">{errors.sale_price}</p>}
                            </div>

                            {/* Số lượng tồn kho */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số lượng trong kho <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="stock_quantity"
                                    value={formData.stock_quantity}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                        errors.stock_quantity ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    min="0"
                                />
                                {errors.stock_quantity && <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>}
                            </div>
                        </div>

                        {/* Card trạng thái */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái & Cài đặt</h3>
                            
                            {/* Trạng thái hoạt động */}
                            <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Trạng thái hoạt động</label>
                                    <p className="text-xs text-gray-500">Hiển thị sản phẩm trên website</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {/* Sản phẩm nổi bật */}
                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <FaStar className="text-amber-500" />
                                        Sản phẩm nổi bật
                                    </label>
                                    <p className="text-xs text-gray-500">Hiển thị trong mục "Sản phẩm nổi bật" trang chủ</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_featured"
                                        checked={formData.is_featured}
                                        onChange={handleInputChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phần hình ảnh - chiếm toàn chiều rộng */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FaImage className="text-green-500" />
                        Hình ảnh sản phẩm
                        <span className="text-sm font-normal text-gray-500"></span>
                    </h3>
                    
                    {/* Ảnh thumbnail */}
                    <div className="space-y-4 mb-8">
                        <h4 className="text-md font-semibold text-gray-800">Ảnh thumbnail</h4>
                        <div className="flex gap-4">
                            {/* Thumbnail hiện tại */}
                            {thumbnailImage ? (
                                <div className="relative">
                                    <img
                                        src={thumbnailImage.url}
                                        alt="Thumbnail"
                                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                                        onError={(e) => {
                                            e.target.src = 'https://placehold.co/96x96?text=Error';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveThumbnail}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                    >
                                        <FaTrash size={10} />
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                                    onClick={() => thumbnailInputRef.current?.click()}
                                >
                                    <FaPlus className="text-gray-400 mb-1" size={16} />
                                    <span className="text-xs text-gray-500">Upload</span>
                                </div>
                            )}
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Những hình ảnh khác của sản phẩm */}
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold text-gray-800">Những hình ảnh khác của sản phẩm</h4>
                        <div className="flex flex-wrap gap-4">
                            {/* Gallery images */}
                            {galleryImages.map((image, index) => (
                                <div key={index} className="relative w-24">
                                    <img
                                        src={image.url}
                                        alt={`Gallery ${index + 1}`}
                                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                                        onError={(e) => {
                                            e.target.src = 'https://placehold.co/120x120?text=Error';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveGalleryImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                    >
                                        <FaTrash size={10} />
                                    </button>
                                </div>
                            ))}
                            
                            {/* Upload button */}
                            {galleryImages.length < 10 && (
                                <div 
                                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <FaPlus className="text-gray-400 mb-1" size={16} />
                                    <span className="text-xs text-gray-500">Upload</span>
                                </div>
                            )}
                            
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleGalleryUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {errors.images && <p className="text-red-500 text-sm mt-4">{errors.images}</p>}
                </div>

                {/* Action buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <FaEye />
                        Xem trước
                    </button>
                    
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-[#2563EB] text-white rounded-xl hover:bg-[#1d4ed8] transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    {mode === 'edit' ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Preview Modal */}
            <PreviewModal />
        </>
    );
};

export default ProductForm;
