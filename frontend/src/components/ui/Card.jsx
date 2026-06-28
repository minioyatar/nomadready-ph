// Placeholder — implemented in feature/dashboard-overview
// Updated Card to forward any additional props (e.g., style) to the wrapper div.
export default function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
