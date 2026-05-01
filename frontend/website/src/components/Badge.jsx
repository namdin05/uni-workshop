export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-900',
    success: 'bg-green-100 text-green-900',
    warning: 'bg-yellow-100 text-yellow-900',
    error: 'bg-red-100 text-red-900',
    info: 'bg-blue-100 text-blue-900',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs tracking-wide font-bold uppercase ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
