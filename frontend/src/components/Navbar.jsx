import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LineChart, LogOut, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem('token');
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
