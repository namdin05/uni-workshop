import { useState, useRef, useEffect } from 'react';
import { createWorkshop, loadSession, fetchRooms } from '../api/auth';

export default function AddWorkshopModal({ onClose, onSave }) {
  const session = loadSession();
  
  // Tách riêng date, time_start, time_end trên state để hiển thị UI độc lập
  const [form, setForm] = useState({
    title: '',
    description: '',
    ai_summary: '',
    speaker_name: '',
    room_id: '',
    date: '',        // Thêm trường ngày
    time_start: '',  // Thêm trường giờ bắt đầu
    time_end: '',    // Thêm trường giờ kết thúc
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
    
    if (name === 'room_id') {
      const roomId = value;
      const room = rooms.find((r) => String(r.id) === String(roomId));
      const capacity = typeof room?.capacity === 'number' ? room.capacity : (Number.isFinite(Number(value)) ? Number(value) : 0);
      
      setForm((cur) => ({
        ...cur,
        room_id: roomId,
        total_seats: capacity,
        available_seats: capacity,
      }));
      return;
    }

    setForm((cur) => ({
      ...cur,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  }

  const handleAiUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAiLoading(true);
    setAiStatusText('Đang tải file lên mây...');

    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      if (!session?.token) throw new Error('Not authenticated');

      const uploadRes = await fetch('http://localhost:3000/api/ai/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.error);

      setAiStatusText('AI đang đọc và tóm tắt tài liệu...');

      const pollingInterval = setInterval(async () => {
        const statusRes = await fetch(`http://localhost:3000/api/ai/status/${uploadData.jobId}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        const statusData = await statusRes.json();

        if (statusData.state === 'completed') {
          clearInterval(pollingInterval);
          setForm((cur) => ({ ...cur, ai_summary: statusData.result.summary }));
          setIsAiLoading(false);
          setAiStatusText('');
          if (fileInputRef.current) fileInputRef.current.value = '';
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

      // Xử lý gộp Ngày và Giờ thành định dạng chuẩn ISO (hoặc chuẩn datetime-local cũ)
      if (!form.date || !form.time_start || !form.time_end) {
        throw new Error('Vui lòng chọn đầy đủ ngày và giờ.');
      }

      // Chuyển đổi thành string ISO hoàn chỉnh để gửi lên server
      const startDateTime = new Date(`${form.date}T${form.time_start}`).toISOString();
      const endDateTime = new Date(`${form.date}T${form.time_end}`).toISOString();

      const payload = {
        title: form.title,
        description: form.description,
        ai_summary: form.ai_summary,
        speaker_name: form.speaker_name,
        room_id: form.room_id,
        is_free: form.is_free,
        price: form.price,
        total_seats: form.total_seats,
        available_seats: form.total_seats,
        status: form.status,
        // Gửi đi 2 biến start_time và end_time như cũ
        start_time: startDateTime,
        end_time: endDateTime,
      };

      const res = await createWorkshop(payload, session.token);
      
      // Reset form sau khi tạo thành công
      setForm({
        title: '',
        description: '',
        ai_summary: '',
        speaker_name: '',
        room_id: '',
        date: '',
        time_start: '',
        time_end: '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6" onClick={onClose}>
    
      <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex items-center justify-center rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-6">
          <h2 className="font-h2 text-h2 text-slate-900">Create New Workshop</h2>
          <p className="font-body-md text-body-md text-slate-500 mt-1">
            Add a new workshop session for students to register.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="block">
              <span className="block font-label-md text-label-md text-slate-700 mb-1.5">Workshop Title</span>
              <input
                name="title"
                value={form.title}
                onChange={updateForm}
                placeholder="e.g. Introduction to React"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                required
              />
            </label>
            <label className="block">
              <span className="block font-label-md text-label-md text-slate-700 mb-1.5">Speaker Name</span>
              <input
                name="speaker_name"
                value={form.speaker_name}
                onChange={updateForm}
                placeholder="Dr. John Doe"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="block font-label-md text-label-md text-slate-700 mb-1.5">Description</span>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={updateForm} 
              placeholder="Brief details about the workshop..." 
              rows="3" 
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors resize-none" 
            />
          </label>

          <div className="rounded-2xl bg-blue-50/50 border border-blue-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-label-md text-label-md text-blue-700 font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                AI Syllabus Summary
              </span>
              
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-700 bg-white border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isAiLoading ? 'animate-spin' : ''}`}>
                    {isAiLoading ? 'sync' : 'upload_file'}
                  </span>
                  {isAiLoading ? aiStatusText : 'Generate from PDF'}
                </button>
              </div>
            </div>

            <textarea
              name="ai_summary"
              value={form.ai_summary}
              onChange={updateForm}
              placeholder={isAiLoading ? "Vui lòng đợi, AI đang phân tích tài liệu..." : "Auto-generated summary will appear here..."}
              disabled={isAiLoading}
              rows="4"
              className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors resize-none ${
                isAiLoading ? 'bg-slate-50 border-blue-300 animate-pulse' : 'bg-white border-slate-300'
              }`}
            />
          </div>

          <label className="block">
            <span className="block font-label-md text-label-md text-slate-700 mb-1.5">Location (Room)</span>
            <select
              name="room_id"
              value={form.room_id}
              onChange={updateForm}
              className="[color-scheme:light] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer transition-colors"
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

          {/* Dòng 5: Thời gian tách biệt (Ngày, Giờ Bắt đầu, Giờ Kết thúc) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <label className="block">
              <span className="block font-label-md text-label-md text-slate-700 mb-1.5">Date</span>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={updateForm}
                className="[color-scheme:light] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                required
              />
            </label>
            <label className="block">
              <span className="block font-label-md text-label-md text-slate-700 mb-1.5">Start Time</span>
              <input
                name="time_start"
                type="time"
                value={form.time_start}
                onChange={updateForm}
                className="[color-scheme:light] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                required
              />
            </label>
            <label className="block">
              <span className="block font-label-md text-label-md text-slate-700 mb-1.5">End Time</span>
              <input
                name="time_end"
                type="time"
                value={form.time_end}
                onChange={updateForm}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                required
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                name="is_free"
                type="checkbox"
                checked={form.is_free}
                onChange={updateForm}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="font-label-md text-label-md text-slate-800 font-medium">Free Workshop</span>
            </label>
            
            {!form.is_free && (
              <label className="flex items-center gap-3 ml-auto">
                <span className="font-label-md text-label-md text-slate-700">Price ($)</span>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={updateForm}
                  className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
                  min="0"
                  step="0.01"
                />
              </label>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white font-label-md py-3 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 font-label-md py-3 px-6 text-sm font-semibold text-white disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">{loading ? 'hourglass_empty' : 'add'}</span>
              {loading ? 'Creating...' : 'Create Workshop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}