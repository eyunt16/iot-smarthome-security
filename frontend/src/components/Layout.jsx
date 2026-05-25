import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '../contexts/DarkModeContext';
import { canManageSystem } from '../services/authSession';
import {
  LayoutDashboard, ShieldCheck, Leaf, UserCircle,
} from 'lucide-react';

/**
 * Layout
 * Wraps the entire authenticated app shell:
 *   [Sidebar (fixed left)] | [Header (sticky top) + Page Content (scrollable)]
 *
 * Props:
 *   activePage     string           current page id
 *   setActivePage  fn(string)       navigate
 *   isConnected    boolean          MQTT state for header badge
 *   onLogout       fn               passed to sidebar
 *   children       ReactNode        current page
 */
export default function Layout({
  activePage,
  setActivePage,
  isConnected,
  onLogout,
  currentUser,
  children,
}) {
  const { isDark, colors } = useTheme();

  return (
    <div
      className="flex h-screen overflow-hidden transition-all duration-300"
      style={{ backgroundColor: isDark ? colors.bg : '#F8F6F0' }}
    >
      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <div className="hidden lg:flex shrink-0 p-5 h-full">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          onLogout={onLogout}
          currentUser={currentUser}
        />
      </div>

      {/* ── Right panel: header + scrollable content ─────── */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <Header activePage={activePage} isConnected={isConnected} />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hidden transition-all duration-300"
          style={{ backgroundColor: isDark ? colors.bg : '#F8F6F0' }}
        >
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <MobileNav
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
      />
    </div>
  );
}

// ── Mobile bottom navigation ──────────────────────────────────
const MOBILE_NAV = [
  { id: 'dashboard',   label: 'Home',     icon: LayoutDashboard },
  { id: 'security',    label: 'Security', icon: ShieldCheck },
  { id: 'environment', label: 'Environ.', icon: Leaf },
  { id: 'profile',     label: 'Profile',  icon: UserCircle },
];

function MobileNav({ activePage, setActivePage, currentUser }) {
  const { isDark, colors } = useTheme();
  const navItems = canManageSystem(currentUser)
    ? MOBILE_NAV
    : MOBILE_NAV.filter((item) => item.id !== 'security');

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around backdrop-blur-md border-t py-2 safe-area-bottom transition-all duration-300"
      style={{
        // Dark: warm coffee, NOT pitch black
        backgroundColor: isDark ? 'rgba(53,35,21,0.96)' : 'rgba(248,246,240,0.95)',
        borderColor: colors.border,
      }}
    >
      {navItems.map(({ id, label, icon: Icon }) => {
        const active = activePage === id;
        const accentColor = isDark ? '#C8AA76' : '#1A4D2E';
        return (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-300"
            style={{
              color: active ? accentColor : colors.textSecondary,
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
            {active && (
              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
