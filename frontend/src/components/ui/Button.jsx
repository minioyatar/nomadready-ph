// Placeholder — implemented in feature/dashboard-overview
export default function Button({ children, onClick, disabled = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded font-medium text-sm disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
