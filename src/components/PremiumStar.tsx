"use client";

import React, { useState } from "react";

/**
 * Telegram-style premium star for PassOnce.
 * Uses /public/premium-star.png when available and falls back to a
 * colourful SVG star when it is not. No glow/animation — a plain,
 * crisp badge that sits inline next to a name.
 */
export default function PremiumStar({ size = 20 }: { size?: number }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <span
      className="inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      title="Premium member"
      aria-label="Premium member"
    >
      {!imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/premium-star.png"
          alt="Premium"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient id="po-star-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="45%" stopColor="#A855F7" />
              <stop offset="75%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <path
            fill="url(#po-star-grad)"
            d="M12 2l2.9 6.26 6.6 1.04-4.75 4.4 1.25 6.55L12 17l-6 3.25L7.25 13.7 2.5 9.3l6.6-1.04L12 2z"
          />
        </svg>
      )}
    </span>
  );
}