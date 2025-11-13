import { createContext, useContext, useState, useEffect } from 'react';
import { CONFIG } from '../constants/config';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const API_BASE_URL = CONFIG.API.BASE_URL;

    // Check if user is logged in on app start
    useEffect(() => {
        if (token) {
            getCurrentUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const getCurrentUser = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}${CONFIG.API.ENDPOINTS.ME}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.data.user);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Get current user error:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}${CONFIG.API.ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                const { user, token: userToken } = data.data;
                setUser(user);
                setToken(userToken);
                localStorage.setItem('token', userToken);
                return { success: true, user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Có lỗi xảy ra khi đăng nhập' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}${CONFIG.API.ENDPOINTS.REGISTER}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                const { user, token: userToken } = data.data;
                setUser(user);
                setToken(userToken);
                localStorage.setItem('token', userToken);
                return { success: true, user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Có lỗi xảy ra khi đăng ký' };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await fetch(`${API_BASE_URL}${CONFIG.API.ENDPOINTS.PROFILE}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.data.user);
                return { success: true, user: data.data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, message: 'Có lỗi xảy ra khi cập nhật thông tin' };
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
