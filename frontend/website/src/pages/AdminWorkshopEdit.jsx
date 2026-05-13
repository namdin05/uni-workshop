import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadSession, fetchWorkshop, updateWorkshop, updateWorkshopStatus } from '../api/auth';

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

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetchWorkshop(id);
        if (active) {
          setWorkshop(res.workshop);
          setForm({
            title: res.workshop.title || '',
            summary: res.workshop.summary || '',
            start_time: res.workshop.start_time || '',
            end_time: res.workshop.end_time || '',
            price: res.workshop.price ?? 0,
            total_seats: res.workshop.total_seats ?? 0,
            is_free: !!res.workshop.is_free,
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load workshop');
      }
    }
    load();
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
        summary: form.summary,
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
    <main className="max-w-container-max mx-auto px-8 py-12">
      <a className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md mb-8" href="/admin/workshops">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back
      </a>

      <h1 className="font-h2 text-h2 mb-4">Edit Workshop</h1>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 max-w-3xl">
        <label className="flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Title</span>
          <input name="title" value={form.title} onChange={updateField} className="input" />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Summary</span>
          <textarea name="summary" value={form.summary} onChange={updateField} className="textarea" rows={4} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Start Time</span>
            <input name="start_time" type="datetime-local" value={form.start_time ? form.start_time.replace('Z','') : ''} onChange={updateField} className="input" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">End Time</span>
            <input name="end_time" type="datetime-local" value={form.end_time ? form.end_time.replace('Z','') : ''} onChange={updateField} className="input" />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Price</span>
            <input name="price" type="number" min="0" value={form.price} onChange={updateField} className="input" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Total Seats</span>
            <input name="total_seats" type="number" min="0" value={form.total_seats} onChange={updateField} className="input" />
          </label>
          <label className="flex items-center gap-2">
            <input name="is_free" type="checkbox" checked={form.is_free} onChange={updateField} />
            <span className="font-label-sm text-label-sm text-on-surface-variant">Is free</span>
          </label>
        </div>

        {error && <div className="text-rose-700">{error}</div>}
        {message && <div className="text-emerald-700">{message}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="ui-btn ui-btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          {workshop.status === 'draft' && (
            <button type="button" onClick={handlePublish} className="ui-btn ui-btn-ghost">Publish</button>
          )}
          <button type="button" onClick={() => navigate('/admin/workshops')} className="ui-btn ui-btn-surface">Cancel</button>
        </div>
      </form>
    </main>
  );
}
