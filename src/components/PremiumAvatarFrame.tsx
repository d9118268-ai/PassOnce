"use client";

import React from "react";

/**
 * Premium avatar frame inspired by animated social-profile effects:
 * colourful rotating ring, glow, and floating sparkles.
 */
export default function PremiumAvatarFrame({
  children,
  size = 88,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <div className="po-frame relative shrink-0" style={{ width: size, height: size }}>
      <div className="po-ring absolute inset-0 rounded-full" />
      <div className="po-ring-glow absolute -inset-1 rounded-full" />
      <div className="absolute inset-[4px] rounded-full overflow-hidden bg-white p-[2px]">
        <div className="w-full h-full rounded-full overflow-hidden bg-[#10B981]/10 flex items-center justify-center">
          {children}
        </div>
      </div>

      <span className="po-sparkle po-sp1" aria-hidden="true">✦</span>
      <span className="po-sparkle po-sp2" aria-hidden="true">✦</span>
      <span className="po-sparkle po-sp3" aria-hidden="true">✧</span>
      <span className="po-sparkle po-sp4" aria-hidden="true">✦</span>

      <style jsx>{`
        .po-frame {
          filter: drop-shadow(0 5px 16px rgba(88, 28, 135, 0.22));
        }

        .po-ring {
          background: conic-gradient(
            from 0deg,
            #22c55e,
            #06b6d4,
            #3b82f6,
            #8b5cf6,
            #ec4899,
            #f59e0b,
            #22c55e
          );
          animation: po-spin 4s linear infinite;
        }

        .po-ring-glow {
          background: conic-gradient(
            from 0deg,
            rgba(34,197,94,.45),
            rgba(59,130,246,.45),
            rgba(236,72,153,.45),
            rgba(245,158,11,.45),
            rgba(34,197,94,.45)
          );
          filter: blur(7px);
          opacity: .8;
          animation: po-spin-reverse 5s linear infinite;
        }

        .po-sparkle {
          position: absolute;
          z-index: 3;
          font-size: 13px;
          line-height: 1;
          pointer-events: none;
          text-shadow: 0 0 8px currentColor;
          animation: po-sparkle 2.1s ease-in-out infinite;
        }

        .po-sp1 { top: -7px; right: 5px; color: #f59e0b; }
        .po-sp2 { bottom: 1px; left: -9px; color: #ec4899; animation-delay: .55s; }
        .po-sp3 { top: 38%; right: -11px; color: #3b82f6; animation-delay: 1.1s; }
        .po-sp4 { bottom: -6px; right: 18px; color: #22c55e; animation-delay: 1.55s; }

        @keyframes po-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes po-spin-reverse {
          to { transform: rotate(-360deg); }
        }

        @keyframes po-sparkle {
          0%, 100% { transform: scale(.35) rotate(0deg); opacity: .15; }
          50% { transform: scale(1.2) rotate(90deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
