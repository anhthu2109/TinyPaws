import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // Hiển thị loading spinner khi đang tải thông tin user
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#ff5252] mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Đang tải...</p>
                    <p className="text-gray-500 text-sm mt-2">Vui lòng chờ trong giây lát</p>
                </div>
            </div>
        );
    }

    // Kiểm tra xem user có đăng nhập không
    if (!user) {
        // Redirect đến trang đăng nhập nếu chưa đăng nhập
        return <Navigate to="/dang-nhap" replace />;
    }

    // Nếu user đã đăng nhập, hiển thị component con
    return children;
};

export default ProtectedRoute;
