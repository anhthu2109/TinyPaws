const Card = ({ 
    children, 
    title, 
    description, 
    className = '',
    headerClassName = '',
    bodyClassName = ''
}) => {
    return (
        <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
            {(title || description) && (
                <div className={`px-6 py-4 border-b border-gray-200 ${headerClassName}`}>
                    {title && (
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    )}
                    {description && (
                        <p className="text-sm text-gray-500 mt-1">{description}</p>
                    )}
                </div>
            )}
            <div className={`p-6 ${bodyClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default Card;
