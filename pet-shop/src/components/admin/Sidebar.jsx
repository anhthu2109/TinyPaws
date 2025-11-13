import { NavLink } from "react-router-dom";
import { 
  X, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users,
  Tag,
  FileText, 
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  BookOpen
} from "lucide-react";
import { useState } from "react";

const Sidebar = ({ onClose }) => {
  const [salesOpen, setSalesOpen] = useState(false);

  const menuItems = [
    { 
      name: "Dashboard", 
      icon: LayoutDashboard, 
      path: "/admin/dashboard" 
    },
    { 
      name: "Orders", 
      icon: ShoppingCart, 
      path: "/admin/orders" 
    },
    { 
      name: "Products", 
      icon: Package, 
      path: "/admin/products" 
    },
    { 
      name: "Categories", 
      icon: Tag, 
      path: "/admin/categories" 
    },
    { 
      name: "Users", 
      icon: Users, 
      path: "/admin/users" 
    },
    { 
      name: "Blog", 
      icon: BookOpen, 
      path: "/admin/blogs" 
    },
    { 
      name: "Content", 
      icon: FileText, 
      path: "/admin/content" 
    },
    { 
      name: "Messages", 
      icon: MessageSquare, 
      path: "/admin/chat" 
    },
  ];

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col fixed left-0 top-0">
      {/* Logo Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">TP</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">TinyPaws</h2>
            <p className="text-gray-400 text-xs">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Section Label */}
      <div className="px-6 py-4">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
          Main
        </p>
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto px-3 sidebar-scroll">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Application Section */}
        <div className="mt-6 mb-3">
          <p className="px-4 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            Application
          </p>
        </div>

        {/* Settings */}
        <ul className="space-y-1">
          <li>
            <NavLink
              to="/admin/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => {
            if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
              // Add logout logic here
              window.location.href = "/dang-nhap";
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-all"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
