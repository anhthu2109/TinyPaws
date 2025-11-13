import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa';
import { Button, TextField } from '@mui/material';
import './style.css';

const Contact = () => {
    return (
        <div className="contact-page py-6">
            <div className="container">
                <div className="breadcrumb mb-4 text-[14px]">
                    <span className="text-gray-500">Trang chủ</span>
                    <span className="mx-2">/</span>
                    <span className="text-[#ff5252] font-semibold">Liên hệ</span>
                </div>

                <div className="page-header mb-6 text-center">
                    <h1 className="text-[32px] font-bold mb-2">Liên hệ với chúng tôi</h1>
                    <p className="text-[14px] text-gray-600">
                        Chúng tôi luôn sẵn sàng hỗ trợ bạn và thú cưng của bạn
                    </p>
                </div>

                {/* Contact Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="info-card bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition text-center">
                        <div className="icon w-[60px] h-[60px] rounded-full bg-[#ff5252]/10 flex items-center justify-center mx-auto mb-4">
                            <FaPhone className="text-[24px] text-[#ff5252]" />
                        </div>
                        <h3 className="text-[16px] font-bold mb-2">Điện thoại</h3>
                        <p className="text-[14px] text-gray-600">1800-1234</p>
                        <p className="text-[14px] text-gray-600">0901-234-567</p>
                    </div>

                    <div className="info-card bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition text-center">
                        <div className="icon w-[60px] h-[60px] rounded-full bg-[#ff5252]/10 flex items-center justify-center mx-auto mb-4">
                            <FaEnvelope className="text-[24px] text-[#ff5252]" />
                        </div>
                        <h3 className="text-[16px] font-bold mb-2">Email</h3>
                        <p className="text-[14px] text-gray-600">info@tinypaws.vn</p>
                        <p className="text-[14px] text-gray-600">support@tinypaws.vn</p>
                    </div>

                    <div className="info-card bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition text-center">
                        <div className="icon w-[60px] h-[60px] rounded-full bg-[#ff5252]/10 flex items-center justify-center mx-auto mb-4">
                            <FaMapMarkerAlt className="text-[24px] text-[#ff5252]" />
                        </div>
                        <h3 className="text-[16px] font-bold mb-2">Địa chỉ</h3>
                        <p className="text-[14px] text-gray-600">123 Đường ABC</p>
                        <p className="text-[14px] text-gray-600">Quận 1, TP.HCM</p>
                    </div>

                    <div className="info-card bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition text-center">
                        <div className="icon w-[60px] h-[60px] rounded-full bg-[#ff5252]/10 flex items-center justify-center mx-auto mb-4">
                            <FaClock className="text-[24px] text-[#ff5252]" />
                        </div>
                        <h3 className="text-[16px] font-bold mb-2">Giờ làm việc</h3>
                        <p className="text-[14px] text-gray-600">T2-T7: 8:00 - 20:00</p>
                        <p className="text-[14px] text-gray-600">CN: 9:00 - 18:00</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Contact Form */}
                    <div className="contact-form bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-[24px] font-bold mb-4">Gửi tin nhắn cho chúng tôi</h2>
                        <form className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextField
                                    label="Họ và tên"
                                    variant="outlined"
                                    fullWidth
                                    required
                                />
                                <TextField
                                    label="Số điện thoại"
                                    variant="outlined"
                                    fullWidth
                                    required
                                />
                            </div>
                            <TextField
                                label="Email"
                                variant="outlined"
                                fullWidth
                                required
                                type="email"
                            />
                            <TextField
                                label="Tiêu đề"
                                variant="outlined"
                                fullWidth
                                required
                            />
                            <TextField
                                label="Nội dung"
                                variant="outlined"
                                fullWidth
                                required
                                multiline
                                rows={6}
                            />
                            <Button className="!w-full !bg-[#ff5252] !text-white !py-3 !text-[16px] !font-semibold hover:!bg-[#013b22]">
                                Gửi tin nhắn
                            </Button>
                        </form>
                    </div>

                    {/* Map & Social */}
                    <div className="space-y-6">
                        {/* Map */}
                        <div className="map bg-white rounded-lg overflow-hidden shadow-sm h-[350px]">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4956929441436!2d106.69530731533395!3d10.772461262309804!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3330bcc9%3A0x5a8b2d0e8e825e8!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBLaG9hIGjhu41jIFThu7Egbmhpw6puIC0gxJDhuqFpIGjhu41jIFF14buRYyBnaWEgVFAuSENN!5e0!3m2!1svi!2s!4v1647856789123!5m2!1svi!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                            ></iframe>
                        </div>

                        {/* Social & Additional Info */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h3 className="text-[20px] font-bold mb-4">Kết nối với chúng tôi</h3>
                            <div className="social-links flex gap-3 mb-6">
                                <a href="#" className="social-icon w-[45px] h-[45px] rounded-full bg-[#3b5998] text-white flex items-center justify-center hover:opacity-80 transition">
                                    <FaFacebook className="text-[20px]" />
                                </a>
                                <a href="#" className="social-icon w-[45px] h-[45px] rounded-full bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white flex items-center justify-center hover:opacity-80 transition">
                                    <FaInstagram className="text-[20px]" />
                                </a>
                                <a href="#" className="social-icon w-[45px] h-[45px] rounded-full bg-[#ff0000] text-white flex items-center justify-center hover:opacity-80 transition">
                                    <FaYoutube className="text-[20px]" />
                                </a>
                            </div>

                            <div className="space-y-3">
                                <div className="info-item p-3 bg-gray-50 rounded">
                                    <h4 className="text-[14px] font-semibold mb-1">Hỗ trợ khách hàng</h4>
                                    <p className="text-[13px] text-gray-600">
                                        Đội ngũ chăm sóc khách hàng của chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn về sản phẩm và dịch vụ.
                                    </p>
                                </div>
                                <div className="info-item p-3 bg-gray-50 rounded">
                                    <h4 className="text-[14px] font-semibold mb-1">Tư vấn miễn phí</h4>
                                    <p className="text-[13px] text-gray-600">
                                        Chúng tôi cung cấp dịch vụ tư vấn miễn phí về chăm sóc và nuôi dưỡng thú cưng.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
