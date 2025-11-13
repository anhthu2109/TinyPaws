import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField, Button, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaPhone, FaMapMarkerAlt, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import './style.css';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error when user types
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        setError('');

        try {
            const { confirmPassword, ...registerData } = formData;
            const result = await register(registerData);
            
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message || 'Đăng ký thất bại');
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
                    <div className="auth-card register-card">
                        <div className="auth-header">
                            <div className="auth-logo">
                                <FaUserPlus className="logo-icon" />
                            </div>
                            <h1>Đăng ký</h1>
                            <p>Tạo tài khoản mới tại TinyPaws</p>
                        </div>

                        {error && (
                            <Alert severity="error" className="auth-alert">
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <TextField
                                fullWidth
                                label="Họ và tên"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FaUser className="input-icon" />
                                        </InputAdornment>
                                    ),
                                }}
                                className="auth-input"
                            />

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

                            <TextField
                                fullWidth
                                label="Xác nhận mật khẩu"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
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
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                edge="end"
                                                disabled={loading}
                                            >
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
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
                                        Đang đăng ký...
                                    </>
                                ) : (
                                    'Đăng ký'
                                )}
                            </Button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                Đã có tài khoản? {' '}
                                <Link to="/dang-nhap" className="auth-link">
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
