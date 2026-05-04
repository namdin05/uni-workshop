import { NavLink, useLocation } from 'react-router-dom';

const ITEMS = [
  { label: 'Home', to: '/', icon: 'home' },
  { label: 'Workshops', to: '/workshops', icon: 'calendar_today' },
  { label: 'My Learning', to: '/tickets', icon: 'school' },
  { label: 'Profile', to: '/profile', icon: 'person' },
];

function isActivePath(pathname, target) {
  if (target === '/') return pathname === '/';
  return pathname.startsWith(target);
}

export default function StudentBottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {ITEMS.map((item) => {
        const active = isActivePath(location.pathname, item.to);
        const baseClasses = 'flex flex-col items-center justify-center rounded-xl p-1 font-\'Inter\' text-[10px] font-medium w-16 transition-all';
        const activeClasses = 'text-[#003366] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 scale-95';
        const inactiveClasses = 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800';
        return (
          <NavLink key={item.label} to={item.to} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
            <span
              className="material-symbols-outlined mb-1"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="mt-0.5">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
