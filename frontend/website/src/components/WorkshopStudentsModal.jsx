import { useEffect, useState } from 'react';
import { fetchWorkshopRegistrations, loadSession } from '../api/auth';

export default function WorkshopStudentsModal({ id, onClose }) {
  const session = loadSession();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetchWorkshopRegistrations(id, session?.token);
        if (!active) return;
        const regs = res.registrations || res.students || [];
        // Flatten registration -> student info if API returned joined users
        const flat = regs.map((r) => {
          const user = r.users || r.user || {};
          return {
            registration_id: r.id,
            id: user.id || r.user_id || null,
            student_id: user.student_id || user.studentId || null,
            full_name: user.full_name || user.name || r.full_name || '—',
            email: user.email || r.email || '—',
            status: r.status || r.registration_status || '—',
            created_at: r.created_at || r.createdAt || null,
          };
        });
        setStudents(flat);
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Failed to load registrants.');
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) load();
    return () => { active = false; };
  }, [id, session?.token]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold">Registered Students</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-900">Close</button>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading registrants...</div>
          ) : error ? (
            <div className="py-6 text-center text-rose-600">{error}</div>
          ) : students.length === 0 ? (
            <div className="py-6 text-center text-slate-500">No registrations yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-slate-600 border-b">
                    <th className="py-3 pr-4">#</th>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Student ID</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={s.id || s.student_id || idx} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 text-sm text-slate-700">{idx + 1}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{s.full_name || s.name || '—'}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{s.student_id || s.studentId || '—'}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700">{s.email || '—'}</td>
                      <td className="py-3 pr-4 text-sm text-slate-700 capitalize">{s.status || s.registration_status || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
