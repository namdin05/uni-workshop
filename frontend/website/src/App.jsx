import { useEffect, useState } from 'react';
import './App.css';
import {
  clearSession,
  fetchProfile,
  loadSession,
  loginRequest,
  registerRequest,
  saveSession,
} from './lib/auth.js';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StudentBottomNav from './components/StudentBottomNav';
import StudentHome from './pages/StudentHome';
import WorkshopCatalog from './pages/WorkshopCatalog';
import WorkshopDetails from './pages/WorkshopDetails';
import MyTickets from './pages/MyTickets';
import PaymentGateway from './pages/PaymentGateway';
import DataSync from './pages/DataSync';
import AdminWorkshops from './pages/AdminWorkshops';

const DEFAULT_FORM = {
  email: '',
  password: '',
  fullName: '',
  studentId: '',
};

const ROLE_META = {
  student: {
    label: 'Student',
    tone: 'from-sky-600 to-blue-700',
    surface: 'bg-sky-50 text-sky-700 ring-sky-200',
    summary: 'View tickets, learning records, and personal progress.',
    access: ['Profile', 'My Learning', 'Workshops'],
  },
  organizer: {
    label: 'Organizer',
    tone: 'from-indigo-700 to-slate-900',
    surface: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    summary: 'Manage workshops, reports, and live operations.',
    access: ['Workshop admin', 'Analytics', 'Check-in'],
  },
  staff: {
    label: 'Staff',
    tone: 'from-emerald-600 to-teal-700',
    surface: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    summary: 'Handle QR scanning, roster sync, and attendance.',
    access: ['Check-in', 'Roster sync', 'Support desk'],
  },
  admin: {
    label: 'Admin',
    tone: 'from-slate-900 to-slate-700',
    surface: 'bg-slate-100 text-slate-800 ring-slate-300',
    summary: 'Full platform control across users, roles, and events.',
    access: ['System control', 'All workshops', 'All check-in flows'],
  },
};

const AUTH_CARDS = [
  {
    title: 'Verified login flow',
    description: 'Sessions are stored locally and revalidated with the backend profile endpoint.',
  },
  {
    title: 'Role-based views',
    description: 'The dashboard changes content based on `users.role` from Supabase.',
  },
  {
    title: 'Protected routes',
    description: 'Organizer and staff actions mirror the current Express middleware rules.',
  },
];

const BACKEND_ROUTES = [
  { path: '/api/auth/register', access: 'Public' },
  { path: '/api/auth/login', access: 'Public' },
  { path: '/api/user/profile', access: 'Token required' },
  { path: '/api/payments/gateway/status', access: 'Public' },
  { path: '/api/admin/workshops', access: 'Organizer only' },
  { path: '/api/checkin', access: 'Staff or organizer' },
];

const DASHBOARD_MODULES = [
  {
    title: 'Student Portal',
    description: 'Tickets, learning records, and academic progress.',
    allowedRoles: ['student', 'admin'],
    accent: 'from-sky-500 to-indigo-600',
  },
  {
    title: 'Workshop Management',
    description: 'Create sessions, edit schedules, and publish updates.',
    allowedRoles: ['organizer', 'admin'],
    accent: 'from-indigo-700 to-slate-900',
  },
  {
    title: 'Check-in Desk',
    description: 'QR attendance, roster lookup, and live verification.',
    allowedRoles: ['staff', 'organizer', 'admin'],
    accent: 'from-emerald-600 to-teal-700',
  },
  {
    title: 'Security and Access',
    description: 'Inspect permissions, roles, and protected API coverage.',
    allowedRoles: ['admin'],
    accent: 'from-slate-900 to-slate-700',
  },
];

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

function normalizeRole(role) {
  return (role || 'student').toLowerCase();
}

function PlaceholderPage({ title, description }) {
  return (
    <div className="max-w-container-max mx-auto px-8 py-12 text-on-surface">
      <h1 className="font-h2 text-h2 mb-3">{title}</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">{description}</p>
    </div>
  );
}

function getRoleMeta(role) {
  return ROLE_META[role] ?? ROLE_META.student;
}

function App() {
  const [auth, setAuth] = useState(null);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function boot() {
      const stored = loadSession();

      if (!stored?.token) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const profileResponse = await fetchProfile(stored.token);
        const nextSession = {
          token: stored.token,
          user: stored.user ?? null,
          profile: profileResponse.profile,
        };

        saveSession(nextSession);

        if (active) {
          setAuth(nextSession);
        }
      } catch {
        clearSession();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    boot();

    return () => {
      active = false;
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleLogout() {
    clearSession();
    setAuth(null);
    setMode('login');
    setNotice('');
    setError('');
    setForm(DEFAULT_FORM);
  }

  function ProtectedRoute({ children, requiredRole }) {
    const role = normalizeRole(auth?.profile?.role);
    const hasAccess = !requiredRole || requiredRole.includes(role);
    return hasAccess ? children : <div className="text-sm text-rose-600">Access denied.</div>;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');

    try {
      const payload =
        mode === 'login'
          ? await loginRequest({
              email: form.email.trim(),
              password: form.password,
            })
          : await registerRequest({
              email: form.email.trim(),
              password: form.password,
              fullName: form.fullName.trim(),
              studentId: form.studentId.trim(),
            });

      const token = payload.token ?? null;

      if (token) {
        const profile = payload.profile ?? (await fetchProfile(token)).profile;
        const nextSession = {
          token,
          user: payload.user ?? null,
          profile,
        };

        saveSession(nextSession);
        setAuth(nextSession);
        setForm(DEFAULT_FORM);
        return;
      }

      setMode('login');
      setForm((current) => ({
        ...current,
        password: '',
      }));
      setNotice(payload.message || 'Tài khoản đã được tạo. Hãy đăng nhập để tiếp tục.');
    } catch (submitError) {
      setError(submitError.message || 'Không thể xử lý yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (auth?.profile) {
    const role = normalizeRole(auth.profile.role);
    const isStudent = role === 'student';

    return (
      <BrowserRouter>
        <div className="min-h-screen bg-background text-on-surface flex">
          {!isStudent && <Sidebar />}
          <div className={joinClasses('flex-1 flex flex-col', !isStudent && 'ml-0 md:ml-64')}>
            {isStudent && <Header session={auth} />}
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={isStudent ? <StudentHome /> : <DashboardShell session={auth} />} />
                <Route path="/home" element={<StudentHome />} />
                <Route path="/workshops" element={<WorkshopCatalog />} />
                <Route path="/workshops/:id" element={<WorkshopDetails />} />
                <Route path="/tickets" element={<MyTickets />} />
                <Route path="/payment/demo" element={<PaymentGateway />} />
                <Route path="/profile" element={<MyTickets />} />
                <Route
                  path="/sync"
                  element={
                    <ProtectedRoute requiredRole={['staff', 'organizer', 'admin']}>
                      <DataSync />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/workshops"
                  element={
                    <ProtectedRoute requiredRole={['organizer', 'admin']}>
                      <AdminWorkshops />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            {isStudent && <StudentBottomNav />}
          </div>
        </div>
      </BrowserRouter>
    );
  }

  return (
    <AuthShell
      mode={mode}
      form={form}
      onModeChange={setMode}
      onChange={updateField}
      onSubmit={handleSubmit}
      notice={notice}
      error={error}
      submitting={submitting}
    />
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_34%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]" />
        <div className="relative flex flex-col items-center gap-4 rounded-[28px] border border-white/10 bg-white/6 px-8 py-10 text-center backdrop-blur-xl">
          <div className="h-14 w-14 animate-pulse rounded-2xl border border-white/10 bg-white/10" />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-200/80">UniHub Portal</p>
            <h1 className="mt-2 font-[family-name:var(--ui-display)] text-3xl font-semibold">
              Loading secure session
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-300">
            Revalidating your profile and role against the backend before showing the
            protected workspace.
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthShell({ mode, form, onModeChange, onChange, onSubmit, notice, error, submitting }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f7fb] text-slate-900">
      <div className="relative mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row">
        <div className="absolute left-[-6rem] top-[-6rem] h-80 w-80 rounded-full bg-sky-300/30 blur-3xl orb-drift" />
        <div className="absolute bottom-[-7rem] right-[-6rem] h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl orb-drift orb-drift-delay" />

        <aside className="relative flex flex-1 flex-col justify-between border-b border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(244,247,251,0.72))] px-6 py-8 backdrop-blur lg:min-h-screen lg:max-w-[46%] lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                UH
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">UniHub Portal</p>
                <h2 className="font-[family-name:var(--ui-display)] text-2xl font-semibold text-slate-950">
                  University workflows in one workspace
                </h2>
              </div>
            </div>

            <div className="max-w-2xl space-y-4">
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 ring-1 ring-sky-200">
                Role-aware access
              </span>
              <h1 className="font-[family-name:var(--ui-display)] text-4xl font-semibold leading-tight text-slate-950 lg:text-6xl">
                Modern university auth flow with dashboard states that match real roles.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600 lg:text-lg">
                Use the same backend contract for registration, login, and authorization.
                Students, staff, organizers, and admins all see different capabilities after
                signing in.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {AUTH_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur"
                >
                  <h3 className="text-sm font-semibold text-slate-950">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-950 px-5 py-5 text-white shadow-2xl shadow-slate-900/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">Backend routes</p>
                <h3 className="mt-1 text-xl font-semibold">Permission mapping</h3>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                Express + Supabase
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {BACKEND_ROUTES.map((route) => (
                <div
                  key={route.path}
                  className="flex items-center justify-between gap-4 border-b border-white/8 px-4 py-3 last:border-b-0"
                >
                  <code className="rounded-full bg-white/10 px-3 py-1 text-xs text-sky-100">{route.path}</code>
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-300">{route.access}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="relative flex flex-1 items-center justify-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-[640px]">
            <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">UniHub Portal</p>
                <h2 className="font-[family-name:var(--ui-display)] text-2xl font-semibold text-slate-950">
                  Secure entry
                </h2>
              </div>
              <div className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                {mode === 'login' ? 'Login' : 'Register'}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:p-8">
              <div className="flex rounded-2xl bg-slate-100 p-1">
                {['login', 'register'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onModeChange(item)}
                    className={joinClasses(
                      'ui-btn flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-none',
                      mode === item
                        ? 'ui-btn-primary shadow-lg shadow-slate-950/20'
                        : 'ui-btn-ghost text-slate-500 hover:text-slate-900',
                    )}
                  >
                    {item === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-700">
                  {mode === 'login' ? 'Welcome back' : 'Create your student account'}
                </p>
                <h2 className="font-[family-name:var(--ui-display)] text-3xl font-semibold text-slate-950">
                  {mode === 'login'
                    ? 'Continue into the protected portal.'
                    : 'Register first, then use the role-guarded dashboard.'}
                </h2>
                <p className="max-w-xl text-sm leading-6 text-slate-600">
                  {mode === 'login'
                    ? 'The token and profile are fetched from the backend, then the interface adapts to the assigned role.'
                    : 'Registration currently creates a student account. Organizer or staff roles can be assigned later in the database.'}
                </p>
              </div>

              <form className="mt-8 space-y-4" onSubmit={onSubmit}>
                <Field
                  label="Email address"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="student@unihub.edu.vn"
                  type="email"
                  autoComplete="email"
                />

                {mode === 'register' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Full name"
                      name="fullName"
                      value={form.fullName}
                      onChange={onChange}
                      placeholder="Nguyen Van A"
                      autoComplete="name"
                    />
                    <Field
                      label="Student ID"
                      name="studentId"
                      value={form.studentId}
                      onChange={onChange}
                      placeholder="SV2026001"
                      autoComplete="off"
                    />
                  </div>
                ) : null}

                <Field
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="Enter your password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />

                {mode === 'register' ? (
                  <p className="text-sm leading-6 text-slate-500">
                    New accounts are created as <span className="font-semibold text-slate-900">student</span> by
                    default. The backend role is the source of truth for all protected views.
                  </p>
                ) : null}

                {notice ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                    {notice}
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-btn ui-btn-primary inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-sm font-semibold shadow-lg shadow-slate-950/20"
                >
                  {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in to dashboard' : 'Create my account'}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">Authorization note:</span>
                  <span>protected endpoints are enforced by backend middleware, not only by the UI.</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = 'text', autoComplete }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
}

function DashboardShell({ session }) {
  const role = normalizeRole(session.profile?.role);
  const meta = getRoleMeta(role);
  const profile = session.profile;

  return (
    <main className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen bg-surface-container-low">
      {/* Page Header */}
      <div className="px-6 py-8 md:px-10 md:py-10 bg-surface border-b border-surface-variant">
        <div>
          <h1 className="font-h1 text-on-surface">Welcome back, {profile.full_name || profile.email}</h1>
          <p className="font-body-md text-on-surface-variant mt-1">Dashboard overview • Role: <span className="font-semibold capitalize">{role}</span></p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 md:p-10 flex-1 w-full max-w-container-max mx-auto space-y-6">
        {/* Welcome Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Session Info Card */}
          <div className="bg-gradient-to-br from-primary-container to-primary rounded-xl border border-primary-container p-6 text-on-primary shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-white opacity-5 rounded-xl"></div>
            <div className="relative z-10">
              <span className="material-symbols-outlined text-4xl mb-2 block opacity-80">verified_user</span>
              <h2 className="font-h2 text-on-primary">Protected session active</h2>
              <p className="font-body-md text-primary-fixed mt-2">Your token was validated with /api/user/profile endpoint.</p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="bg-white/20 text-on-primary font-label-sm text-label-sm px-sm py-xs rounded-full">{meta.label}</span>
                <span className="bg-white/20 text-on-primary font-label-sm text-label-sm px-sm py-xs rounded-full">{profile.student_id || 'ID pending'}</span>
              </div>
            </div>
          </div>

          {/* Profile Info Card */}
          <div className="bg-surface rounded-xl border border-secondary-fixed p-6 shadow-sm">
            <h3 className="font-h3 text-on-surface mb-4">Your Profile</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-surface-variant">
                <span className="font-label-md text-on-surface-variant">Name</span>
                <span className="font-label-md text-on-surface">{profile.full_name || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-variant">
                <span className="font-label-md text-on-surface-variant">Email</span>
                <span className="font-label-md text-on-surface truncate ml-2">{profile.email}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-label-md text-on-surface-variant">Role</span>
                <span className="font-label-md text-on-surface capitalize bg-primary-fixed/30 px-sm py-xs rounded-full">{role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accessible Features */}
        <div className="bg-surface rounded-xl border border-secondary-fixed shadow-sm p-6">
          <h3 className="font-h3 text-on-surface mb-4">Your available features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meta.access.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-surface-container-high border border-outline-variant">
                <span className="material-symbols-outlined text-primary-container text-sm">check_circle</span>
                <span className="font-label-md text-on-surface">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Backend Routes Info */}
        <div className="bg-surface rounded-xl border border-secondary-fixed shadow-sm overflow-hidden">
          <div className="p-6 border-b border-surface-variant">
            <h3 className="font-h3 text-on-surface">Protected API Endpoints</h3>
            <p className="font-label-sm text-on-surface-variant mt-1">These routes check your role via middleware</p>
          </div>
          <div className="divide-y divide-surface-variant">
            {BACKEND_ROUTES.map((route) => (
              <div key={route.path} className="p-4 hover:bg-surface-container-high transition-colors flex items-center justify-between gap-4">
                <code className="font-label-sm text-on-surface bg-surface-container px-2 py-1 rounded">{route.path}</code>
                <span className="font-label-sm bg-primary-fixed text-on-primary-fixed-variant px-sm py-xs rounded-full">{route.access}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
