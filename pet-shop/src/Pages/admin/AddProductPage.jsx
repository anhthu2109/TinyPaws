import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import ProductForm from '../../components/admin/ProductForm';
import adminApi from '../../api/adminApi';

const AddProductPage = () => {
    const navigate = useNavigate();
    const { token, isAdmin } = useAuth();
    const [loading, setLoading] = useState(false);

    // Xử lý submit form
    const handleSubmit = async (formData) => {
        setLoading(true);
        
        try {          
            const response = await adminApi.post('/products', formData);
            if (response.data.success) {
                // Hiển thị thông báo thành công
                //alert('✅ Thêm sản phẩm thành công!');
                
                // Chuyển về trang danh sách sản phẩm
                navigate('/admin/products');
            } else {
                throw new Error(response.data.message || 'Thêm sản phẩm thất bại');
            }
        } catch (error) {
            console.error('❌ Error adding product:', error);
            console.error('📋 Error details:', error.response?.data);
            
            let errorMessage = 'Có lỗi xảy ra khi thêm sản phẩm';
            
            if (error.response?.data?.errors) {
                // Validation errors từ express-validator
                const validationErrors = error.response.data.errors;
                errorMessage = validationErrors.map(err => err.msg).join(', ');
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
                        <span className="text-gray-900 font-medium">Thêm sản phẩm mới</span>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-4">
                <ProductForm
                    mode="add"
                    onSubmit={handleSubmit}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default AddProductPage;
