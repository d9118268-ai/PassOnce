"use client";

import React, { useState } from "react";

/**
 * Telegram-style premium star for PassOnce.
 * Uses /public/premium-star.png when available and falls back to a
 * colourful SVG star when it is not.
 */
export default function PremiumStar({ size = 28 }: { size?: number }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <span
      className="po-star inline-flex items-center justify-center shrink-0 align-middle"
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
          className="w-full h-full object-contain scale-[1.18]"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="po-star-svg"
        >
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

      <style jsx>{`
        .po-star {
          position: relative;
          transform-origin: center;
          filter:
            drop-shadow(0 0 4px rgba(96, 165, 250, 0.85))
            drop-shadow(0 0 9px rgba(168, 85, 247, 0.75))
            drop-shadow(0 0 15px rgba(236, 72, 153, 0.4));
          animation: po-star-glow 1.8s ease-in-out infinite;
        }

        @keyframes po-star-glow {
          0%, 100% {
            transform: scale(1);
            filter:
              drop-shadow(0 0 3px rgba(96, 165, 250, 0.7))
              drop-shadow(0 0 7px rgba(168, 85, 247, 0.6))
              drop-shadow(0 0 11px rgba(236, 72, 153, 0.25));
          }
          50% {
            transform: scale(1.08);
            filter:
              drop-shadow(0 0 5px rgba(96, 165, 250, 1))
              drop-shadow(0 0 11px rgba(168, 85, 247, 0.9))
              drop-shadow(0 0 19px rgba(236, 72, 153, 0.55));
          }
        }
      `}</style>
    </span>
  );
}
