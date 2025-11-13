import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRedirect = ({ children }) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Reset redirect flag khi user thay đổi
        hasRedirected.current = false;
    }, [user?.id]);

    useEffect(() => {
        // Chỉ redirect một lần khi admin đăng nhập và đang ở trang không phải admin
        if (!loading && user?.role === 'admin' && !hasRedirected.current) {
            const currentPath = location.pathname;
            
            // Nếu đang ở trang chủ hoặc trang public, redirect đến admin dashboard
            if (currentPath === '/' || 
                (!currentPath.startsWith('/admin') && 
                 !currentPath.startsWith('/dang-nhap') && 
                 !currentPath.startsWith('/dang-ky'))) {
                hasRedirected.current = true;
                navigate('/admin/dashboard', { replace: true });
            }
        }
    }, [user, loading, navigate, location.pathname]);

    return children;
};

export default AdminRedirect;
