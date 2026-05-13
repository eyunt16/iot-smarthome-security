import React from 'react';
import { motion } from 'framer-motion';

export default function DashboardCard({ title, value, unit, icon: Icon, color }) {
  const isNoData = value === null || value === '--';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-6 overflow-hidden relative group cursor-pointer h-full"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 dark:bg-${color}-500/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
      
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400`}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <h3 className="text-gray-500 dark:text-gray-400 font-medium">{title}</h3>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-baseline gap-1">
          {isNoData ? (
             <span className="text-3xl font-bold text-gray-400 dark:text-gray-600">--</span>
          ) : (
            <>
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{value}</span>
              <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">{unit}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
