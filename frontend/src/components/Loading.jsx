import React from 'react';
import { Activity } from 'lucide-react';

export default function Loading({ error, isNoData }) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 mb-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 w-full">
        <Activity className="h-10 w-10 text-red-500 mb-4 animate-pulse" />
        <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-1">System Offline</h3>
        <p className="text-red-600 dark:text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (isNoData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 mb-8 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 w-full animate-fade-in">
        <Activity className="h-10 w-10 text-gray-400 mb-4 opacity-70" />
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-300 mb-1">Waiting for Devices</h3>
        <p className="text-gray-500 flex text-center flex-col max-w-md">
          <span>Sensors have not reported data yet.</span>
          <span className="text-sm mt-2 opacity-70">Ensure your ESP32 is powered on, connected to WiFi with MQTT broker access.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-16 mb-8 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 w-full">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-900 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-300 mb-1">Establishing Connection...</h3>
      <p className="text-gray-500 dark:text-gray-400">Syncing with smart home bridge</p>
    </div>
  );
}
