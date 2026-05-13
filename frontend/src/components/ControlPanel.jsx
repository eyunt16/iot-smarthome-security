import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export default function ControlPanel({ devices }) {
  // devices is an array of objects e.g., [{ id: 'light', name: 'Living Room Light', icon: Lightbulb, state: false, color: 'yellow' }]

  const [deviceStates, setDeviceStates] = useState(
    devices.reduce((acc, dev) => ({ ...acc, [dev.id]: dev.state }), {})
  );
  
  // Note: if backend has an endpoint to publish, we would POST to /api/device/:id
  const handleToggle = async (deviceId) => {
    const newState = !deviceStates[deviceId];
    setDeviceStates(prev => ({ ...prev, [deviceId]: newState }));

    try {
      // Assuming a backend endpoint exists to forward to MQTT
      // If we don't have one, we can also use MQTT Service
      await api.post(`/device/toggle`, { device: deviceId, state: newState ? '1' : '0' });
    } catch (e) {
      console.warn('Failed to contact backend:', e);
      // Revert optimism if failed
      setDeviceStates(prev => ({ ...prev, [deviceId]: !newState }));
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {devices.map((device) => {
        const Icon = device.icon;
        const isActive = deviceStates[device.id];
        const color = device.color || 'yellow';

        return (
          <motion.div 
            key={device.id}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleToggle(device.id)}
            className={`p-6 rounded-2xl cursor-pointer border transition-all duration-300 relative overflow-hidden ${
              isActive 
                ? `bg-${color}-50 dark:bg-${color}-500/20 border-${color}-200 dark:border-${color}-500/50 shadow-[0_0_20px_rgba(var(--color-${color}-500),0.15)]` 
                : 'bg-white/50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full transition-colors duration-300 ${
                  isActive ? `bg-${color}-500 text-white` : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                }`}>
                  <Icon size={24} />
                </div>
                <h3 className={`font-semibold ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {device.name}
                </h3>
              </div>
              
              <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                isActive ? `bg-${color}-500` : 'bg-gray-200 dark:bg-slate-700'
              }`}>
                <motion.div 
                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                  animate={{ x: isActive ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
