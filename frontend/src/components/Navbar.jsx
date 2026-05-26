import React from 'react';
import { NavLink } from 'react-router-dom';
// Đã import thêm icon Shield (cho Security) và User (cho Profile)
import { Home, LineChart, LogOut, ShieldCheck, Shield, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  // Lấy role từ localStorage, chuyển hết thành chữ thường để chống lỗi viết hoa viết thường (Admin vs admin)
  const currentRole = (localStorage.getItem('role') || '').toLowerCase();
  const isAdmin = currentRole === 'admin' || currentRole === 'superadmin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role'); // Xóa luôn role cho sạch sẽ bộ nhớ
    window.location.href = '/login';
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-card border-x-0 border-t-0 rounded-none mb-8 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-primary-500 p-2 rounded-lg text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <Home size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Luxe<span className="text-primary-500 font-light">Home</span></h1>
          <div className="text-[10px] uppercase tracking-widest flex items-center gap-1 text-green-500 font-semibold mt-0.5">
            <ShieldCheck size={12} /> Secure Connection
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-6">
        <NavLink 
          to="/" 
          className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-500/10 text-primary-500 font-medium' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
        >
          <Home size={18} /> <span className="hidden md:inline">Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/analytics" 
          className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-500/10 text-primary-500 font-medium' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
        >
          <LineChart size={18} /> <span className="hidden md:inline">Analytics</span>
        </NavLink>

        {/* 🔥 TÍNH NĂNG PHÂN QUYỀN: Chỉ hiển thị nút này nếu tài khoản là Admin 🔥 */}
        {isAdmin && (
          <NavLink 
            to="/security" 
            className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-red-500/10 text-red-500 font-medium' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <Shield size={18} /> <span className="hidden md:inline">Security</span>
          </NavLink>
        )}

        {/* Nút Profile dành cho tất cả mọi người (kể cả admin hay customer) */}
        <NavLink 
          to="/profile" 
          className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-500/10 text-primary-500 font-medium' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
        >
          <User size={18} /> <span className="hidden md:inline">Profile</span>
        </NavLink>
        
        <div className="h-6 w-[1px] bg-gray-200 dark:bg-slate-700 mx-2"></div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors p-2 md:px-4 md:py-2"
        >
          <LogOut size={18} /> <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}