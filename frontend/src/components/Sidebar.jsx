import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Leaf,
  UserCircle,
  LogOut,
  Sparkles,
  Lock,
  Home,
} from 'lucide-react';
import { useTheme } from '../contexts/DarkModeContext';
import { canManageSystem, getRoleLabel } from '../services/authSession';

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'security',    label: 'Security',    icon: ShieldCheck },
  { id: 'environment', label: 'Environment', icon: Leaf },
  { id: 'profile',     label: 'Profile',     icon: UserCircle },
];

export default function Sidebar({ activePage, setActivePage, onLogout, currentUser }) {
  const { isDark, colors } = useTheme();
  const isAdmin = canManageSystem(currentUser);
  const navItems = isAdmin ? NAV : NAV.filter((item) => item.id !== 'security');
  const displayName = currentUser?.username || 'Guest User';
  const roleLabel = isAdmin ? 'System Admin' : getRoleLabel(currentUser);

  // Global accent — Forest Green (light) or Muted Gold (dark)
  const accent     = isDark ? '#C8AA76' : '#1A4D2E';
  const accentBg   = isDark ? 'rgba(200,170,118,0.15)' : 'rgba(26,77,46,0.1)';
  const inactiveBg = isDark ? 'rgba(90,71,48,0.3)' : 'rgba(26,77,46,0.06)';

  return (
    <aside
      className="flex h-full w-[260px] shrink-0 flex-col rounded-[32px] border transition-all duration-300 overflow-hidden"
      style={{
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        borderColor: colors.border,
        boxShadow: isDark
          ? '0 24px 60px rgba(0,0,0,0.35)'
          : '0 24px 60px rgba(155,124,84,0.12)',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div
        className="border-b px-7 pb-6 pt-7 transition-all duration-300"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl shadow-md transition-all duration-300 hover:scale-[1.05]"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #C8AA76, #A89060)'
                : 'linear-gradient(135deg, #2D6A42, #1A4D2E)',
            }}
          >
            <Home size={17} color="#FFFFFF" />
          </div>
          <p
            className="font-display text-[21px] font-bold tracking-[-0.02em] transition-colors duration-300"
            style={{ color: colors.text }}
          >
            Tuyen Home
          </p>
        </div>
        <p
          className="text-[10px] uppercase tracking-[0.3em] mb-3 transition-colors duration-300"
          style={{ color: colors.textSecondary }}
        >
          IoT Smart Home
        </p>
        <div
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all duration-300"
          style={{ backgroundColor: isDark ? 'rgba(90,71,48,0.4)' : '#f0ebe3' }}
        >
          <Lock size={10} style={{ color: colors.textSecondary }} />
          <span
            className="text-[9px] font-bold uppercase tracking-widest transition-colors duration-300"
            style={{ color: colors.textSecondary }}
          >
            Security &amp; Privacy
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hidden">
        <p
          className="mb-3 px-2 text-[9px] font-bold uppercase tracking-[0.3em] transition-colors duration-300"
          style={{ color: colors.textSecondary }}
        >
          Main Menu
        </p>
        <div className="space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                className="group flex w-full items-center gap-3 rounded-[16px] px-4 py-3.5 text-left text-[14px] font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                style={{
                  backgroundColor: active ? accentBg : 'transparent',
                  color: active ? colors.text : colors.textSecondary,
                }}
              >
                {/* Icon badge */}
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-[12px] transition-all duration-300"
                  style={{
                    backgroundColor: active ? accent : inactiveBg,
                    color: active ? '#FFFFFF' : colors.textSecondary,
                  }}
                >
                  <Icon size={15} strokeWidth={active ? 2.4 : 2} color={active ? '#FFFFFF' : colors.textSecondary} />
                </div>
                <span className="flex-1 font-semibold">{label}</span>
                {active && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── User + Logout ─────────────────────────────────── */}
      <div
        className="border-t px-4 py-5 transition-all duration-300"
        style={{ borderColor: colors.border }}
      >
        <div
          className="mb-2.5 flex items-center gap-3 rounded-[18px] p-3 transition-all duration-300"
          style={{ backgroundColor: isDark ? 'rgba(90,71,48,0.35)' : '#fbf4ea' }}
        >
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-md transition-all duration-300"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #C8AA76, #A89060)'
                : 'linear-gradient(135deg, #2D6A42, #1A4D2E)',
            }}
          >
            <Sparkles size={15} />
          </div>
          <div className="min-w-0">
            <p
              className="truncate text-[13px] font-semibold transition-colors duration-300"
              style={{ color: colors.text }}
            >
              {displayName}
            </p>
            <p
              className="text-[9px] uppercase tracking-[0.2em] transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              {roleLabel}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] border px-4 py-2.5 text-[12px] font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
          style={{
            borderColor: colors.border,
            backgroundColor: isDark ? 'rgba(90,71,48,0.2)' : 'rgba(255,255,255,0.8)',
            color: colors.textSecondary,
          }}
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
