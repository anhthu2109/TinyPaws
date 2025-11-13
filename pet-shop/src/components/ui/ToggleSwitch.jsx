const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label, 
    description, 
    disabled = false,
    size = 'md' // 'sm', 'md', 'lg'
}) => {
    const sizeClasses = {
        sm: {
            switch: 'w-8 h-4',
            thumb: 'h-3 w-3 after:h-3 after:w-3',
            translate: 'peer-checked:after:translate-x-4'
        },
        md: {
            switch: 'w-11 h-6',
            thumb: 'h-5 w-5 after:h-5 after:w-5',
            translate: 'peer-checked:after:translate-x-full'
        },
        lg: {
            switch: 'w-14 h-7',
            thumb: 'h-6 w-6 after:h-6 after:w-6',
            translate: 'peer-checked:after:translate-x-7'
        }
    };

    const currentSize = sizeClasses[size];

    return (
        <div className="flex items-center justify-between">
            {(label || description) && (
                <div className="flex-1 mr-4">
                    {label && (
                        <label className="text-sm font-medium text-gray-700 block">
                            {label}
                        </label>
                    )}
                    {description && (
                        <p className="text-xs text-gray-500 mt-1">
                            {description}
                        </p>
                    )}
                </div>
            )}
            
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className="sr-only peer"
                />
                <div className={`
                    ${currentSize.switch}
                    bg-gray-200 
                    peer-focus:outline-none 
                    peer-focus:ring-4 
                    peer-focus:ring-blue-300 
                    rounded-full 
                    peer 
                    peer-checked:after:translate-x-full 
                    peer-checked:after:border-white 
                    after:content-[''] 
                    after:absolute 
                    after:top-[2px] 
                    after:left-[2px] 
                    after:bg-white 
                    after:border-gray-300 
                    after:border 
                    after:rounded-full 
                    ${currentSize.thumb}
                    after:transition-all 
                    peer-checked:bg-blue-600
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}></div>
            </label>
        </div>
    );
};

export default ToggleSwitch;
