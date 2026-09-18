"use client";

import React, { useState } from "react";
import { Bot } from "lucide-react";

/**
 * Animated "AI is replying" indicator — a bouncing robot avatar followed
 * by three typing dots (Discord/WhatsApp style).
 *
 * Drop a robot.png into /public to use your own robot artwork; if it's
 * missing, a Bot icon is shown automatically as the fallback.
 */
export default function AiTutorTyping() {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="po-robot relative w-9 h-9 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center overflow-hidden shrink-0">
        {!imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/robot.png"
            alt="AI tutor is typing"
            className="w-7 h-7 object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Bot className="w-5 h-5 text-[#10B981]" />
        )}
      </div>

      <div className="flex items-center gap-1 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
        <span className="po-dot" />
        <span className="po-dot" />
        <span className="po-dot" />
      </div>

      <style jsx>{`
        .po-robot {
          animation: po-robot-bounce 1.1s ease-in-out infinite;
        }
        @keyframes po-robot-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .po-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #10b981;
          animation: po-typing 1.2s ease-in-out infinite;
        }
        .po-dot:nth-child(2) { animation-delay: 0.15s; }
        .po-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes po-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}