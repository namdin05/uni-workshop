import { clearSession } from '../api/auth';
import { NavLink, useLocation } from 'react-router-dom';

export default function Header({ session }) {
  const location = useLocation();

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Workshops', to: '/workshops' },
    { label: 'My Learning', to: '/tickets' },
    // { label: 'Notifications', to: '/notifications' },
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

        {/* Tăng gap từ 6 lên 8 để các menu item thoáng hơn */}
        <ul className="flex items-center gap-8 h-full font-['Inter'] text-sm font-medium">
          {navItems.map((item) => {
            const active = isActivePath(location.pathname, item.to);
            return (
              <li key={item.label} className="h-full flex items-center">
                <NavLink
                  to={item.to}
                  className={({ isActive }) => {
                    const isCurrent = isActive || active;
                    
                    // 1. Cấu trúc class CHUNG (luôn có border, margin, padding giống hệt nhau để không bị giật)
                    const baseClasses = "flex items-center h-full px-3 border-b-[3px] transition-colors duration-200 pt-[3px]";
                    
                    // 2. Class THAY ĐỔI theo trạng thái (chỉ thay đổi màu sắc)
                    const stateClasses = isCurrent
                      ? "border-[#003366] dark:border-blue-400 text-[#003366] dark:text-blue-400"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-[#003366] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800";
                      
                    return `${baseClasses} ${stateClasses}`;
                  }}
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
              <button className="ui-btn ui-btn-ghost text-[#003366] dark:text-blue-400 font-['Inter'] text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Login
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}