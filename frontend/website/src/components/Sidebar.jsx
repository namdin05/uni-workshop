import { NavLink } from 'react-router-dom';
import { loadSession, clearSession } from '../api/auth';

export default function Sidebar() {
  const session = loadSession();
  const role = (session?.profile?.role || 'student').toLowerCase();
  const isStaffOrOrganizerOrAdmin = role === 'staff' || role === 'organizer' || role === 'admin';

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  const desktopActiveClass =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-[#003366] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-r-4 border-[#003366] font-['Inter'] text-sm font-semibold transition-all";
  const desktopInactiveClass =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#003366] dark:hover:text-blue-300 transition-all font-['Inter'] text-sm font-semibold";
  const mobileActiveClass =
    "flex flex-col items-center justify-center text-[#003366] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-1 font-['Inter'] text-[10px] font-medium w-16";
  const mobileInactiveClass =
    "flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl p-1 font-['Inter'] text-[10px] font-medium w-16";

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="bg-white dark:bg-slate-900 h-screen w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed left-0 top-0 py-6 hidden md:flex z-40">
        <div className="px-6 mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined filled text-primary-container text-3xl">school</span>
          <span className="text-lg font-black text-[#003366] dark:text-blue-400 tracking-tight">Admin Panel</span>
        </div>

        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 mt-3">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <p className="font-label-md text-on-surface">{session?.profile?.full_name || 'User'}</p>
              <p className="font-label-sm text-slate-500 dark:text-slate-400 capitalize">{role}</p>
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <p className="font-label-sm text-on-surface-variant">Management</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          <NavLink
            to="/workshop"
            className={({ isActive }) => (isActive ? desktopActiveClass : desktopInactiveClass)}
          >
            <span className="material-symbols-outlined">school</span>
            Workshops
          </NavLink>
          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#003366] dark:hover:text-blue-300 transition-all font-['Inter'] text-sm font-semibold" href="#">
            <span className="material-symbols-outlined">badge</span>
            Instructors
          </a>
          <NavLink
            to="/sync"
            className={({ isActive }) => (isActive ? desktopActiveClass : desktopInactiveClass)}
          >
            <span className="material-symbols-outlined">group</span>
            Students
          </NavLink>

          <NavLink
            to="/rooms"
            className={({ isActive }) => (isActive ? desktopActiveClass : desktopInactiveClass)}
          >
            <span className="material-symbols-outlined">meeting_room</span>
            Rooms
          </NavLink>
          {/* Notifications inbox removed; email confirmation sent on registration */}
          {/* admin send notifications removed - notifications sent automatically on registration */}
        </div>

        <div className="px-4 mb-4">
          <p className="font-label-sm text-on-surface-variant">System</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? desktopActiveClass : desktopInactiveClass)}
          >
            <span className="material-symbols-outlined">settings</span>
            Settings
          </NavLink>
          {/* Notifications inbox removed; email confirmation sent on registration */}
          {/* admin send notifications removed - notifications sent automatically on registration */}
        </div>

        <div className="mt-auto px-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all font-['Inter'] text-sm font-semibold">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <NavLink
          className={({ isActive }) => (isActive ? mobileActiveClass : mobileInactiveClass)}
          to="/workshop"
        >
          <span className="material-symbols-outlined mb-1">school</span>
          Workshops
        </NavLink>
        {isStaffOrOrganizerOrAdmin && (
          <NavLink
            className={({ isActive }) => (isActive ? mobileActiveClass : mobileInactiveClass)}
            to="/sync"
          >
            <span className="material-symbols-outlined filled mb-1">assignment_ind</span>
            Staff
          </NavLink>
        )}
        <NavLink
          className={({ isActive }) => (isActive ? mobileActiveClass : mobileInactiveClass)}
          to="/profile"
        >
          <span className="material-symbols-outlined mb-1">person</span>
          Profile
        </NavLink>
      </nav>
    </>
  );
}
