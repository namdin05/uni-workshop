export default function InputField({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder,
  error,
  disabled = false,
  className = '' 
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-xl transition-colors
          ${error 
            ? 'border-red-300 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500' 
            : 'border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}
