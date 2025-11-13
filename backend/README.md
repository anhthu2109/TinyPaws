# TinyPaws Backend API

Backend API cho website thương mại điện tử TinyPaws Pet Shop.

## 🚀 Cài đặt và Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
File `.env` đã được cấu hình với:
- MongoDB connection string đến database TINYPAWS
- JWT secrets
- Mail configuration

### 3. Chạy server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Đăng ký tài khoản mới
```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "123456",
  "phone": "0123456789",
  "address": "123 Đường ABC, TP.HCM"
}
```

#### POST `/api/auth/login`
Đăng nhập
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

#### GET `/api/auth/me`
Lấy thông tin user hiện tại (cần token)

#### PUT `/api/auth/profile`
Cập nhật thông tin cá nhân (cần token)

### User Management Routes (`/api/users`)

#### GET `/api/users`
Lấy danh sách users (Admin only)

#### GET `/api/users/:id`
Lấy thông tin user theo ID (Admin only)

#### PUT `/api/users/:id`
Cập nhật user (Admin only)

#### DELETE `/api/users/:id`
Xóa user (Admin only)

## 🔐 Authentication

API sử dụng JWT token để xác thực. Thêm token vào header:
```
Authorization: Bearer <your-token>
```

## 👤 Tài khoản Admin mặc định

Khi server khởi động lần đầu, hệ thống sẽ tự động tạo tài khoản admin:
- **Email**: admin@gmail.com
- **Password**: 123456

## 📊 Database Schema

### User Collection
```javascript
{
  name: String,        // Tên người dùng
  email: String,       // Email (unique)
  password: String,    // Mật khẩu đã hash
  isAdmin: Boolean,    // Quyền admin
  address: String,     // Địa chỉ
  avatar: String,      // URL avatar
  phone: String,       // Số điện thoại
  isVerified: Boolean, // Trạng thái xác thực
  createdAt: Date,     // Ngày tạo
  updatedAt: Date      // Ngày cập nhật
}
```

## 🛡️ Security Features

- ✅ Password hashing với bcryptjs
- ✅ JWT token authentication
- ✅ Input validation với express-validator
- ✅ CORS protection
- ✅ Error handling middleware
- ✅ Admin role protection

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Lỗi mô tả",
  "errors": [
    // Validation errors (nếu có)
  ]
}
```

## 🔧 Environment Variables

```env
PORT=3000
MONGO_DB=mongodb+srv://anhthu:thuchipi1234@cluster0.wi2jc9r.mongodb.net/TINYPAWS?retryWrites=true&w=majority
JWT_SECRET=tinypaws_jwt_secret_key_super_secure_2024
ACCESS_TOKEN=tinypaws_access_token_secret_key_2024
REFRESH_TOKEN=tinypaws_refresh_token_secret_key_2024
```

## 📦 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **cors**: Cross-origin resource sharing
- **express-validator**: Input validation
- **dotenv**: Environment variables

## 🚀 Deployment

1. Đảm bảo MongoDB connection string đúng
2. Cấu hình environment variables
3. Chạy `npm start`

---

**TinyPaws Team** 🐾
