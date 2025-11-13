import { useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { Menu, Bell, Settings, User, ArrowLeft } from "lucide-react";
import Sidebar from "../components/admin/Sidebar";
import "./AdminLayout.css";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:block">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Sidebar - mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          ></div>

          {/* Sidebar panel */}
          <div className="relative z-50 w-64 shadow-2xl slide-in-left">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm px-2 lg:px-3 py-1 lg:py-2 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>

            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Quay lại trang trước"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
              <Settings size={20} />
            </button>

            {/* User Profile */}
            <Link
              to="/admin/profile"
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 hidden lg:block">Admin</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
