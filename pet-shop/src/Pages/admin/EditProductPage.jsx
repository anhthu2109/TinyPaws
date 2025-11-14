import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import ProductForm from '../../components/admin/ProductForm';
import adminApi from '../../api/adminApi';
import { CONFIG } from '../../constants/config';

const EditProductPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { token, isAdmin } = useAuth();
    
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch product data
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id || !token || !isAdmin) return;
            
            setFetchLoading(true);
            try {
                const response = await adminApi.get(`${CONFIG.API.BASE_URL}/products/${id}`);
                if (response.data.success) {
                    setProductData(response.data.data);
                } else {
                    setError('Không thể tải dữ liệu sản phẩm');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                setError('Không thể tải dữ liệu sản phẩm');
            } finally {
                setFetchLoading(false);
            }
        };

        fetchProduct();
    }, [id, token, isAdmin]);

    // Xử lý submit form
    const handleSubmit = async (formData) => {
        setLoading(true);
        
        try {
            console.log('Submitting product data:', formData);
            
            // Validate dữ liệu trước khi gửi
            if (!formData.name || !formData.category || !formData.price) {
                throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
            }

            // Chuẩn bị dữ liệu để gửi - đảm bảo format đúng
            const processedImages = (formData.images || []).map(img => {
                return typeof img === 'string' ? img : img.url;
            });

            const submitData = {
                name: formData.name,
                description: formData.description,
                category: productData.category?._id || formData.category,
                target: formData.target || 'ca-cho-va-meo',
                brand: formData.brand || null,
                price: parseInt(formData.price),
                sale_price: formData.sale_price ? parseInt(formData.sale_price) : null,
                stock_quantity: parseInt(formData.stock_quantity) || 0,
                images: processedImages,
                tags: formData.tags || [],
                is_active: formData.is_active !== undefined ? formData.is_active : true,
                is_featured: formData.is_featured !== undefined ? formData.is_featured : false
            };

            console.log('Processed submit data:', submitData);

            const response = await adminApi.put(`${CONFIG.API.BASE_URL}/products/${id}`, submitData);
            console.log('Update response:', response.data);

            if (response.data.success) {
                // Hiển thị thông báo thành công
                //alert('✅ Cập nhật sản phẩm thành công!');
                
                // Chuyển về trang danh sách sản phẩm
                navigate('/admin/products');
            } else {
                throw new Error(response.data.message || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            
            let errorMessage = 'Có lỗi xảy ra khi cập nhật sản phẩm';
            
            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || 'Dữ liệu không hợp lệ';
            } else if (error.response?.status === 404) {
                errorMessage = 'Không tìm thấy sản phẩm';
            } else if (error.response?.status === 500) {
                errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert('❌ ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Kiểm tra quyền truy cập
    if (!token || !isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-yellow-700 max-w-md text-center">
                    <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaArrowLeft className="text-yellow-600 text-xl" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Không có quyền truy cập</h2>
                    <p className="mb-6">Bạn cần đăng nhập với tài khoản admin để truy cập trang này.</p>
                    <button 
                        onClick={() => navigate('/admin/products')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Quay lại trang sản phẩm
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Đang tải dữ liệu sản phẩm...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-red-700 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-600 text-2xl">⚠</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Có lỗi xảy ra</h2>
                    <p className="mb-6">{error}</p>
                    <button 
                        onClick={() => navigate('/admin/products')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Quay lại trang sản phẩm
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <nav className="flex items-center space-x-2 text-sm text-gray-500">
                        <button 
                            onClick={() => navigate('/admin/products')}
                            className="hover:text-blue-600 transition-colors font-medium"
                        >
                            Sản phẩm
                        </button>
                        <span className="text-gray-400">›</span>
                        <span className="text-gray-900 font-medium">Chỉnh sửa sản phẩm</span>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <ProductForm
                    mode="edit"
                    initialData={productData}
                    onSubmit={handleSubmit}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default EditProductPage;
