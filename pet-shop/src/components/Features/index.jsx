import { FaTruck, FaHeadset, FaShieldAlt, FaMoneyBillWave } from 'react-icons/fa';
import './style.css';

const Features = () => {
    const features = [
        {
            icon: <FaTruck />,
            title: 'Miễn phí vận chuyển',
            description: 'Đơn hàng từ 500.000đ'
        },
        {
            icon: <FaHeadset />,
            title: 'Hỗ trợ 24/7',
            description: 'Tư vấn nhiệt tình'
        },
        {
            icon: <FaShieldAlt />,
            title: 'Thanh toán an toàn',
            description: 'Bảo mật 100%'
        },
        {
            icon: <FaMoneyBillWave />,
            title: 'Hoàn tiền dễ dàng',
            description: 'Trong vòng 7 ngày'
        }
    ];

    return (
        <div className="features py-6 bg-white">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-item flex items-center gap-3 p-4 rounded-lg hover:shadow-md transition">
                            <div className="icon text-[40px] text-[#ff5252]">
                                {feature.icon}
                            </div>
                            <div className="content">
                                <h4 className="text-[15px] font-semibold">{feature.title}</h4>
                                <p className="text-[13px] text-gray-500">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;
