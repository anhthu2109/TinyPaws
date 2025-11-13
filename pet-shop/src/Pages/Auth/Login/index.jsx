import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField, Button, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import './style.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                // Kiểm tra role của user để redirect đúng trang
                if (result.user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/');
                }
            } else {
                setError(result.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            setError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="container">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-header">
                            <div className="auth-logo">
                                <FaUser className="logo-icon" />
                            </div>
                            <h1>Đăng nhập</h1>
                            <p>Chào mừng bạn trở lại TinyPaws!</p>
                        </div>

                        {error && (
                            <Alert severity="error" className="auth-alert">
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FaEnvelope className="input-icon" />
                                        </InputAdornment>
                                    ),
                                }}
                                className="auth-input"
                            />

                            <TextField
                                fullWidth
                                label="Mật khẩu"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FaLock className="input-icon" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                disabled={loading}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                className="auth-input"
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                className="auth-button"
                            >
                                {loading ? (
                                    <>
                                        <CircularProgress size={20} className="button-spinner" />
                                        Đang đăng nhập...
                                    </>
                                ) : (
                                    'Đăng nhập'
                                )}
                            </Button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Chưa có tài khoản? {' '}
                                <Link to="/dang-ky" className="auth-link">
                                    Đăng ký ngay
                                </Link>
                            </p>
                            <Link to="/quen-mat-khau" className="auth-link forgot-password">
                                Quên mật khẩu?
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
