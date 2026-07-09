<<<<<<< HEAD
<<<<<<< HEAD

=======
import React, { useRef, useEffect } from 'react';
import { CATEGORY_PALETTE } from '../../lib/categoryPalette';

const CATEGORIES = CATEGORY_PALETTE;
>>>>>>> 0359ab0 (feat: Refactor AssetMap and MapLegend to use CATEGORY_PALETTE and improve listing validation in MapView)
=======
>>>>>>> 4a6a039a118a49ff259ff40c167222122c6a839f

import React, { useRef, useEffect, useMemo } from 'react';
import { CATEGORY_PALETTE } from '../../lib/constants';

// All possible categories defined in the palette
const ALL_CATEGORIES = CATEGORY_PALETTE;


/**
 * MapLegend displays a color key for the categories present in the provided listings.
 * If no listings are supplied, it falls back to showing all categories.
 */
export default function MapLegend({ listings = [] }) {
  // Determine which categories actually have listings with coordinates
  const presentCategories = useMemo(() => {
    const set = new Set();
    listings.forEach(l => {
      if (l.category) set.add(l.category);
    });
    return set;
  }, [listings]);

  // Filter the palette to only those categories that appear in the data
  const CATEGORIES = useMemo(() => {
    if (presentCategories.size === 0) return ALL_CATEGORIES;
    return ALL_CATEGORIES.filter(cat => presentCategories.has(cat.key));
  }, [presentCategories]);

  const itemRefs = useRef([]);
  const timers   = useRef([]);

  // Use Tailwind utility classes for the fade/slide animation.
  // Elements start hidden (opacity-0, translate-x-2) and we add
  // "opacity-100 translate-x-0 transition" classes when their timer fires.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Ensure all items start hidden.
    itemRefs.current.forEach((el) => {
      if (!el) return;
      el.classList.remove('opacity-100', 'translate-x-0');
      el.classList.add('opacity-0', 'translate-x-2');
    });

    CATEGORIES.forEach((_, i) => {
      const t = setTimeout(() => {
        const el = itemRefs.current[i];
        if (!el) return;
        el.classList.remove('opacity-0', 'translate-x-2');
        el.classList.add('opacity-100', 'translate-x-0', 'transition-opacity', 'duration-300', 'ease-out', 'transition-transform', 'duration-300');
      }, 200 + i * 70);
      timers.current.push(t);
    });

    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <div className="bg-[#FDFBF8] border border-[#F4EFE7] rounded-[12px] p-4">
      <p className="mb-3 text-xs font-semibold text-[#999] uppercase tracking-wider">
        Legend
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.key}
            ref={(el) => (itemRefs.current[i] = el)}
            className="flex items-center gap-2 opacity-0 translate-x-2"
          >
            {/* Mini pin shape matching map marker */}
            <svg width="14" height="19" viewBox="0 0 28 38" style={{ flexShrink: 0 }}>
              <path
                d="M14 2C8.477 2 4 6.477 4 12c0 7.5 10 24 10 24S24 19.5 24 12c0-5.523-4.477-10-10-10z"
                fill={cat.color}
              />
              <circle cx="14" cy="12" r="4.5" fill="#fff" opacity="0.9"/>
            </svg>
            <span style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
              {cat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
<<<<<<< HEAD
}

=======
}
>>>>>>> 4a6a039a118a49ff259ff40c167222122c6a839f
