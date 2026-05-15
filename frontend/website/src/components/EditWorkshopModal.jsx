import { useState, useEffect, useRef } from 'react';
import { loadSession, fetchWorkshop, updateWorkshop, updateWorkshopStatus, fetchRooms } from '../api/auth';

export default function EditWorkshopModal({ id, onClose, onSaveSuccess }) {
  const session = loadSession();
  const token = session?.token;

  const [workshop, setWorkshop] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    ai_summary: '',
    speaker_name: '',
    room_id: '',
    date: '',        
    time_start: '',  
    time_end: '',    
    is_free: false,
    price: 0,
    total_seats: 0,
    status: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rooms, setRooms] = useState([]);

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

          let datePart = '';
          let startTimePart = '';
          let endTimePart = '';

          if (ws.start_time) {
            const startD = new Date(ws.start_time);
            // Lấy YYYY-MM-DD
            datePart = startD.toISOString().split('T')[0];
            // Lấy HH:mm (bỏ giây)
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

  async function handleUpdateStatus(nextStatus) {
    if (!form.date || !form.time_start) {
      setError('Vui lòng chọn ngày và giờ bắt đầu trước khi thay đổi trạng thái.');
      return;
    }

    const startObj = new Date(`${form.date}T${form.time_start}`);
    const now = new Date();
    const diffHours = (startObj - now) / (1000 * 60 * 60);

    // 1. Xác định nội dung thông báo xác nhận
    let confirmMsg = `Bạn có chắc muốn chuyển trạng thái thành ${nextStatus.toUpperCase()}?`;
    if (nextStatus === 'cancelled') {
      if (form.status === 'draft') {
        confirmMsg = "Bạn có chắc chắn muốn XÓA bản nháp này không? Thao tác này không thể hoàn tác.";
      } else {
        confirmMsg = "Bạn có chắc chắn muốn HỦY Workshop này không?";
      }
    }

    // 2. Kiểm tra điều kiện 48h để Publish
    if (nextStatus === 'published' && diffHours < 48) {
      setError("Không thể Publish! Thời gian bắt đầu phải sau hiện tại ít nhất 48 giờ.");
      return;
    }

    // 3. Kiểm tra điều kiện 24h để Cancel/Delete
    if (nextStatus === 'cancelled' && diffHours < 24) {
      setError("Không thể thao tác! Chỉ được phép Hủy/Xóa trước khi bắt đầu ít nhất 24 giờ.");
      return;
    }

    if (!window.confirm(confirmMsg)) return;
    
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await updateWorkshopStatus(id, { status: nextStatus }, token);
      
      // Nếu là thao tác Xóa bản nháp (draft -> cancelled)
      // Lúc này database trigger đã tự xóa, nên ta báo thành công và đóng modal luôn
      if (form.status === 'draft' && nextStatus === 'cancelled') {
        onSaveSuccess?.();
        onClose();
        return;
      }

      // Các trạng thái khác thì hiển thị thông báo và cập nhật UI
      setMessage(`Trạng thái đã được cập nhật thành ${nextStatus}`);
      onSaveSuccess?.();
      setForm(prev => ({ ...prev, status: nextStatus }));
    } catch (err) {
      setError(err.message || 'Cập nhật trạng thái thất bại');
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
      if (!form.date || !form.time_start || !form.time_end) {
        throw new Error('Vui lòng chọn đầy đủ ngày và giờ.');
      }

      const startObj = new Date(`${form.date}T${form.time_start}`);
      const endObj = new Date(`${form.date}T${form.time_end}`);
      const now = new Date();

      if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
        throw new Error('Ngày hoặc giờ không hợp lệ.');
      }

      if (startObj >= endObj) {
        throw new Error('Giờ bắt đầu phải trước giờ kết thúc.');
      }

      // Ràng buộc bổ sung: Nếu đang ở trạng thái published và admin sửa lại giờ
      // Giờ mới vẫn phải cách hiện tại 48h
      if (form.status === 'published') {
        const diffHours = (startObj - now) / (1000 * 60 * 60);
        if (diffHours < 48) {
          throw new Error("Workshop đang 'published', thời gian bắt đầu mới phải sau hiện tại ít nhất 48 giờ.");
        }
      }

      const startDateTime = startObj.toISOString();
      const endDateTime = endObj.toISOString();

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
      setMessage('Lưu thay đổi thành công.');
      onSaveSuccess?.();
    } catch (err) {
      setError(err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  if (!workshop) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white p-8 rounded-3xl animate-pulse">Đang tải dữ liệu...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        
        {/* Nút Đóng */}
        <button onClick={onClose} className="absolute right-5 top-5 flex items-center justify-center rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Header Dialog */}
        <div className="mb-8 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Workshop</h2>
              <p className="text-slate-500 text-sm mt-1">ID: #{id} • Trạng thái: <span className="uppercase font-bold text-blue-600">{form.status}</span></p>
            </div>
            
            {/* Cụm Nút Đổi Trạng Thái */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              {form.status === 'draft' && (
                <>
                  <button 
                    type="button" 
                    onClick={() => handleUpdateStatus('published')} 
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">publish</span> PUBLISH
                  </button>
                  {/* Nút DELETE dành riêng cho bản nháp */}
                  <button 
                    type="button" 
                    onClick={() => handleUpdateStatus('cancelled')} 
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span> DELETE
                  </button>
                </>
              )}
              {form.status === 'published' && (
                <button 
                  type="button" 
                  onClick={() => handleUpdateStatus('cancelled')} 
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-sm hover:bg-amber-600 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span> CANCEL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form chính */}
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="block">
              <span className="block font-semibold text-slate-700 text-sm mb-1.5 ml-1">Workshop Title</span>
              <input 
                name="title" 
                value={form.title} 
                onChange={updateField} 
                disabled={form.status === 'published'} 
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500" 
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
              disabled={form.status === 'published'} 
              rows="3" 
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all resize-none disabled:bg-slate-50 disabled:text-slate-500" 
            />
          </label>

          {/* Block AI Summary (chỉ cho phép edit text nếu cần) */}
          <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-5">
             <span className="text-blue-700 font-bold text-sm flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span> AI Syllabus Summary
              </span>
            <textarea 
              name="ai_summary" 
              value={form.ai_summary} 
              onChange={updateField} 
              rows="3" 
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all resize-none" 
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
                <option key={room.id} value={room.id}>
                  {room.name} (Capacity: {room.capacity})
                </option>
              ))}
            </select>
          </label>

          {/* Dòng Ngày/Giờ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <label className="block">
              <span className="block font-semibold text-slate-700 text-sm mb-1.5 ml-1">Date</span>
              <input 
                name="date" 
                type="date" 
                value={form.date} 
                onChange={updateField} 
                disabled={form.status === 'published'} 
                className="[color-scheme:light] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 outline-none disabled:bg-slate-50 disabled:text-slate-500" 
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
                className="[color-scheme:light] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 outline-none disabled:bg-slate-50 disabled:text-slate-500" 
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
                className="[color-scheme:light] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 outline-none disabled:bg-slate-50 disabled:text-slate-500" 
                required 
              />
            </label>
          </div>

          {/* Is Free & Price */}
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
                  className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 outline-none disabled:bg-slate-50 disabled:text-slate-500" 
                  min="0" 
                />
              </label>
            )}
          </div>

          {/* Khối thông báo Lỗi / Thành công */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span> {error}
            </div>
          )}
          {message && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span> {message}
            </div>
          )}

          {/* Block nút submit / cancel */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg hover:bg-black disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {saving ? (
                <span className="animate-spin material-symbols-outlined text-[18px]">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              {saving ? 'Processing...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}