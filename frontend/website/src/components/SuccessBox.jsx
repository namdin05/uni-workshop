export default function SuccessBox({ message, onClose }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="text-green-600 text-xl">✓</div>
        <p className="text-green-900 font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-900 text-2xl leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
