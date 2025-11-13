import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const Toast = ({ 
    message, 
    type = 'success', // 'success', 'error', 'warning', 'info'
    duration = 3000,
    onClose 
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose && onClose(), 300); // Wait for animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getToastStyles = () => {
        const baseStyles = "fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border transition-all duration-300 transform";
        
        if (!isVisible) {
            return `${baseStyles} translate-x-full opacity-0`;
        }

        switch (type) {
            case 'success':
                return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
            case 'error':
                return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
            case 'warning':
                return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
            case 'info':
                return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
            default:
                return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
        }
    };

    const getIcon = () => {
        const iconClass = "h-5 w-5 flex-shrink-0";
        
        switch (type) {
            case 'success':
                return <FaCheck className={`${iconClass} text-green-600`} />;
            case 'error':
                return <FaTimes className={`${iconClass} text-red-600`} />;
            case 'warning':
                return <FaExclamationTriangle className={`${iconClass} text-yellow-600`} />;
            case 'info':
                return <FaInfoCircle className={`${iconClass} text-blue-600`} />;
            default:
                return <FaInfoCircle className={`${iconClass} text-gray-600`} />;
        }
    };

    return (
        <div className={getToastStyles()}>
            {getIcon()}
            <span className="font-medium">{message}</span>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(() => onClose && onClose(), 300);
                }}
                className="ml-2 text-current opacity-70 hover:opacity-100 transition-opacity"
            >
                <FaTimes className="h-4 w-4" />
            </button>
        </div>
    );
};

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

export default Toast;
