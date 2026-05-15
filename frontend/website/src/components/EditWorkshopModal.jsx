import { useState, useEffect, useRef } from 'react';
import { loadSession, fetchWorkshop, updateWorkshop, updateWorkshopStatus, fetchRooms } from '../api/auth';

export default function EditWorkshopModal({ id, onClose, onSaveSuccess }) {
  const session = loadSession();
  const token = session?.token;
  const fileInputRef = useRef(null);

  const [workshop, setWorkshop] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    ai_summary: '',
    speaker_name: '',
    room_id: '',
    date: '',        // Ô 1: Ngày
    time_start: '',  // Ô 2: Giờ bắt đầu
    time_end: '',    // Ô 3: Giờ kết thúc
    is_free: false,
    price: 0,
    total_seats: 0,
    status: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rooms, setRooms] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusText, setAiStatusText] = useState('');

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [wsRes, roomsRes] = await Promise.all([
          fetchWorkshop(id),
          fetchRooms()
        ]);

        if (active) {
          const ws = wsRes.workshop;
          setWorkshop(ws);
          setRooms(roomsRes.rooms || []);

          // --- LOGIC TÁCH DATE VÀ TIME ---
          let datePart = '';
          let startTimePart = '';
          let endTimePart = '';

          if (ws.start_time) {
            const startD = new Date(ws.start_time);
            datePart = startD.toISOString().split('T')[0];
            startTimePart = startD.toTimeString().split(' ')[0].substring(0, 5);
          }
          if (ws.end_time) {
            const endD = new Date(ws.end_time);
            endTimePart = endD.toTimeString().split(' ')[0].substring(0, 5);
          }

          setForm({
            title: ws.title || '',
            description: ws.description || '',
            ai_summary: ws.ai_summary || '',
            speaker_name: ws.speaker_name || '',
            room_id: ws.rooms?.id || ws.room_id || '',
            date: datePart,
            time_start: startTimePart,
            time_end: endTimePart,
            price: ws.price ?? 0,
            total_seats: ws.total_seats ?? 0,
            is_free: !!ws.is_free,
            status: ws.status || 'draft',
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load workshop data');
      }
    }
    loadData();
    return () => { active = false };
  }, [id]);

  function updateField(e) {
    const { name, value, type, checked } = e.target;
    setForm((cur) => ({ ...cur, [name]: type === 'checkbox' ? checked : value }));
  }

  // --- LOGIC CẬP NHẬT TRẠNG THÁI (STATUS) ---
  async function handleUpdateStatus(nextStatus) {
    if (!window.confirm(`Are you sure you want to change status to ${nextStatus.toUpperCase()}?`)) return;
    setSaving(true);
    try {
      await updateWorkshopStatus(id, { status: nextStatus }, token);
      setMessage(`Status updated to ${nextStatus}`);
      onSaveSuccess?.();
      // Reload local state
      setForm(prev => ({ ...prev, status: nextStatus }));
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      // --- LOGIC GỘP DATE VÀ TIME TRƯỚC KHI GỬI ---
      if (!form.date || !form.time_start || !form.time_end) {
        throw new Error('Please select complete Date and Time.');
      }
      const startDateTime = new Date(`${form.date}T${form.time_start}`).toISOString();
      const endDateTime = new Date(`${form.date}T${form.time_end}`).toISOString();

      const payload = {
        title: form.title,
        description: form.description,
        ai_summary: form.ai_summary,
        speaker_name: form.speaker_name,
        room_id: form.room_id,
        start_time: startDateTime,
        end_time: endDateTime,
        price: Number(form.price) || 0,
        total_seats: Number(form.total_seats) || 0,
        is_free: !!form.is_free,
      };

      await updateWorkshop(id, payload, token);
      setMessage('Workshop updated successfully.');
      onSaveSuccess?.();
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  // (Giữ nguyên logic handleAiUpload nếu cần hoặc để trống nếu chỉ edit text)
  
  if (!workshop) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white p-8 rounded-3xl animate-pulse">Loading data...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        
        {/* Nút đóng */}
        <button onClick={onClose} className="absolute right-5 top-5 flex items-center justify-center rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* HEADER DIALOG: Rõ ràng, tách biệt */}
        <div className="mb-8 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Workshop</h2>
              <p className="text-slate-500 text-sm mt-1">ID: #{id} • Modify session details</p>
            </div>
            
            {/* CỤM NÚT STATUS: Góc trên bên phải, màu sắc nổi bật */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              {form.status === 'draft' && (
                <button 
                  type="button"
                  onClick={() => handleUpdateStatus('published')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">publish</span>
                  PUBLISH
                </button>
              )}
              {form.status === 'published' && (
                <button 
                  type="button"
                  onClick={() => handleUpdateStatus('cancelled')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  CANCEL
                </button>
              )}
              <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                form.status === 'published' ? 'text-emerald-700' : 'text-slate-500'
              }`}>
                Current: {form.status}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="block">
              <span className="block font-semibold text-slate-700 text-sm mb-1.5 ml-1">Workshop Title</span>
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all disabled:bg-slate-50"
                disabled={form.status === 'published'}
                required
              />
            </label>
            <label className="block">
              <span className="block font-semibold text-slate-700 text-sm mb-1.5 ml-1">Speaker Name</span>
              <input
                name="speaker_name"
                value={form.speaker_name}
                onChange={updateField}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="block font-semibold text-slate-700 text-sm mb-1.5 ml-1">Description</span>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={updateField} 
              rows="3" 
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all resize-none disabled:bg-slate-50"
              disabled={form.status === 'published'}
            />
          </label>

          {/* AI Section: Đồng bộ AddWorkshop */}
          <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                AI Syllabus Summary
              </span>
            </div>
            <textarea
              name="ai_summary"
              value={form.ai_summary}
              onChange={updateField}
              rows="3"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-600 outline-none transition-all resize-none"
            />
          </div>

          <label className="block">
            <span className="block font-semibold text-slate-700 text-sm mb-1.5 ml-1">Location (Room)</span>
            <select
              name="room_id"
              value={form.room_id}
              onChange={updateField}
              className="[color-scheme:light] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 outline-none cursor-pointer"
              required
            >
              <option value="" disabled>Select a room...</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name} (Capacity: {room.capacity})</option>
              ))}
            </select>
          </label>

          {/* THỜI GIAN: Tách thành 3 ô dữ liệu độc lập */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <label className="block">
              <span className="block font-semibold text-slate-700 text-sm mb-1.5 ml-1">Date</span>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={updateField}
                disabled={form.status === 'published'}
                className="[color-scheme:light] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 outline-none disabled:opacity-60"
                required
              />
            </label>
            <label className="block">
              <span className="block font-semibold text-slate-700 text-sm mb-1.5 ml-1">Start Time</span>
              <input
                name="time_start"
                type="time"
                value={form.time_start}
                onChange={updateField}
                disabled={form.status === 'published'}
                className="[color-scheme:light] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 outline-none disabled:opacity-60"
                required
              />
            </label>
            <label className="block">
              <span className="block font-semibold text-slate-700 text-sm mb-1.5 ml-1">End Time</span>
              <input
                name="time_end"
                type="time"
                value={form.time_end}
                onChange={updateField}
                disabled={form.status === 'published'}
                className="[color-scheme:light] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 outline-none disabled:opacity-60"
                required
              />
            </label>
          </div>

          {/* Price & Free Toggle */}
          <div className="flex flex-wrap items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                name="is_free"
                type="checkbox"
                checked={form.is_free}
                onChange={updateField}
                disabled={form.status === 'published'}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
              />
              <span className="font-bold text-slate-700 text-sm">Free Workshop</span>
            </label>
            
            {!form.is_free && (
              <label className="flex items-center gap-3 ml-auto">
                <span className="text-slate-600 text-sm font-semibold">Price ($)</span>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={updateField}
                  disabled={form.status === 'published'}
                  className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 outline-none"
                  min="0"
                />
              </label>
            )}
          </div>

          {/* Feedback Messages */}
          {error && <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span> {error}
          </div>}
          {message && <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span> {message}
          </div>}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg hover:bg-black disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {saving ? <span className="animate-spin material-symbols-outlined text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
              {saving ? 'Processing...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}