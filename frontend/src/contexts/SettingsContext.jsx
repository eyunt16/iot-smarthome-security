import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { AlertTriangle, Bell, Info, X } from 'lucide-react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    notif: true,
    datalog: true,
    emailalert: false,
  });
  const [toasts, setToasts] = useState([]);

  // Fetch settings from persistent database on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/auth/settings');
        if (response) {
          setSettings({
            notif: response.notif ?? true,
            datalog: response.datalog ?? true,
            emailalert: response.emailalert ?? false,
          });
        }
      } catch (err) {
        console.warn('[Settings] Failed to fetch settings from API, using default/local settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = async (id, value) => {
    const nextSettings = { ...settings, [id]: value };
    setSettings(nextSettings);
    try {
      await api.post('/auth/settings', nextSettings);
    } catch (err) {
      console.error('[Settings] Failed to save settings to API:', err);
    }
  };

  const showToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, showToast }}>
      {children}
      
      {/* Premium Glassmorphic Toasts Overlay */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const isWarning = t.type === 'warning' || t.type === 'alert';
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3.5 rounded-2xl border p-4.5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer"
              style={{
                borderColor: isWarning ? 'rgba(220,60,50,0.35)' : 'rgba(197,168,128,0.3)',
                background: isWarning
                  ? 'linear-gradient(135deg, rgba(62,26,26,0.94) 0%, rgba(42,16,16,0.96) 100%)'
                  : 'linear-gradient(135deg, rgba(78,66,56,0.94) 0%, rgba(58,49,43,0.96) 100%)',
                color: '#E8E0D5',
                boxShadow: isWarning
                  ? '0 12px 32px rgba(220,60,50,0.18)'
                  : '0 12px 32px rgba(0,0,0,0.25)',
              }}
              onClick={() => removeToast(t.id)}
            >
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                style={{
                  backgroundColor: isWarning ? 'rgba(220,60,50,0.2)' : 'rgba(197,168,128,0.18)',
                  color: isWarning ? '#F87171' : '#C5A880',
                }}
              >
                {isWarning ? <AlertTriangle size={15} /> : <Bell size={15} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: isWarning ? '#F87171' : '#C5A880' }}>
                  {t.title}
                </p>
                <p className="text-[11px] text-white/80 mt-1 leading-relaxed font-semibold">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(t.id);
                }}
                className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
