import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaYoutube, FaTiktok, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import logo from '../../assets/logo/logo.png';
import './style.css';

const Footer = () => {
    return (
        <footer className="footer bg-[#013b22] text-white pt-10 pb-5 mt-10">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Cột 1: Thông tin công ty */}
                    <div className="footer-col">
                        <div className="logo mb-4">
                            <img src={logo} alt="Tiny Paws" className="h-[60px]" />
                        </div>
                        <p className="text-[14px] text-gray-300 mb-4">
                            Tiny Paws - Cung cấp sản phẩm và dịch vụ chăm sóc thú cưng chất lượng cao, 
                            mang đến hạnh phúc cho người bạn bốn chân của bạn.
                        </p>
                        <div className="social-links flex gap-3">
                            <a href="#" className="social-icon w-[35px] h-[35px] rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ff5252] transition">
                                <FaFacebook />
                            </a>
                            <a href="#" className="social-icon w-[35px] h-[35px] rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ff5252] transition">
                                <FaInstagram />
                            </a>
                            <a href="#" className="social-icon w-[35px] h-[35px] rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ff5252] transition">
                                <FaYoutube />
                            </a>
                            <a href="#" className="social-icon w-[35px] h-[35px] rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ff5252] transition">
                                <FaTiktok />
                            </a>
                        </div>
                    </div>

                    {/* Cột 2: Danh mục */}
                    <div className="footer-col">
                        <h3 className="text-[16px] font-bold mb-4">Danh mục sản phẩm</h3>
                        <ul className="space-y-2">
                            <li><Link to="/products/category/cho" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Sản phẩm cho Chó</Link></li>
                            <li><Link to="/products/category/meo" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Sản phẩm cho Mèo</Link></li>
                            <li><Link to="/phu-kien" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Phụ kiện</Link></li>
                            <li><Link to="/cham-soc" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Chăm sóc sức khỏe</Link></li>
                            <li><Link to="/uu-dai" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Ưu đãi</Link></li>
                        </ul>
                    </div>

                    {/* Cột 3: Hỗ trợ khách hàng */}
                    <div className="footer-col">
                        <h3 className="text-[16px] font-bold mb-4">Hỗ trợ khách hàng</h3>
                        <ul className="space-y-2">
                            <li><Link to="/huong-dan-mua-hang" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Hướng dẫn mua hàng</Link></li>
                            <li><Link to="/chinh-sach-doi-tra" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Chính sách đổi trả</Link></li>
                            <li><Link to="/phuong-thuc-thanh-toan" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Phương thức thanh toán</Link></li>
                            <li><Link to="/van-chuyen" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Vận chuyển</Link></li>
                            <li><Link to="/blog" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Blog</Link></li>
                            <li><Link to="/lien-he" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">Liên hệ</Link></li>
                        </ul>
                    </div>

                    {/* Cột 4: Liên hệ */}
                    <div className="footer-col">
                        <h3 className="text-[16px] font-bold mb-4">Liên hệ</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <FaMapMarkerAlt className="text-[#ff5252] mt-1 flex-shrink-0" />
                                <span className="text-[14px] text-gray-300">
                                    123 Đường ABC, Quận 1, TP. Hồ Chí Minh
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <FaPhone className="text-[#ff5252] flex-shrink-0" />
                                <a href="tel:1800-1234" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">
                                    Hotline: 1800-1234
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <FaEnvelope className="text-[#ff5252] flex-shrink-0" />
                                <a href="mailto:info@tinypaws.vn" className="text-[14px] text-gray-300 hover:text-[#ff5252] transition">
                                    info@tinypaws.vn
                                </a>
                            </li>
                        </ul>
                        <div className="mt-4">
                            <h4 className="text-[14px] font-semibold mb-2">Giờ làm việc</h4>
                            <p className="text-[13px] text-gray-300">Thứ 2 - Thứ 7: 8:00 - 20:00</p>
                            <p className="text-[13px] text-gray-300">Chủ nhật: 9:00 - 18:00</p>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/10 pt-5 text-center">
                    <p className="text-[13px] text-gray-300">
                        © 2025 Tiny Paws. All rights reserved. | Designed with ❤️ for pets
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
