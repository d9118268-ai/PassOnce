"use client";

import React, { useState } from "react";

/**

Telegram-Premium-style star beside a premium user's name, but using
YOUR colourful star artwork instead of Telegram's blue star.


Put premium-star.png in /public. If the image is missing, a gradient
star renders automatically as the fallback.
*/
export default function PremiumStar({ size = 40 }: { size?: number }) {
const [imgFailed, setImgFailed] = useState(false);

return (
<span
className="po-star inline-flex items-center justify-center shrink-0 align-middle"
style={{ width: size, height: size }}
title="Premium member"
>
{!imgFailed ? (
// eslint-disable-next-line @next/next/no-img-element
<img
src="/premium-star.png"
alt="Premium"
width={size}
height={size}
className="object-contain"
onError={() => setImgFailed(true)}
/>
) : (
<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
<defs>
<linearGradient id="po-star-grad" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stopColor="#6366F1" />
<stop offset="50%" stopColor="#D946EF" />
<stop offset="100%" stopColor="#F472B6" />
</linearGradient>
</defs>
<path fill="url(#po-star-grad)" d="M12 2l2.9 6.26 6.6 1.04-4.75 4.4 1.25 6.55L12 17l-6 3.25L7.25 13.7 2.5 9.3l6.6-1.04L12 2z" />
</svg>
)}

  <style jsx>{`
    @keyframes po-star-float {
      0%, 100% { transform: translateY(0) rotate(-4deg) scale(1); }
      50% { transform: translateY(-3px) rotate(4deg) scale(1.08); }
    }
  `}</style>
</span>

);
}