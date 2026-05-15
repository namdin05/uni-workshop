import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadSession, fetchWorkshop, updateWorkshop, updateWorkshopStatus, fetchRooms } from '../api/auth';

export default function AdminWorkshopEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = loadSession();
  const token = session?.token;

  const [workshop, setWorkshop] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchWorkshop(id);
        if (active) {
          setWorkshop(res.workshop);
          setForm({
            title: res.workshop.title || '',
            description: res.workshop.description || '',
            ai_summary: res.workshop.ai_summary || '',
            speaker_name: res.workshop.speaker_name || '',
            room_id: res.workshop.rooms?.id || res.workshop.room_id || '',
            start_time: res.workshop.start_time || '',
            end_time: res.workshop.end_time || '',
            price: res.workshop.price ?? 0,
            total_seats: res.workshop.total_seats ?? 0,
            is_free: !!res.workshop.is_free,
            status: res.workshop.status || 'draft',
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load workshop');
      }
    }
    load();
    // load rooms for selection
    (async () => {
      try {
        const r = await fetchRooms();
        if (active) setRooms(r.rooms || []);
      } catch (e) {
        console.warn('Failed to load rooms', e);
      }
    })();
    return () => { active = false };
  }, [id]);

  function updateField(e) {
    const { name, value, type, checked } = e.target;
    setForm((cur) => ({ ...cur, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        ai_summary: form.ai_summary,
        speaker_name: form.speaker_name,
        room_id: form.room_id,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        price: Number(form.price) || 0,
        total_seats: Number(form.total_seats) || 0,
        is_free: !!form.is_free,
      };

      const res = await updateWorkshop(id, payload, token);
      setMessage('Workshop saved successfully.');
      setWorkshop(res.workshop || null);
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(nextStatus) {
    setError('');
    setMessage('');
    try {
      const res = await updateWorkshopStatus(id, { status: nextStatus }, token);
      setMessage(res.message || 'Status updated');
      // refresh
      const refreshed = await fetchWorkshop(id);
      setWorkshop(refreshed.workshop || null);
      setForm((cur) => ({ ...cur, status: refreshed.workshop?.status || cur.status }));
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  }

  async function handlePublish() {
    setError('');
    setMessage('');
    if (!form.start_time) {
      setError('Start time is required before publishing.');
      return;
    }

    const start = new Date(form.start_time);
    const now = new Date();
    if (start <= now) {
      setError('Cannot publish a workshop that starts in the past. Adjust start time before publishing.');
      return;
    }

    try {
      await updateWorkshopStatus(id, { status: 'published' }, token);
      setMessage('Workshop published. Cache prewarm triggered.');
      navigate('/admin/workshops');
    } catch (err) {
      setError(err.message || 'Failed to publish');
    }
  }

  if (!workshop) return <div className="p-8">Loading workshop…</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation" onClick={() => navigate('/admin/workshops')}>
      <div className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="admin-workshop-edit-title" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => navigate('/admin/workshops')}
          className="absolute right-4 top-4 rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
          aria-label="Close edit dialog"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h1 id="admin-workshop-edit-title" className="font-h2 text-h2 mb-4">Edit Workshop</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <label className="flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Title</span>
              <input name="title" value={form.title} onChange={updateField} className="input" disabled={workshop.status === 'published'} />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Description</span>
              <textarea name="description" value={form.description} onChange={updateField} className="textarea" rows={4} disabled={workshop.status === 'published'} />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant">AI Summary</span>
              <textarea name="ai_summary" value={form.ai_summary} onChange={updateField} className="textarea" rows={4} />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Speaker</span>
                <input name="speaker_name" value={form.speaker_name} onChange={updateField} className="input" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Room</span>
                <select name="room_id" value={form.room_id} onChange={updateField} className="input">
                  <option value="">Select a room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} (Capacity: {r.capacity})</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Start Time</span>
                <input name="start_time" type="datetime-local" value={form.start_time ? form.start_time.replace('Z','') : ''} onChange={updateField} className="input" disabled={workshop.status === 'published'} />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">End Time</span>
                <input name="end_time" type="datetime-local" value={form.end_time ? form.end_time.replace('Z','') : ''} onChange={updateField} className="input" disabled={workshop.status === 'published'} />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <label className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Price</span>
                <input name="price" type="number" min="0" value={form.price} onChange={updateField} className="input" disabled={workshop.status === 'published'} />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Total Seats</span>
                <input name="total_seats" type="number" min="0" value={form.total_seats} onChange={updateField} className="input" disabled={workshop.status === 'published'} />
              </label>
              <label className="flex items-center gap-2">
                <input name="is_free" type="checkbox" checked={form.is_free} onChange={updateField} disabled={workshop.status === 'published'} />
                <span className="font-label-sm text-label-sm text-on-surface-variant">Is free</span>
              </label>
            </div>
          </div>

          {error && <div className="text-rose-700">{error}</div>}
          {message && <div className="text-emerald-700">{message}</div>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || workshop.status === 'published'} className="ui-btn ui-btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            {workshop.status === 'draft' && (
              <button type="button" onClick={() => handleUpdateStatus('published')} className="ui-btn ui-btn-ghost">Publish</button>
            )}
            <button type="button" onClick={() => navigate('/admin/workshops')} className="ui-btn ui-btn-surface">Back</button>
          </div>
          </form>

          <aside className="space-y-6">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
            <p className="text-sm text-on-surface-variant">Status</p>
            <p className="mt-1 font-semibold text-on-surface">{workshop.status}</p>
            {workshop.status === 'in_progress' && (
              <div className="mt-4 flex gap-3">
                <button className="ui-btn ui-btn-primary" onClick={() => handleUpdateStatus('published')}>Make Public</button>
                <button className="ui-btn ui-btn-surface" onClick={() => handleUpdateStatus('cancelled')}>Cancel Workshop</button>
              </div>
            )}
            {workshop.status === 'published' && (
              <p className="mt-3 text-sm text-on-surface-variant">This workshop is published and status cannot be edited.</p>
            )}
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
            <p className="text-sm text-on-surface-variant">Room</p>
            <p className="mt-1 font-semibold text-on-surface">{workshop.rooms?.name || workshop.location || 'TBA'}</p>
            <p className="text-sm text-on-surface-variant mt-2">Seats: {workshop.total_seats ?? 'N/A'} — Available: {workshop.available_seats ?? 'N/A'}</p>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
            <p className="text-sm text-on-surface-variant">AI Summary</p>
            <p className="mt-2 text-sm text-on-surface-variant">{workshop.ai_summary || 'No AI summary available'}</p>
          </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
