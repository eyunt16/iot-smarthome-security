import React from 'react';
import { Leaf, Plus } from 'lucide-react';

export default function SystemHealth() {
  return (
    <div className="w-[320px] h-screen bg-[#e8effc] dark:bg-[#121b33] p-6 lg:flex flex-col hidden sticky top-0 shrink-0">
      <h2 className="text-[20px] font-bold text-[#0d1222] dark:text-white mb-8">System Health</h2>

      {/* Metric Bars */}
      <div className="space-y-6 mb-10">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-[#0d1222] dark:text-gray-300">Network Latency</span>
            <span className="text-sm font-bold text-[#64748b]">12ms</span>
          </div>
          <div className="h-2 w-full bg-indigo-900/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-700 w-[15%] rounded-full" />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-[#0d1222] dark:text-gray-300">Storage Capacity</span>
            <span className="text-sm font-bold text-rose-600">42%</span>
          </div>
          <div className="h-2 w-full bg-indigo-900/10 rounded-full overflow-hidden">
            <div className="h-full bg-rose-600 w-[42%] rounded-full" />
          </div>
        </div>
      </div>

      {/* Optimization Tip Card */}
      <div className="bg-white dark:bg-[#1e293b] rounded-[24px] p-6 shadow-xl shadow-indigo-500/5 relative overflow-hidden mb-10">
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center opacity-60">
          <Leaf className="w-12 h-12 text-slate-300 dark:text-slate-600" />
        </div>
        
        <h3 className="font-bold text-[#0d1222] dark:text-white mb-2">Optimization Tip</h3>
        <p className="text-[13.5px] text-[#64748b] leading-relaxed mb-6 font-medium relative z-10 w-[85%]">
          Lowering bedroom temperature by 1°C could save 5% on your energy bill this month.
        </p>
        
        <button className="bg-[#4b5563] hover:bg-[#374151] text-white text-sm font-semibold py-2.5 px-6 rounded-full transition-colors relative z-10 shadow-lg shadow-gray-500/20">
          Apply Now
        </button>
      </div>

      {/* Live Load Graphic */}
      <div className="flex-1 flex flex-col justify-end pb-4">
        <h3 className="font-bold text-[#0d1222] dark:text-white mb-6">Live Load</h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {/* Animated Bars Simulation */}
          <div className="w-1/6 bg-indigo-200 dark:bg-indigo-900/50 rounded-t-lg h-[40%]" />
          <div className="w-1/6 bg-indigo-300 dark:bg-indigo-900/60 rounded-t-lg h-[60%]" />
          <div className="w-1/6 bg-indigo-200 dark:bg-indigo-900/50 rounded-t-lg h-[35%]" />
          <div className="w-1/6 bg-indigo-400 dark:bg-indigo-800/80 rounded-t-lg h-[85%]" />
          <div className="w-1/6 bg-[#3b4b86] dark:bg-indigo-500 rounded-t-lg h-[55%] shadow-lg shadow-indigo-500/30" />
          <div className="w-1/6 bg-indigo-200 dark:bg-indigo-900/50 rounded-t-lg h-[25%]" />
        </div>
      </div>
    </div>
  );
}
