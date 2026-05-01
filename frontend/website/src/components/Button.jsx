export function PrimaryButton({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  className = '' 
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-medium 
        hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed 
        transition-colors ${className}`}
    >
      {loading ? 'Đang xử lý...' : children}
    </button>
  );
}

export function SecondaryButton({ 
  children, 
  onClick, 
  disabled = false,
  className = '' 
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-900 font-medium 
        hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed 
        transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
