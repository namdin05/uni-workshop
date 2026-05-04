import { useRef, useState } from 'react';
import { uploadCsv } from '../lib/auth';

const DEMO_LOGS = [
  {
    name: 'roster_engineering_101.csv',
    detail: 'Successfully synced 142 student records. No anomalies detected.',
    time: 'Today, 10:45 AM',
    status: 'Success',
    tone: 'success',
  },
  {
    name: 'late_enrollment_batch_b.csv',
    detail: "Failed to parse. Invalid date format in column 'EnrollmentDate' at row 34.",
    time: 'Today, 09:12 AM',
    status: 'Failed',
    tone: 'error',
  },
  {
    name: 'faculty_updates_q3.csv',
    detail: 'Successfully synced 18 instructor records.',
    time: 'Yesterday, 16:30 PM',
    status: 'Success',
    tone: 'success',
  },
];

export default function DataSync() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  function onFiles(e) {
    const list = Array.from(e.target.files || []);
    setFiles((cur) => [...cur, ...list.map((f) => ({ name: f.name, size: f.size, file: f }))]);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleUpload() {
    if (!files.length) return setMessage('No files selected');
    const f = files[0];
    const text = await f.file.text();
    try {
      const res = await uploadCsv(text);
      setMessage(res.message || 'Uploaded');
    } catch (err) {
      setMessage(err.message || 'Upload failed');
    }
  }

  const logs = files.length
    ? files.map((file) => ({
        name: file.name,
        detail: `Queued for processing — size ${file.size} bytes`,
        time: 'Just now',
        status: 'Queued',
        tone: 'queued',
      }))
    : DEMO_LOGS;

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-gradient-to-b from-surface-container-low to-background">
      <header className="w-full px-4 sm:px-6 lg:px-8 py-6 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-sm">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-h2 text-h2 text-on-surface">Data Synchronization</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Upload and manage student roster records via CSV.
            </p>
          </div>
          <div className="flex items-center gap-sm">
            <button className="ui-btn ui-btn-soft flex items-center gap-xs px-md py-sm rounded-lg font-label-md text-label-md">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              Template
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6">
        <section
          className="w-full bg-gradient-to-br from-surface-container-lowest to-primary-fixed/20 border-2 border-dashed border-primary-fixed-dim rounded-xl p-xl flex flex-col items-center justify-center text-center transition-all hover:from-surface-container-low hover:to-primary-fixed/35 hover:border-primary-container cursor-pointer group"
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openFilePicker()}
        >
          <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mb-sm group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-[32px] text-primary-container">cloud_upload</span>
          </div>
          <h3 className="font-h3 text-h3 text-on-surface mb-xs">Drag & Drop CSV Files Here</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-md max-w-md">
            Ensure your file matches the required template format for accurate syncing of student identifiers,
            names, and assigned workshops.
          </p>
          <div className="flex items-center gap-sm">
            <span className="font-body-md text-sm text-outline px-sm">OR</span>
          </div>
          <button
            type="button"
            onClick={openFilePicker}
            className="ui-btn ui-btn-primary mt-md px-lg py-sm rounded-lg font-label-md text-label-md"
          >
            Browse Files
          </button>
          <p className="font-label-sm text-label-sm text-outline mt-sm">Supported format: .CSV up to 50MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFiles}
            className="hidden"
          />
          {message && <div className="mt-sm text-sm text-on-surface-variant">{message}</div>}
        </section>

        <section className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-md py-sm bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
            <h3 className="font-h3 text-h3 text-on-surface text-[18px]">Recent Sync Activity</h3>
            <button className="ui-btn ui-btn-ghost flex items-center gap-xs text-on-surface-variant hover:text-primary-container transition-colors font-label-sm text-label-sm px-3 py-2 rounded-lg">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_list</span>
              Filter
            </button>
          </div>
          <div className="flex flex-col">
            {logs.map((log) => (
              <div
                key={`${log.name}-${log.time}`}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-md border-b border-outline-variant last:border-b-0 transition-colors gap-sm ${
                  log.tone === 'error'
                    ? 'bg-error-container/25 border-l-4 border-l-error hover:bg-error-container/35'
                    : log.tone === 'queued'
                    ? 'bg-secondary-fixed/30 border-l-4 border-l-outline hover:bg-secondary-fixed/45'
                    : 'bg-emerald-50/45 border-l-4 border-l-emerald-500 hover:bg-emerald-50/70'
                }`}
              >
                <div className="flex items-start gap-md">
                  <div className="mt-xs p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/60">
                    <span
                      className={`material-symbols-outlined ${
                        log.tone === 'error' ? 'text-error' : log.tone === 'queued' ? 'text-outline' : 'text-emerald-600'
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {log.tone === 'error' ? 'error' : log.tone === 'queued' ? 'schedule' : 'check_circle'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface">{log.name}</h4>
                    <p className={`font-body-md text-sm mt-xs ${log.tone === 'error' ? 'text-error' : 'text-on-surface-variant'}`}>
                      {log.detail}
                    </p>
                    {log.tone === 'error' && (
                      <button className="ui-btn ui-btn-ghost text-error font-label-sm text-label-sm mt-xs px-0 py-0 hover:bg-transparent hover:underline">
                        View Error Details
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-xs w-full sm:w-auto">
                  <span className="font-label-sm text-label-sm text-outline">{log.time}</span>
                  <span
                    className={`px-sm py-xs rounded-full font-label-sm text-label-sm border ${
                      log.tone === 'error'
                        ? 'bg-error-container text-on-error-container border-error/40'
                        : log.tone === 'queued'
                        ? 'bg-secondary-fixed text-on-secondary-fixed-variant border-outline'
                        : 'bg-primary-fixed text-on-primary-fixed-variant border-primary-fixed-dim'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            className="ui-btn ui-btn-primary px-lg py-sm rounded-lg font-label-md text-label-md"
          >
            Sync Now
          </button>
        </div>
      </div>
    </main>
  );
}
