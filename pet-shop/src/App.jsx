import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Layout Components
import Header from './components/Header';
import Footer from './components/Footer';

// Public Pages (Existing)
import Home from './Pages/Home';
import Blog from './Pages/Blog';
import Contact from './Pages/Contact';
import Deals from './Pages/Deals';
import ProductDetail from './Pages/ProductDetail';
import ProductList from './Pages/ProductList';
import SearchResults from './Pages/SearchResults';
import UserProfile from './Pages/Profile';
import TestAPI from './Pages/TestAPI';
import CartPage from './Pages/CartPage';
import PaymentPage from './Pages/PaymentPage';
import OrderHistory from './Pages/OrderHistory';
import OrderDetail from './Pages/OrderDetail';
import BlogDetail from './Pages/BlogDetail';

// Auth Pages (Existing)
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';

// Admin Components
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminRedirect from './components/AdminRedirect';
import ChatWidget from "./components/chatbot/ChatWidget";
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './Pages/admin/Dashboard';
import ProductsAdminPage from './Pages/admin/ProductsAdminPage';
import AddProductPage from './Pages/admin/AddProductPage';
import BlogManagement from './Pages/admin/BlogManagement';
import AddBlog from './Pages/admin/AddBlog';
import EditBlog from './Pages/admin/EditBlog';
import EditProductPage from './Pages/admin/EditProductPage';
import Orders from './Pages/admin/Orders';
import Users from './Pages/admin/Users';
import Categories from './Pages/admin/Categories';
import Content from './Pages/admin/Content';
import Chat from './Pages/admin/Chat';
import Profile from './Pages/admin/Profile';

// Context (Existing)
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Responsive Styles
import './styles/responsive.css';

// Wrapper component to use useLocation inside Routes
function PublicRoutes() {
  const location = useLocation();
  
  return (
    <div className="App">
      <Header />
      <ChatWidget />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/lien-he" element={<Contact />} />
          <Route path="/uu-dai" element={<Deals />} />

          {/* Product Routes */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/category/:category" element={<ProductList />} />
          <Route path="/products/detail/:id" element={<ProductDetail />} />
          <Route path="/product/:id" element={<Navigate to="/products/detail/:id" replace />} />

          {/* Search Route */}
          <Route path="/search" element={<SearchResults />} />

          {/* Cart & Payment Routes */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/orders/:id" element={<OrderDetail key={location.pathname} />} />

          {/* Blog Routes */}
          <Route path="/blog/:id" element={<BlogDetail />} />
          
          {/* Test API */}
          <Route path="/test-api" element={<TestAPI />} />

          {/* Legacy Routes - Redirect to new structure */}
          <Route path="/cho" element={<Navigate to="/products/category/cho" replace />} />
          <Route path="/meo" element={<Navigate to="/products/category/meo" replace />} />

          {/* Auth Routes */}
          <Route path="/dang-nhap" element={<Login />} />
          <Route path="/dang-ky" element={<Register />} />

          {/* User Profile Route */}
          <Route path="/profile" element={<UserProfile />} />

          {/* 404 Route - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <AdminRedirect>
              <Routes>
                {/* Admin Routes - No Header/Footer/ChatWidget */}
                <Route path="/admin/*" element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<ProductsAdminPage />} />
                  <Route path="products/new" element={<AddProductPage />} />
                  <Route path="products/edit/:id" element={<EditProductPage />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="users" element={<Users />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="blogs" element={<BlogManagement />} />
                  <Route path="blogs/new" element={<AddBlog />} />
                  <Route path="blogs/edit/:id" element={<EditBlog />} />
                  <Route path="content" element={<Content />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="profile" element={<Profile />} />
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                </Route>

                {/* Public Routes - With Header/Footer/ChatWidget */}
                <Route path="*" element={<PublicRoutes />} />
              </Routes>
            </AdminRedirect>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
