import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function DeviceToggle({ title, icon: Icon, activeColor, onToggle, initialState = false }) {
  const [isOn, setIsOn] = useState(initialState);

  const handleToggle = () => {
    setIsOn(!isOn);
    if (onToggle) onToggle(!isOn);
  };

  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className={`glass-card p-5 cursor-pointer relative overflow-hidden transition-all duration-300 ${isOn ? `border-${activeColor}-500/30` : ''}`}
    >
      {isOn && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`absolute inset-0 bg-${activeColor}-500/5`}
        ></motion.div>
      )}
      
      <div className="flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full transition-colors duration-300 ${isOn ? `bg-${activeColor}-500 text-white shadow-[0_0_15px_rgba(var(--tw-color-${activeColor}-500),0.5)]` : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}>
            <Icon size={20} />
          </div>
          <span className="font-medium text-gray-800 dark:text-gray-200">{title}</span>
        </div>
        
        {/* iOS style toggle */}
        <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors duration-300 ${isOn ? `bg-${activeColor}-500` : 'bg-gray-300 dark:bg-slate-600'}`}>
          <motion.div 
            className="w-4 h-4 bg-white rounded-full shadow-sm"
            animate={{ x: isOn ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
