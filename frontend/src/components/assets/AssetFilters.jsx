import { useEffect, useState } from 'react';

export default function AssetFilters({ options, activeCategory, onCategoryChange, count }) {
  const [visible, setVisible] = useState([]);
  const [countVisible, setCountVisible] = useState(false);

  useEffect(() => {
    setVisible([]);
    setCountVisible(false);

    const timers = options.map((_, i) =>
      setTimeout(() => setVisible((v) => [...v, i]), i * 55)
    );
    const countTimer = setTimeout(
      () => setCountVisible(true),
      options.length * 55 + 80
    );

    return () => { timers.forEach(clearTimeout); clearTimeout(countTimer); };
  }, [activeCategory, options.length]);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {options.map((opt, i) => {
        const isActive = activeCategory === opt.value;
        const shown = visible.includes(i);
        const baseClasses = "px-3.5 py-1.5 rounded-md text-sm font-medium cursor-pointer border transition-colors";
        const activeClasses = "border-[#D85A30] bg-[#fff5f0] text-[#D85A30] font-semibold";
        const inactiveClasses = "border-[1.5px] border-[#e0dbd3] bg-white text-[#666] font-medium hover:border-[#D85A30] hover:bg-[#fdf9f6]";
        const visibilityClasses = shown ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2";
        return (
          <button
            key={opt.value}
            onClick={() => onCategoryChange(opt.value)}
            aria-pressed={isActive}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${visibilityClasses} duration-300`}
          >
            {opt.label}
          </button>
        );
      })}

      <span className={`ml-auto text-xs text-gray-400 font-medium transition-opacity ${countVisible ? 'opacity-100' : 'opacity-0'}`}>
        {count} result{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}