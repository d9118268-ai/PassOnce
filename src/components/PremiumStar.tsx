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
          animation: po-star-float 2.2s ease-in-out infinite;
          filter:
            drop-shadow(0 0 3px rgba(168, 85, 247, 0.7))
            drop-shadow(0 0 7px rgba(236, 72, 153, 0.35));
        }

        .po-star::after {
          content: "";
          position: absolute;
          inset: 10%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(255,255,255,0.55), transparent 65%);
          opacity: 0;
          animation: po-star-shine 2.2s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes po-star-float {
          0%, 100% {
            transform: translateY(0) rotate(-5deg) scale(1);
          }
          50% {
            transform: translateY(-2px) rotate(5deg) scale(1.1);
          }
        }

        @keyframes po-star-shine {
          0%, 100% { opacity: 0; transform: scale(0.7); }
          50% { opacity: 0.9; transform: scale(1.25); }
        }
      `}</style>
    </span>
  );
}
