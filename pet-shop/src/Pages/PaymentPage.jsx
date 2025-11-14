import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const API_BASE_URL =
    (import.meta.env.VITE_API_URL &&
        import.meta.env.VITE_API_URL.replace(/\/$/, "")) ||
    "/api";

const formatPrice = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
        value
    );

const PaymentPage = () => {
    const navigate = useNavigate();
    const auth = useAuth();  // ✅ Remove optional chaining
    const { cartItems, getCartTotal, getCartCount, clearCart } = useCart();
    
    // Get token from multiple sources
    const getAuthToken = () => {
        return auth?.token || 
               auth?.user?.token || 
               localStorage.getItem("token") || 
               localStorage.getItem("authToken");
    };
    
    const authToken = getAuthToken();

    const initialFormState = useMemo(
        () => ({
            fullName: "",
            email: "",
            phone: "",
            province: "",
            district: "",
            ward: "",
            detailAddress: "",
            notes: "",
        }),
        []
    );
    const [formData, setFormData] = useState(initialFormState);
    const [isFetchingProfile, setIsFetchingProfile] = useState(true);
    const [allowSaveOption, setAllowSaveOption] = useState(false);
    const [saveForLater, setSaveForLater] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("COD"); // COD or PAYPAL

    if (!cartItems.length) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="mx-auto max-w-3xl rounded-lg bg-white p-10 text-center shadow">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Giỏ hàng của bạn đang trống
                    </h1>
                    <p className="mt-3 text-gray-600">
                        Vui lòng thêm sản phẩm trước khi tiến hành thanh toán.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate("/products")}
                        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                    >
                        Mua sắm ngay
                    </button>
                </div>
            </div>
        );
    }

    const subtotal = getCartTotal();
    const totalItems = getCartCount();
    const shippingFee = 0;
    const grandTotal = subtotal + shippingFee;

    useEffect(() => {
        let isCancelled = false;
        const fetchRecipientInfo = async () => {
            if (!authToken) {
                if (!isCancelled) {
                    setAllowSaveOption(true);
                    setIsFetchingProfile(false);
                }
                return;
            }
            
            const userProfile = {
                fullName: auth?.user?.full_name || auth?.user?.name || "",
                email: auth?.user?.email || "",
                phone: auth?.user?.phone || auth?.user?.phone_number || "",
                province: auth?.user?.shippingAddress?.province || auth?.user?.city || "",
                district: auth?.user?.shippingAddress?.district || "",
                ward: auth?.user?.shippingAddress?.ward || "",
                detailAddress: auth?.user?.shippingAddress?.detail || auth?.user?.address || "",
            };
            
            if (!isCancelled) {
                const newFormData = {
                    ...initialFormState,
                    ...userProfile,
                    notes: "",
                };
                
                setFormData(newFormData);
                
                // Show save checkbox if no address info
                const hasAddress = userProfile.province || userProfile.district || userProfile.ward || userProfile.detailAddress;
                setAllowSaveOption(!hasAddress);
                setSaveForLater(false);
                setIsFetchingProfile(false);
            }
            
            /* TODO: Fix API call later
            try {
                const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                const profileJson = await response.json();
                // ... rest of API logic
            } catch (error) {
                // ... error handling
            }
            */
        };
        fetchRecipientInfo();
        return () => {
            isCancelled = true;
        };
    }, [authToken, auth?.user, initialFormState]);

    const handleFieldChange = (field) => (event) => {
        const { value } = event.target;
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Validate form data
    const validateForm = () => {
        const errors = [];
        if (!formData.fullName?.trim()) errors.push("Họ tên");
        if (!formData.email?.trim()) errors.push("Email");
        if (!formData.phone?.trim()) errors.push("Số điện thoại");
        if (!formData.detailAddress?.trim()) errors.push("Địa chỉ chi tiết");
        
        if (errors.length > 0) {
            setStatusMessage({
                type: "error",
                text: `Vui lòng điền đầy đủ thông tin: ${errors.join(", ")}`,
            });
            return false;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            setStatusMessage({
                type: "error",
                text: "Email không hợp lệ",
            });
            return false;
        }
        
        // Validate phone format (10-11 digits)
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(formData.phone.trim())) {
            setStatusMessage({
                type: "error",
                text: "Số điện thoại không hợp lệ (10-11 chữ số)",
            });
            return false;
        }
        
        return true;
    };

    // Create order function (dùng chung cho COD và PayPal)
    const createOrder = async (paymentMethodType, paypalOrderId = null) => {
        try {
            // 1. Lưu thông tin người nhận nếu user chọn
            if (allowSaveOption && saveForLater && authToken) {
                const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        full_name: formData.fullName?.trim(),
                        phone_number: formData.phone?.trim(),
                        city: formData.province?.trim(),
                        address: formData.detailAddress?.trim(),
                    }),
                });
                
                const profileResult = await profileResponse.json();
                if (profileResponse.ok && profileResult.success) {
                    setAllowSaveOption(false);
                    setSaveForLater(false);
                }
            }
            
            // 2. Tạo đơn hàng
            const orderData = {
                items: cartItems.map(item => ({
                    product_id: item._id || item.id,
                    quantity: item.quantity,
                    discount: 0
                })),
                shipping_address: {
                    full_name: formData.fullName?.trim(),
                    phone: formData.phone?.trim(),
                    email: formData.email?.trim() || undefined,
                    address: formData.detailAddress?.trim(),
                    ward: formData.ward?.trim() || undefined,
                    district: formData.district?.trim() || undefined,
                    city: formData.province?.trim() || undefined
                },
                payment_method: paymentMethodType === "PAYPAL" ? "paypal" : "cash_on_delivery",
                paypal_order_id: paypalOrderId,
                notes: formData.notes?.trim() || "",
                shipping_fee: shippingFee,
                discount_amount: 0
            };
            
            const orderResponse = await fetch(`${API_BASE_URL}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(orderData),
            });
            
            const orderResult = await orderResponse.json();
            
            if (!orderResponse.ok) {
                throw new Error(orderResult.message || "Đặt hàng thất bại");
            }
            
            // 3. Thành công - Clear cart và redirect
            const orderId = orderResult.order?._id || orderResult.data?._id;
            
            if (!orderId) {
                throw new Error('Không nhận được mã đơn hàng');
            }
            
            return orderId;
            
        } catch (error) {
            throw error;
        }
    };

    const handlePlaceOrder = async () => {
        if (isSubmitting) return;
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        setStatusMessage(null);
        setIsSubmitting(true);
        
        try {
            const orderId = await createOrder("COD");
            
            // Clear cart first
            clearCart();
            
            // Show success message
            setStatusMessage({
                type: "success",
                text: "Đặt hàng thành công! Đang chuyển hướng...",
            });
            
            // Force navigation with window.location (hard navigation)
            setTimeout(() => {
                window.location.href = `/orders/${orderId}`;
            }, 300);
            
        } catch (error) {
            setStatusMessage({
                type: "error",
                text: error.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // PayPal configuration
    const paypalOptions = {
        "client-id": "AfjN4VVYt6OKEoA0-ZFOUmkX4RRHOK_foovd1887USl4jS6Swautr2xftDkOl81AdlgkoYR9N3UBH6Mw",
        currency: "USD",
        intent: "capture",
    };

    return (
        <PayPalScriptProvider options={paypalOptions}>
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-900">Đặt hàng</h1>
                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    <section className="lg:col-span-2">
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Thông tin người nhận
                            </h2>
                            <form className="mt-6 grid gap-4" onSubmit={(event) => event.preventDefault()}>
                                {isFetchingProfile && (
                                    <p className="rounded-md bg-blue-50 px-4 py-2 text-sm text-blue-700">
                                        Đang tải thông tin người nhận...
                                    </p>
                                )}
                                {statusMessage && (
                                    <p
                                        className={`rounded-md px-4 py-2 text-sm ${statusMessage.type === "success"
                                            ? "bg-green-50 text-green-700"
                                            : statusMessage.type === "warning"
                                                ? "bg-yellow-50 text-yellow-700"
                                                : statusMessage.type === "error"
                                                    ? "bg-red-50 text-red-700"
                                                    : "bg-blue-50 text-blue-700"
                                            }`}
                                    >
                                        {statusMessage.text}
                                    </p>
                                )}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                                        Họ tên
                                        <input
                                            type="text"
                                            placeholder="Nguyễn Văn A"
                                            value={formData.fullName}
                                            onChange={handleFieldChange("fullName")}
                                            disabled={isFetchingProfile}
                                            className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                                        Email
                                        <input
                                            type="email"
                                            placeholder="email@example.com"
                                            value={formData.email}
                                            onChange={handleFieldChange("email")}
                                            disabled={isFetchingProfile}
                                            className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                                        />
                                    </label>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                                        Số điện thoại
                                        <input
                                            type="tel"
                                            placeholder="0123 456 789"
                                            value={formData.phone}
                                            onChange={handleFieldChange("phone")}
                                            disabled={isFetchingProfile}
                                            className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                                        Tỉnh / Thành phố
                                        <input
                                            type="text"
                                            placeholder="Hồ Chí Minh"
                                            value={formData.province}
                                            onChange={handleFieldChange("province")}
                                            disabled={isFetchingProfile}
                                            className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                                        />
                                    </label>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                                        Quận / Huyện
                                        <input
                                            type="text"
                                            placeholder="Quận 1"
                                            value={formData.district}
                                            onChange={handleFieldChange("district")}
                                            disabled={isFetchingProfile}
                                            className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-gray-700">
                                        Phường / Xã
                                        <input
                                            type="text"
                                            placeholder="Phường Bến Nghé"
                                            value={formData.ward}
                                            onChange={handleFieldChange("ward")}
                                            disabled={isFetchingProfile}
                                            className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                                        />
                                    </label>
                                </div>
                                <label className="flex flex-col gap-2 text-sm text-gray-700">
                                    Địa chỉ chi tiết
                                    <input
                                        type="text"
                                        placeholder="Số nhà, tên đường..."
                                        value={formData.detailAddress}
                                        onChange={handleFieldChange("detailAddress")}
                                        disabled={isFetchingProfile}
                                        className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                                    />
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-gray-700">
                                    Ghi chú (nếu có)
                                    <textarea
                                        rows={4}
                                        placeholder="Yêu cầu giao hàng đặc biệt..."
                                        value={formData.notes}
                                        onChange={handleFieldChange("notes")}
                                        className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                </label>
                                {allowSaveOption && (
                                    <label className="flex items-center gap-3 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                            checked={saveForLater}
                                            onChange={(event) => setSaveForLater(event.target.checked)}
                                            disabled={isSubmitting}
                                        />
                                        <span>Lưu thông tin cho lần sau</span>
                                    </label>
                                )}
                            </form>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-lg bg-white p-6 shadow">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Tóm tắt đơn hàng
                            </h2>
                            <ul className="mt-4 space-y-4">
                                {cartItems.map((item) => {
                                    const unitPrice = item.sale_price || item.price;
                                    return (
                                        <li key={item._id} className="flex gap-4">
                                            <img
                                                src={item.images?.[0] || item.image}
                                                alt={item.name}
                                                className="h-20 w-20 rounded-md object-cover"
                                            />
                                            <div className="flex flex-1 justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatPrice(unitPrice)} × {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="font-medium text-gray-900">
                                                    {formatPrice(unitPrice * item.quantity)}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="mt-6 flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Nhập mã giảm giá"
                                    className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                                <button
                                    type="button"
                                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                >
                                    Áp dụng
                                </button>
                            </div>

                            <div className="mt-6 space-y-3 text-sm text-gray-700">
                                <div className="flex items-center justify-between">
                                    <span>Tổng phụ: {totalItems} mặt hàng</span>
                                    <span className="font-medium text-gray-900">
                                        {formatPrice(subtotal)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Phí vận chuyển</span>
                                    <span className="font-medium text-green-600">Miễn phí</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                                    <span>Tổng cộng</span>
                                    <span>{formatPrice(grandTotal)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Phương thức thanh toán
                            </h3>
                            <div className="mt-4 space-y-3 text-sm text-gray-700">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        checked={paymentMethod === "COD"}
                                        onChange={() => setPaymentMethod("COD")}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Thanh toán tiền mặt (COD)</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="payment-method"
                                        checked={paymentMethod === "PAYPAL"}
                                        onChange={() => setPaymentMethod("PAYPAL")}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>PayPal</span>
                                </label>
                            </div>
                            
                            {/* COD Button */}
                            {paymentMethod === "COD" && (
                                <button
                                    type="button"
                                    className="mt-6 w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting || isFetchingProfile}
                                >
                                    {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
                                </button>
                            )}
                            
                            {/* PayPal Buttons */}
                            {paymentMethod === "PAYPAL" && (
                                <div className="mt-6">
                                    <PayPalButtons
                                        style={{ layout: "vertical" }}
                                        disabled={isFetchingProfile}
                                        createOrder={(data, actions) => {
                                            // Validate form trước khi tạo PayPal order
                                            if (!validateForm()) {
                                                return Promise.reject(new Error("Vui lòng điền đầy đủ thông tin"));
                                            }
                                            
                                            // Tạo PayPal order
                                            return actions.order.create({
                                                purchase_units: [
                                                    {
                                                        amount: {
                                                            currency_code: "USD",
                                                            value: (grandTotal / 24000).toFixed(2), // Convert VND to USD (tỷ giá ~24000)
                                                        },
                                                        description: `Đơn hàng TinyPaws - ${totalItems} sản phẩm`,
                                                    },
                                                ],
                                            });
                                        }}
                                        onApprove={async (data, actions) => {
                                            try {
                                                // Capture payment từ PayPal
                                                const details = await actions.order.capture();
                                                
                                                setIsSubmitting(true);
                                                setStatusMessage({
                                                    type: "success",
                                                    text: "Thanh toán PayPal thành công! Đang tạo đơn hàng...",
                                                });
                                                
                                                // Tạo đơn hàng trong database với PayPal order ID
                                                const orderId = await createOrder("PAYPAL", details.id);
                                                
                                                // Clear cart
                                                clearCart();
                                                
                                                // Redirect to order detail
                                                setStatusMessage({
                                                    type: "success",
                                                    text: "Đặt hàng thành công! Đang chuyển hướng...",
                                                });
                                                
                                                setTimeout(() => {
                                                    window.location.href = `/orders/${orderId}`;
                                                }, 500);
                                                
                                            } catch (error) {
                                                setIsSubmitting(false);
                                                setStatusMessage({
                                                    type: "error",
                                                    text: error.message || "Có lỗi xảy ra khi tạo đơn hàng",
                                                });
                                            }
                                        }}
                                        onError={(err) => {
                                            setStatusMessage({
                                                type: "error",
                                                text: "Thanh toán PayPal thất bại. Vui lòng thử lại.",
                                            });
                                        }}
                                        onCancel={() => {
                                            setStatusMessage({
                                                type: "warning",
                                                text: "Bạn đã hủy thanh toán PayPal",
                                            });
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
        </PayPalScriptProvider>
    );
};

export default PaymentPage;
