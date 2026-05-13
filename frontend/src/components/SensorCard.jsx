import React from 'react';
import { motion } from 'framer-motion';

export default function SensorCard({ title, value, unit, icon: Icon, color, trend }) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glass-card p-6 relative overflow-hidden group cursor-pointer"
    >
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10 bg-${color}-500 blur-2xl group-hover:opacity-20 transition-opacity duration-500`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-500`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      
      <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <motion.span 
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight"
        >
          {value || '--'}
        </motion.span>
        <span className="text-gray-500 font-medium text-lg">{unit}</span>
      </div>
    </motion.div>
  );
}
