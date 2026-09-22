"use client";

import React from "react";

type VerifiedBadgeProps = {
  size?: number;
  className?: string;
};

/**
 * Verified checkmark badge — TikTok style: bright cyan-blue circle + white check.
 * Inline SVG so it stays crisp at any size.
 */
export default function VerifiedBadge({ size = 16, className = "" }: VerifiedBadgeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 align-middle ${className}`}
      role="img"
      aria-label="Verified account"
    >
      <circle cx="12" cy="12" r="11" fill="#20D5EC" />
      <path
        d="M10.6 15.6L7.4 12.4l1.4-1.4 1.8 1.8 4.6-4.6 1.4 1.4z"
        fill="#fff"
      />
    </svg>
  );
}