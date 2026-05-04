import { clearSession } from '../lib/auth';
import { NavLink, useLocation } from 'react-router-dom';

export default function Header({ session }) {
  const location = useLocation();

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Workshops', to: '/workshops' },
    { label: 'My Learning', to: '/tickets' },
  ];

  function isActivePath(pathname, target) {
    if (target === '/') return pathname === '/';
    return pathname.startsWith(target);
  }

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 block w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <nav className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto">
        <div className="text-xl font-bold text-[#003366] dark:text-blue-400 tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          UniHub Portal
        </div>

        <ul className="flex items-center gap-6 h-full font-['Inter'] text-sm font-medium">
          {navItems.map((item) => {
            const active = isActivePath(location.pathname, item.to);
            return (
              <li key={item.label} className="h-full flex items-center">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    isActive || active
                      ? 'text-[#003366] dark:text-blue-400 border-b-2 border-[#003366] pb-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center h-full px-2 mt-[2px]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#003366] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center h-full px-2'
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4">
          {session?.profile ? (
            <>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {session.profile.full_name ?? 'Student'}
              </span>
              <button
                onClick={handleLogout}
                className="text-[#003366] dark:text-blue-400 font-['Inter'] text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors px-4 py-2 rounded-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="ui-btn ui-btn-ghost text-[#003366] dark:text-blue-400 font-['Inter'] text-sm font-medium px-4 py-2 rounded-lg">
                Login
              </button>
              <button className="ui-btn ui-btn-primary font-['Inter'] text-sm font-medium px-4 py-2 rounded-lg">
                Register
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
