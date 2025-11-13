const Badge = ({ 
    children, 
    variant = 'default', 
    size = 'md',
    className = '',
    onRemove = null
}) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-cyan-100 text-cyan-800'
    };

    const sizes = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    return (
        <span className={`
            inline-flex items-center gap-1 
            ${variants[variant]} 
            ${sizes[size]} 
            rounded-full font-medium
            ${className}
        `}>
            {children}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="ml-1 text-current hover:text-opacity-70 transition-colors"
                >
                    ×
                </button>
            )}
        </span>
    );
};

export default Badge;
