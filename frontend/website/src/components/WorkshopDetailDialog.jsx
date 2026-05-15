import QRCode from 'qrcode.react';

function formatDate(value) {
  if (!value) return 'Date TBA';
  return new Date(value).toLocaleDateString();
}

function formatTime(startTime, endTime) {
  if (!startTime) return 'Time TBA';

  const start = new Date(startTime);
  if (!endTime) {
    return start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const end = new Date(endTime);
  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function getSeatInfo(workshop) {
  const seats = workshop?.available_seats ?? workshop?.total_seats ?? 0;
  const totalSeats = workshop?.total_seats ?? seats;
  const fill = totalSeats > 0 ? Math.min(100, Math.max(0, 100 - (seats / totalSeats) * 100)) : 0;

  return {
    seats,
    totalSeats,
    fill,
    isFull: seats <= 0,
  };
}

export default function WorkshopDetailDialog({
  open,
  workshop,
  mode = 'register',
  qrValue,
  qrTitle = 'Workshop QR Code',
  statusLabel,
  statusTone = 'neutral',
  registrationStatus,
  registrationMessage,
  onClose,
  onRegister,
}) {
  if (!open || !workshop) {
    return null;
  }

  const seatInfo = getSeatInfo(workshop);
  const showQrPanel = mode === 'ticket';
  
  // Xử lý lấy url ảnh (đề phòng trường hợp API trả về room hoặc rooms)
  const roomLayoutUrl = workshop.room?.layout_image_url || workshop.rooms?.layout_image_url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workshop-detail-dialog-title"
        // Thêm flex flex-col và max-h-[90vh] để giới hạn chiều cao dialog
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-fixed via-secondary-fixed to-tertiary-fixed" />

        {/* Header - Cố định (shrink-0) */}
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-outline-variant/50 px-6 py-5 sm:px-8">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-on-primary-fixed-variant">
              <span className="material-symbols-outlined text-[16px]">school</span>
              Workshop Preview
            </span>
            <h3 id="workshop-detail-dialog-title" className="font-h2 text-h2 text-on-surface">
              {workshop.title}
            </h3>
             <p className="text-base leading-7 text-on-surface-variant line-clamp-2">
              {workshop.description || 'Details for this workshop are being updated.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ui-btn ui-btn-ghost rounded-full p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container shrink-0"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body - Có thể cuộn (overflow-y-auto) */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.5fr_0.9fr] lg:gap-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    Speaker
                  </div>
                  <div className="mt-2 font-semibold text-on-surface">{workshop.speaker_name || 'Instructor TBA'}</div>
                </div>
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    Room
                  </div>
                  <div className="mt-2 font-semibold text-on-surface">{workshop.rooms?.name || workshop.location || 'Room TBA'}</div>
                </div>
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    Date
                  </div>
                  <div className="mt-2 font-semibold text-on-surface">{formatDate(workshop.start_time)}</div>
                </div>
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    Time
                  </div>
                  <div className="mt-2 font-semibold text-on-surface">{formatTime(workshop.start_time, workshop.end_time)}</div>
                </div>
              </div>

              {/* KHU VỰC HIỂN THỊ ẢNH SƠ ĐỒ PHÒNG */}
              {roomLayoutUrl && (
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
                  <div className="border-b border-outline-variant/50 bg-surface px-4 py-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-primary">map</span>
                    Room Layout map
                  </div>
                  <div className="flex items-center justify-center bg-surface-container-lowest p-4">
                    <img 
                      src={roomLayoutUrl} 
                      alt="Room Layout" 
                      className="max-h-[250px] w-auto object-contain rounded-lg shadow-sm border border-outline-variant/30"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {workshop.ai_summary ? (
                <div className="rounded-2xl border border-primary-fixed/30 bg-primary-fixed/5 px-5 py-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    AI Syllabus Summary
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                    {workshop.ai_summary}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Sidebar Phải - Ticket/Register info */}
            <aside className="space-y-4 rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 flex flex-col h-fit sticky top-0">
              {showQrPanel ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-on-surface-variant">Ticket status</p>
                      <p className="mt-1 text-xl font-semibold text-on-surface">{statusLabel || 'Active'}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${statusTone === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : statusTone === 'danger' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'}`}>
                      QR Ready
                    </span>
                  </div>

                  {qrValue ? (
                    <div className="rounded-2xl border border-outline-variant bg-surface p-4 flex flex-col items-center">
                      <p className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-on-surface w-full">
                        <span className="material-symbols-outlined text-[18px] text-primary">qr_code_2</span>
                        {qrTitle}
                      </p>
                      <div className="flex items-center justify-center rounded-2xl border border-outline-variant bg-white p-3 shadow-sm">
                        <QRCode value={qrValue} size={160} level="H" includeMargin />
                      </div>
                      <div className="mt-4 text-center w-full">
                        <p className="text-xs text-on-surface-variant">Ticket code</p>
                        <p className="mt-1 break-all text-sm font-semibold text-on-surface">{qrValue}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-4">
                      <p className="text-sm text-on-surface-variant">Ticket code</p>
                      <p className="mt-1 break-all text-sm font-semibold text-on-surface">{qrValue || 'No code provided'}</p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-4">
                    <p className="text-sm text-on-surface-variant">Seats Remaining</p>
                    <p className="mt-1 text-2xl font-semibold text-on-surface">
                      {seatInfo.seats} / {seatInfo.totalSeats}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${seatInfo.fill}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-on-surface-variant">Seats Remaining</p>
                      <p className="mt-1 text-xl font-semibold text-on-surface">
                        {seatInfo.seats} / {seatInfo.totalSeats}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${seatInfo.isFull ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                      {seatInfo.isFull ? 'Full' : 'Active'}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${seatInfo.fill}%` }} />
                  </div>

                  <div className="rounded-2xl border border-outline-variant bg-surface px-4 py-4 mt-2">
                    <p className="text-sm text-on-surface-variant">Price</p>
                    <p className="mt-1 text-2xl font-semibold text-on-surface">
                      {workshop.is_free ? 'Free' : `$${workshop.price ?? 0}`}
                    </p>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={onRegister}
                        disabled={registrationStatus === 'loading'}
                        className="ui-btn ui-btn-primary w-full rounded-xl px-4 py-3.5 text-sm font-semibold disabled:opacity-70 flex items-center justify-center gap-2 shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">{registrationStatus === 'loading' ? 'hourglass_empty' : 'check_circle'}</span>
                        {registrationStatus === 'loading' ? 'Registering...' : 'Register Now'}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="ui-btn ui-btn-surface w-full rounded-xl px-4 py-3.5 text-sm font-semibold border border-outline-variant"
                      >
                        Close
                      </button>
                    </div>

                    {registrationMessage && (
                      <div className={`mt-4 p-3 rounded-lg text-sm text-center font-medium ${
                        registrationStatus === 'registered' || registrationStatus === 'pending_payment'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {registrationMessage}
                      </div>
                    )}
                  </div>
                </>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}