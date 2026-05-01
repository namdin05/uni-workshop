export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 ${className}`}>
      {children}
    </div>
  );
}
