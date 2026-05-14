import { useEffect, useRef, useState } from 'react';
import { uploadCsv, fetchStudents } from '../api/auth';

export default function DataSync() {
  const [files, setFiles] = useState([]);
  const [uploadStatuses, setUploadStatuses] = useState({});
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const fileInputRef = useRef(null);

  // Fetch students list on component mount
  useEffect(() => {
    async function loadStudents() {
      try {
        setLoadingStudents(true);
        const data = await fetchStudents();
        setStudents(data.students || []);
      } catch (err) {
        console.error('Failed to load students:', err.message);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    }
    loadStudents();
  }, []);

  // Auto-upload when files are selected
  async function onFiles(e) {
    const list = Array.from(e.target.files || []);
    
    for (const file of list) {
      const fileKey = `${file.name}-${file.size}`;
      
      // Set initial status
      setUploadStatuses((prev) => ({
        ...prev,
        [fileKey]: { status: 'uploading', message: 'Uploading...' },
      }));

      try {
        const text = await file.text();
        const res = await uploadCsv(text, file.name);
        
        setUploadStatuses((prev) => ({
          ...prev,
          [fileKey]: {
            status: 'success',
            message: 'Upload successful',
          },
        }));
      } catch (err) {
        setUploadStatuses((prev) => ({
          ...prev,
          [fileKey]: {
            status: 'failed',
            message: err.message || 'Upload failed',
          },
        }));
      }
    }

    setFiles((cur) => [...cur, ...list.map((f) => ({ name: f.name, size: f.size, file: f }))]);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-gradient-to-b from-surface-container-low to-background">
      <header className="w-full px-4 sm:px-6 lg:px-8 py-6 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-sm">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-h2 text-2xl font-bold text-on-surface">Data Synchronization</h2>
            <p className="font-body-md text-sm text-on-surface-variant mt-1">
              Upload and manage student roster records via CSV.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="ui-btn ui-btn-soft flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors hover:bg-surface-container">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Template
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6">
        
        {/* Upload Section - Đã làm gọn lại */}
        <section
          className="w-full bg-gradient-to-br from-surface-container-lowest to-primary-fixed/20 border-2 border-dashed border-primary-fixed-dim rounded-xl py-8 px-4 flex flex-col items-center justify-center text-center transition-all hover:from-surface-container-low hover:to-primary-fixed/35 hover:border-primary-container cursor-pointer group"
          onClick={openFilePicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openFilePicker()}
        >
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-[28px] text-primary-container">cloud_upload</span>
          </div>
          <h3 className="font-h3 text-lg font-semibold text-on-surface mb-2">Drag & Drop CSV Files Here</h3>
          <p className="font-body-md text-sm text-on-surface-variant mb-4 max-w-md">
            Ensure your file matches the required template format for accurate syncing of student identifiers,
            names, and assigned workshops.
          </p>
          <div className="flex items-center gap-2">
            <span className="font-body-md text-sm text-outline px-3">OR</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
            className="ui-btn ui-btn-primary mt-4 px-6 py-2 rounded-lg font-medium text-sm transition-transform active:scale-95"
          >
            Browse Files
          </button>
          <p className="font-label-sm text-xs text-outline mt-3">Supported format: .CSV up to 50MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFiles}
            className="hidden"
          />
        </section>

        {/* Upload Status Section */}
        {Object.entries(uploadStatuses).length > 0 && (
          <section className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="px-5 py-3 bg-surface-container-low border-b border-outline-variant">
              <h3 className="font-semibold text-on-surface text-[16px]">Upload Status</h3>
            </div>
            <div className="flex flex-col">
              {Object.entries(uploadStatuses).map(([fileKey, { status, message }]) => (
                <div
                  key={fileKey}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-outline-variant last:border-b-0 transition-colors gap-3 ${
                    status === 'failed'
                      ? 'bg-error-container/25 border-l-4 border-l-error hover:bg-error-container/35'
                      : status === 'uploading'
                      ? 'bg-secondary-fixed/30 border-l-4 border-l-outline hover:bg-secondary-fixed/45'
                      : 'bg-emerald-50/45 border-l-4 border-l-emerald-500 hover:bg-emerald-50/70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/60">
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          status === 'failed' ? 'text-error' : status === 'uploading' ? 'text-outline' : 'text-emerald-600'
                        }`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {status === 'failed' ? 'error' : status === 'uploading' ? 'schedule' : 'check_circle'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-on-surface">{fileKey.split('-')[0]}</h4>
                      <p
                        className={`text-xs mt-1 ${
                          status === 'failed' ? 'text-error' : 'text-on-surface-variant'
                        }`}
                      >
                        {message}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap self-start sm:self-auto ${
                      status === 'failed'
                        ? 'bg-error-container text-on-error-container border-error/40'
                        : status === 'uploading'
                        ? 'bg-secondary-fixed text-on-secondary-fixed-variant border-outline'
                        : 'bg-primary-fixed text-on-primary-fixed-variant border-primary-fixed-dim'
                    }`}
                  >
                    {status === 'uploading' ? 'Uploading' : status === 'success' ? 'Success' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Students Table Section - Đã Fix Padding */}
        <section className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface">groups</span>
              <h3 className="font-semibold text-on-surface text-[16px]">
                System Students
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-primary-fixed/40 text-on-primary-container text-xs font-semibold">
                {students.length}
              </span>
            </div>
          </div>
          
          {loadingStudents ? (
            <div className="px-4 py-12 text-center">
              <div className="inline-block">
                <div className="w-10 h-10 border-4 border-outline-variant border-t-primary rounded-full animate-spin mb-3 mx-auto"></div>
                <p className="text-sm text-on-surface-variant">Loading students...</p>
              </div>
            </div>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant">
                    <th className="px-5 py-3 font-semibold text-on-surface-variant">#</th>
                    <th className="px-5 py-3 font-semibold text-on-surface-variant">Full Name</th>
                    <th className="px-5 py-3 font-semibold text-on-surface-variant">Student ID</th>
                    <th className="px-5 py-3 font-semibold text-on-surface-variant">Email</th>
                    <th className="px-5 py-3 font-semibold text-center text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    return (
                      <tr
                        key={student.id}
                        className={`border-b border-outline-variant transition-colors ${
                          index % 2 === 0
                            ? 'bg-surface-container-lowest hover:bg-surface-container-low/80'
                            : 'bg-surface-container-low/40 hover:bg-surface-container-low/60'
                        }`}
                      >
                        <td className="px-5 py-4 text-on-surface-variant">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-5 py-4 text-on-surface font-medium">
                          <div className="flex items-center gap-3">
                            <span className="truncate">{student.full_name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant">
                          <span className="inline-block px-2 py-1 rounded-md bg-secondary-fixed/30 border border-secondary-fixed-dim font-mono text-xs">
                            {student.student_id || 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant truncate max-w-[200px]">
                          {student.email || '-'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary-fixed/30 text-on-primary-container border border-primary-fixed-dim">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-16 text-center">
              <div className="inline-block">
                <div className="w-16 h-16 rounded-full bg-secondary-fixed/20 flex items-center justify-center mb-4 mx-auto">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                    person_outline
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant">
                  No students found in the system.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}