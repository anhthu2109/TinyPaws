import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaCheckCircle,
  FaBox,
  FaTruck,
  FaMapMarkerAlt,
  FaCreditCard,
} from "react-icons/fa";
import { CONFIG } from "../constants/config";

const API_BASE_URL = CONFIG.API.BASE_URL;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Không tìm thấy mã đơn hàng');
      return;
    }

    const fetchOrderDetail = async () => {
      const token = auth?.token || localStorage.getItem("token");

      if (!token) {
        navigate("/dang-nhap");
        return;
      }

      setLoading(true);
      setError(null);
      setOrder(null);

      try {
        const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setOrder(data.data);
        } else {
          setError(data.message || "Không tìm thấy đơn hàng");
        }
      } catch (err) {
        setError("Lỗi khi tải thông tin đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id, auth?.token, navigate]);

  // Format helpers
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);

  const formatDate = (date) =>
    new Date(date).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      shipping: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao hàng",
      delivered: "Đã giao thành công",
      cancelled: "Đã hủy",
    };
    return texts[status] || status;
  };

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-lg">
          Đang tải thông tin đơn hàng...
        </p>
      </div>
    );
  }

  // Error UI
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-20 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Không tìm thấy đơn hàng
        </h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
          <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Đặt hàng thành công!
          </h1>
          <p className="text-gray-600 mb-4">
            Mã đơn hàng:{" "}
            <span className="font-semibold text-blue-600">
              {order.order_number}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            Cảm ơn bạn đã mua hàng tại TinyPaws 💕 Chúng tôi sẽ liên hệ với bạn
            sớm nhất!
          </p>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Trạng thái đơn hàng
          </h2>
          <div className="flex items-center justify-between">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusText(order.status)}
            </span>
            <span className="text-sm text-gray-500">
              {formatDate(order.createdAt)}
            </span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaMapMarkerAlt className="text-blue-600" />
            Địa chỉ giao hàng
          </h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-medium">Người nhận:</span>{" "}
              {order.shipping_address?.full_name}
            </p>
            <p>
              <span className="font-medium">Số điện thoại:</span>{" "}
              {order.shipping_address?.phone}
            </p>
            {order.shipping_address?.email && (
              <p>
                <span className="font-medium">Email:</span>{" "}
                {order.shipping_address.email}
              </p>
            )}
            <p>
              <span className="font-medium">Địa chỉ:</span>{" "}
              {order.shipping_address?.address}
            </p>
            {order.shipping_address?.ward && (
              <p>Phường/Xã: {order.shipping_address.ward}</p>
            )}
            {order.shipping_address?.district && (
              <p>Quận/Huyện: {order.shipping_address.district}</p>
            )}
            {order.shipping_address?.city && (
              <p>Tỉnh/Thành phố: {order.shipping_address.city}</p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaBox className="text-blue-600" />
            Sản phẩm đã đặt
          </h2>
          <div className="space-y-4">
            {order.items?.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 pb-4 border-b last:border-b-0"
              >
                <img
                  src={item.product_id?.images?.[0] || "/placeholder.png"}
                  alt={item.product_id?.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.product_id?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Số lượng: {item.quantity}
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaCreditCard className="text-blue-600" />
            Thông tin thanh toán
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Tạm tính:</span>
              <span>{formatPrice(order.sub_total || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Phí vận chuyển:</span>
              <span className="text-green-600">
                {order.shipping_fee
                  ? formatPrice(order.shipping_fee)
                  : "Miễn phí"}
              </span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Giảm giá:</span>
                <span className="text-red-600">
                  -{formatPrice(order.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
              <span>Tổng cộng:</span>
              <span className="text-blue-600">
                {formatPrice(order.final_total || 0)}
              </span>
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Phương thức thanh toán:</span>{" "}
                {order.payment_method === "paypal" 
                  ? "Thanh toán qua PayPal" 
                  : "Thanh toán khi nhận hàng (COD)"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/products")}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Tiếp tục mua sắm
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Xem lịch sử mua hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
