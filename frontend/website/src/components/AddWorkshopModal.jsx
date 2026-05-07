import { useState, useRef, useEffect } from 'react';
import { createWorkshop, loadSession, fetchRooms } from '../lib/auth';

export default function AddWorkshopModal({ onClose, onSave }) {
  const session = loadSession();
  const [form, setForm] = useState({
    title: '',
    description: '',
    ai_summary: '',
    speaker_name: '',
    room_id: '',
    start_time: '',
    end_time: '',
    is_free: true,
    price: 0,
    total_seats: 40,
    status: 'draft',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState([]);

  // === STATE CHO AI SUMMARY ===
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusText, setAiStatusText] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function loadRooms() {
      try {
        const res = await fetchRooms();
        if (active) setRooms(res.rooms || []);
      } catch (err) {
        console.error('Không tải được danh sách phòng:', err);
      }
    }
    loadRooms();
    return () => { active = false; };
  }, []);

  function updateForm(e) {
    const { name, value, type, checked } = e.target;
    setForm((cur) => ({
      ...cur,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  }

  // === HÀM XỬ LÝ UPLOAD PDF & GỌI AI ===
  const handleAiUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAiLoading(true);
    setAiStatusText('Đang tải file lên mây...');

    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      if (!session?.token) throw new Error('Not authenticated');

      // 1. Upload file lấy JobID
      const uploadRes = await fetch('http://localhost:5000/api/ai/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error);

      setAiStatusText('AI đang đọc và tóm tắt tài liệu...');

      // 2. Liên tục kiểm tra trạng thái (Polling)
      const pollingInterval = setInterval(async () => {
        const statusRes = await fetch(`http://localhost:5000/api/ai/status/${uploadData.jobId}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        const statusData = await statusRes.json();

        if (statusData.state === 'completed') {
          clearInterval(pollingInterval);
          
          // Đổ dữ liệu AI trả về vào state form.ai_summary
          setForm((cur) => ({ ...cur, ai_summary: statusData.result.summary }));
          
          setIsAiLoading(false);
          setAiStatusText('');
          if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        } else if (statusData.state === 'failed') {
          clearInterval(pollingInterval);
          setIsAiLoading(false);
          setAiStatusText('');
          alert('Có lỗi xảy ra khi AI xử lý tài liệu!');
        }
      }, 2000);

    } catch (err) {
      console.error('Lỗi upload AI:', err);
      setIsAiLoading(false);
      setAiStatusText('');
      alert('Không thể kết nối với AI Server');
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!session?.token) {
        throw new Error('Not authenticated');
      }

      const payload = {
        ...form,
        available_seats: form.total_seats,
      };

      const res = await createWorkshop(payload, session.token);
      setForm({
        title: '',
        description: '',
        speaker_name: '',
        location: '',
        start_time: '',
        end_time: '',
        is_free: true,
        price: 0,
        total_seats: 40,
        status: 'draft',
      });
      onSave?.(res.workshop);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create workshop');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-xl bg-white bg-surface p-8 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="ui-btn ui-btn-ghost absolute right-4 top-4 text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-lg"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="font-h2 text-h2 text-on-surface">Create New Workshop</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Add a new workshop session for students to register.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-md">
          <div className="grid gap-md sm:grid-cols-2">
            <label>
              <span className="block font-label-md text-label-md text-on-surface">Workshop Title</span>
              <input
                name="title"
                value={form.title}
                onChange={updateForm}
                placeholder="e.g. Introduction to React"
                className="mt-xs w-full rounded-lg border border-outline px-sm py-sm font-body-md text-on-surface placeholder-on-surface-variant/70 focus:border-primary focus:outline-none"
                required
              />
            </label>
            <label>
              <span className="block font-label-md text-label-md text-on-surface">Speaker Name</span>
              <input
                name="speaker_name"
                value={form.speaker_name}
                onChange={updateForm}
                placeholder="Dr. John Doe"
                className="mt-xs w-full rounded-lg border border-outline px-sm py-sm font-body-md text-on-surface placeholder-on-surface-variant/70 focus:border-primary focus:outline-none"
                required
              />
            </label>
          </div>

          <label className="block mt-4">
            <span className="block font-label-md text-label-md text-on-surface">Description</span>
            <textarea name="description" value={form.description} onChange={updateForm} placeholder="Brief details about the workshop..." rows="2" className="mt-xs w-full rounded-lg border border-outline px-sm py-sm font-body-md text-on-surface placeholder-on-surface-variant/70 focus:border-primary focus:outline-none" />
          </label>

          {/* === KHU VỰC DESCRIPTION & NÚT AI === */}
          <div className="flex flex-col gap-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface">AI Summary</span>
              
              <div>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  ref={fileInputRef} 
                  onChange={handleAiUpload} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAiLoading}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium text-primary hover:bg-primary-fixed/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-primary/20"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isAiLoading ? 'sync' : 'auto_awesome'}
                  </span>
                  {isAiLoading ? aiStatusText : 'Tóm tắt bằng AI (PDF)'}
                </button>
              </div>
            </div>

            <textarea
              name="ai_summary"
              value={form.ai_summary}
              onChange={updateForm}
              placeholder={isAiLoading ? "Vui lòng đợi, AI đang phân tích tài liệu..." : "Workshop description and objectives..."}
              disabled={isAiLoading}
              rows="4"
              className={`mt-xs w-full rounded-lg border px-sm py-sm font-body-md text-on-surface placeholder-on-surface-variant/70 focus:border-primary focus:outline-none transition-colors ${isAiLoading ? 'bg-surface-container border-primary-fixed-dim animate-pulse' : 'border-outline'}`}
            />
          </div>

          <label className="block mt-4">
            <span className="block font-label-md text-label-md text-on-surface">Location</span>
            <select
              name="room_id"
              value={form.room_id}
              onChange={updateForm}
              className="mt-xs w-full rounded-lg border border-outline px-sm py-sm font-body-md text-on-surface bg-white focus:border-primary focus:outline-none"
              required
            >
              <option value="" disabled>Select a room...</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} (Capacity: {room.capacity} people)
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-md sm:grid-cols-2">
            <label>
              <span className="block font-label-md text-label-md text-on-surface">Start Time</span>
              <input
                name="start_time"
                type="datetime-local"
                value={form.start_time}
                onChange={updateForm}
                className="mt-xs w-full rounded-lg border border-outline px-sm py-sm font-body-md text-on-surface focus:border-primary focus:outline-none"
                required
              />
            </label>
            <label>
              <span className="block font-label-md text-label-md text-on-surface">End Time</span>
              <input
                name="end_time"
                type="datetime-local"
                value={form.end_time}
                onChange={updateForm}
                className="mt-xs w-full rounded-lg border border-outline px-sm py-sm font-body-md text-on-surface focus:border-primary focus:outline-none"
                required
              />
            </label>
          </div>

          <div className="grid gap-md sm:grid-cols-3">
            <label>
              <span className="block font-label-md text-label-md text-on-surface">Total Seats</span>
              <input
                name="total_seats"
                type="number"
                value={form.total_seats}
                onChange={updateForm}
                className="mt-xs w-full rounded-lg border border-outline px-sm py-sm font-body-md text-on-surface focus:border-primary focus:outline-none"
                min="1"
              />
            </label>
            <label className="flex items-end gap-sm py-sm">
              <div className="flex items-center">
                <input
                  name="is_free"
                  type="checkbox"
                  checked={form.is_free}
                  onChange={updateForm}
                  className="w-4 h-4 rounded border-outline"
                />
              </div>
              <span className="font-label-md text-label-md text-on-surface">Free</span>
            </label>
            {!form.is_free && (
              <label>
                <span className="block font-label-md text-label-md text-on-surface">Price ($)</span>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={updateForm}
                  className="mt-xs w-full rounded-lg border border-outline px-sm py-sm font-body-md text-on-surface focus:border-primary focus:outline-none"
                  min="0"
                  step="0.01"
                />
              </label>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-error/30 bg-error-container/20 p-md text-label-md text-error">
              <span className="material-symbols-outlined text-sm mr-2 inline">error</span>
              {error}
            </div>
          )}

          <div className="flex gap-md pt-md border-t border-surface-variant">
            <button
              type="button"
              onClick={onClose}
              className="ui-btn ui-btn-surface flex-1 rounded-lg font-label-md py-sm px-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ui-btn ui-btn-primary flex-1 rounded-lg font-label-md py-sm px-md disabled:opacity-70 flex items-center justify-center gap-xs"
            >
              <span className="material-symbols-outlined text-sm">{loading ? 'hourglass_empty' : 'add'}</span>
              {loading ? 'Creating...' : 'Create Workshop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
