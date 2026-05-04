import { useState } from 'react';
import { createWorkshop, loadSession } from '../lib/auth';

export default function AddWorkshopModal({ onClose, onSave }) {
  const session = loadSession();
  const [form, setForm] = useState({
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateForm(e) {
    const { name, value, type, checked } = e.target;
    setForm((cur) => ({
      ...cur,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  }

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
      <div className="relative w-full max-w-2xl rounded-xl bg-surface p-8 shadow-lg" onClick={(e) => e.stopPropagation()}>
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

          <label>
            <span className="block font-label-md text-label-md text-on-surface">Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={updateForm}
              placeholder="Workshop description and objectives..."
              rows="3"
              className="mt-xs w-full rounded-lg border border-outline px-sm py-sm font-body-md text-on-surface placeholder-on-surface-variant/70 focus:border-primary focus:outline-none"
            />
          </label>

          <label>
            <span className="block font-label-md text-label-md text-on-surface">Location</span>
            <input
              name="location"
              value={form.location}
              onChange={updateForm}
              placeholder="e.g. Room 402"
              className="mt-xs w-full rounded-lg border border-outline px-sm py-sm font-body-md text-on-surface placeholder-on-surface-variant/70 focus:border-primary focus:outline-none"
            />
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
