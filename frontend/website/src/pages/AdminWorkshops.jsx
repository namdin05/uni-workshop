import { useState, useEffect, useCallback } from 'react';
import { fetchAdminWorkshops, loadSession, warmUpWorkshopCache } from '../api/auth';
import AddWorkshopModal from '../components/AddWorkshopModal';
import EditWorkshopModal from '../components/EditWorkshopModal';
import WorkshopStudentsModal from '../components/WorkshopStudentsModal';

export default function AdminWorkshops() {
  const session = loadSession();
  const role = (session?.profile?.role || 'student').toLowerCase();

  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorkshopId, setEditingWorkshopId] = useState(null);
  const [viewStudentsWorkshopId, setViewStudentsWorkshopId] = useState(null);

  const [warmingUp, setWarmingUp] = useState(false);
  const [warmUpMessage, setWarmUpMessage] = useState('');
  const [warmUpError, setWarmUpError] = useState('');

  const loadWorkshops = useCallback(async () => {
    try {
      const res = await fetchAdminWorkshops(session?.token);
      setWorkshops(res.workshops || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    loadWorkshops();
  }, [loadWorkshops]);

  if (role !== 'organizer' && role !== 'admin') {
    return (
      <div className="p-6 text-sm text-rose-600">
        Access denied: Organizer role required.
      </div>
    );
  }

  function getEnrolledCount(workshop) {
    const totalSeats =
      typeof workshop.total_seats === 'number'
        ? workshop.total_seats
        : typeof workshop.available_seats === 'number'
        ? workshop.available_seats
        : 0;
    const availableSeats =
      typeof workshop.available_seats === 'number'
        ? workshop.available_seats
        : totalSeats;
    return Math.max(0, totalSeats - availableSeats);
  }

  function getStatusBadge(status) {
    const s = status || 'draft';
    switch (s) {
      case 'published':
        return (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Published
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-rose-700">
            Cancelled
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-outline-variant bg-surface-container px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            {s}
          </span>
        );
    }
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-surface-container-low">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-surface-variant bg-surface px-4 py-6 sm:px-6 md:flex-row md:items-center md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div>
          <h1 className="font-h1 text-on-surface">Workshops Management</h1>
          <p className="mt-1 font-body-md text-on-surface-variant">
            Quản lý và theo dõi các buổi workshop của bạn.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="ui-btn ui-btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 font-label-md shadow-md transition-all hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Workshop
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="mx-auto w-full max-w-container-max flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="animate-pulse p-12 text-center text-on-surface-variant">
                Đang tải danh sách...
              </div>
            ) : workshops.length === 0 ? (
              <div className="p-12 text-center italic text-on-surface-variant">
                Chưa có workshop nào được tạo.
              </div>
            ) : (
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-slate-50">
                    <th className="w-1/4 p-5 text-sm font-bold text-slate-700">Workshop Info</th>
                    <th className="p-5 text-sm font-bold text-slate-700">Date</th>
                    <th className="p-5 text-sm font-bold text-slate-700">Time</th>
                    <th className="p-5 text-center text-sm font-bold text-slate-700">Enrolled</th>
                    <th className="p-5 text-sm font-bold text-slate-700">Status</th>
                    <th className="p-5 text-right text-sm font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant bg-white">
                  {workshops.map((w) => {
                    const start = w.start_time ? new Date(w.start_time) : null;
                    const end = w.end_time ? new Date(w.end_time) : null;
                    const dateStr = start ? start.toLocaleDateString('vi-VN') : 'TBA';
                    const timeStr = start && end ? `${start.toTimeString().slice(0, 5)} - ${end.toTimeString().slice(0, 5)}` : '--:--';

                    return (
                      <tr key={w.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                              <span className="material-symbols-outlined text-[20px]">school</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-bold text-slate-900">{w.title}</h4>
                              <p className="mt-0.5 truncate text-xs text-slate-500">{w.speaker_name || 'No speaker'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-sm font-medium text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_today</span>
                            {dateStr}
                          </div>
                        </td>
                        <td className="p-5 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>
                            {timeStr}
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-sm font-bold text-slate-900">{getEnrolledCount(w)}</span>
                            <span className="text-[10px] font-bold uppercase text-slate-400">/ {w.total_seats} seats</span>
                          </div>
                        </td>
                        <td className="p-5">
                          {getStatusBadge(w.status)}
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Nút Xem danh sách sinh viên */}
                            <button
                              onClick={() => setViewStudentsWorkshopId(w.id)}
                              title="Xem danh sách đăng ký"
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900"
                            >
                              <span className="material-symbols-outlined text-[20px]">group</span>
                            </button>

                            {/* Nút Edit luôn hiển thị */}
                            <button
                              onClick={() => setEditingWorkshopId(w.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddWorkshopModal
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            loadWorkshops();
            setShowAddModal(false);
          }}
        />
      )}

      {editingWorkshopId && (
        <EditWorkshopModal
          id={editingWorkshopId}
          onClose={() => setEditingWorkshopId(null)}
          onSaveSuccess={loadWorkshops}
        />
      )}

      {viewStudentsWorkshopId && (
        <WorkshopStudentsModal id={viewStudentsWorkshopId} onClose={() => setViewStudentsWorkshopId(null)} />
      )}
    </main>
  );
}