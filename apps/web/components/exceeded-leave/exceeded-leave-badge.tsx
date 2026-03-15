// components/exceeded-leave/exceeded-leave-badge.tsx
// Place at: src/components/exceeded-leave/exceeded-leave-badge.tsx
//
// Small inline badge showing exceeded days — used on leave balance cards,
// history rows, and anywhere a quick "X days exceeded" indicator is needed.

import { AlertTriangle } from "lucide-react";

interface ExceededLeaveBadgeProps {
  exceededDays: number;
  size?: "sm" | "md";
}

export function ExceededLeaveBadge({
  exceededDays,
  size = "sm",
}: ExceededLeaveBadgeProps) {
  if (exceededDays <= 0) return null;

  const isSmall = size === "sm";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-semibold"
      style={{
        background: "#fff7ed",
        border: "1px solid #fed7aa",
        color: "#ea580c",
        padding: isSmall ? "2px 8px" : "4px 10px",
        fontSize: isSmall ? "9px" : "11px",
      }}
    >
      <AlertTriangle
        style={{
          width: isSmall ? 9 : 11,
          height: isSmall ? 9 : 11,
          flexShrink: 0,
        }}
      />
      {exceededDays} day{exceededDays !== 1 ? "s" : ""} exceeded
    </span>
  );
}