export default function ErrorBox({ message, onClose }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="text-red-600 text-xl">⚠️</div>
        <p className="text-red-900 font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-600 hover:text-red-900 text-2xl leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
