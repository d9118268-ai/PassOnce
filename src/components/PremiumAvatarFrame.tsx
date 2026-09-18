"use client";

import React from "react";

/**
 * Discord-Nitro-style animated avatar frame for premium users:
 * a rotating rainbow ring around the avatar, a soft glow, and drifting
 * sparkles (like the animated profile effects on Discord profile cards).
 *
 * Usage:
 *   <PremiumAvatarFrame size={68}>
 *     <span className="text-xl font-black text-[#10B981]">CO</span>
 *   </PremiumAvatarFrame>
 */
export default function PremiumAvatarFrame({
  children,
  size = 64,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <div className="po-frame relative shrink-0" style={{ width: size, height: size }}>
      <div className="po-ring absolute inset-0 rounded-full" />
      <div className="absolute inset-[3px] rounded-full overflow-hidden bg-[#10B981]/10 flex items-center justify-center">
        {children}
      </div>

      {/* drifting sparkles, Discord-decoration style */}
      <span className="po-sparkle po-sp1" aria-hidden="true">✦</span>
      <span className="po-sparkle po-sp2" aria-hidden="true">✦</span>
      <span className="po-sparkle po-sp3" aria-hidden="true">✧</span>

      <style jsx>{`
        .po-ring {
          background: conic-gradient(from 0deg, #10b981, #3b82f6, #d946ef, #f59e0b, #10b981);
          animation: po-spin 4s linear infinite;
        }
        .po-frame {
          filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.45));
        }
        @keyframes po-spin {
          to { transform: rotate(360deg); }
        }
        .po-sparkle {
          position: absolute;
          font-size: 11px;
          line-height: 1;
          pointer-events: none;
          animation: po-sparkle 2.2s ease-in-out infinite;
        }
        .po-sp1 { top: -5px; right: 3px; color: #f59e0b; }
        .po-sp2 { bottom: -2px; left: -7px; color: #d946ef; animation-delay: 0.7s; }
        .po-sp3 { top: 42%; right: -9px; color: #3b82f6; animation-delay: 1.3s; }
        @keyframes po-sparkle {
          0%, 100% { transform: scale(0.4) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.15) rotate(90deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}