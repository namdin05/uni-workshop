import { useEffect, useState } from 'react';
import { loadSession, updateRoom, uploadRoomLayoutImage } from '../api/auth';

export default function EditRoomModal({ room, onClose, onSaved }) {
  const session = loadSession();

  const [form, setForm] = useState({
    name: room?.name || '',
    capacity: room?.capacity ?? 0,
    layout_image_url: room?.layout_image_url || '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(room?.layout_image_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      name: room?.name || '',
      capacity: room?.capacity ?? 0,
      layout_image_url: room?.layout_image_url || '',
    });
    setSelectedFile(null);
    setPreviewSrc(room?.layout_image_url || '');
    setError('');
  }, [room]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewSrc(room?.layout_image_url || '');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewSrc(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile, room]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'capacity' ? Number(value) : value,
    }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (!session?.token) {
        throw new Error('Phiên đăng nhập không hợp lệ');
      }

      if (!form.name.trim()) {
        throw new Error('Tên phòng không được để trống');
      }

      if (!Number.isFinite(form.capacity) || form.capacity <= 0) {
        throw new Error('Sức chứa phải lớn hơn 0');
      }

      let layoutImageUrl = form.layout_image_url || '';

      if (selectedFile) {
        const uploadResult = await uploadRoomLayoutImage(room.id, selectedFile, session.token);
        layoutImageUrl = uploadResult.layout_image_url || '';
      }

      const response = await updateRoom(room.id, {
        name: form.name.trim(),
        capacity: Number(form.capacity),
        layout_image_url: layoutImageUrl,
      }, session.token);

      onSaved?.(response.room);
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể lưu phòng');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex items-center justify-center rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Rooms</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Edit Room</h2>
            <p className="mt-1 text-sm text-slate-500">Cập nhật tên, sức chứa và ảnh layout của phòng.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">Room name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#003366]"
                placeholder="Room A101"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">Capacity</span>
              <input
                name="capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#003366]"
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="h-28 w-full overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-44">
                {previewSrc ? (
                  <img src={previewSrc} alt={form.name || 'Room layout'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Layout image</p>
                  <p className="mt-1 text-xs text-slate-500">Ảnh sẽ được upload lên Supabase Storage rồi lưu URL vào cột layout_image_url.</p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  <span>{selectedFile ? selectedFile.name : 'Choose image'}</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#01274d] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}