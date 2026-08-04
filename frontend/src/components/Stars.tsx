"use client";

import { useEffect, useState } from "react";

interface Star {
  top: string;
  left: string;
  opacity: number;
}

interface StarsProps {
  count?: number;
  className?: string;
}

export default function Stars({ count = 20, className = "" }: StarsProps) {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: count }, () => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        opacity: Math.random() * 0.7 + 0.3,
      }))
    );
  }, [count]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {stars.map((star, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            opacity: star.opacity,
            width: "2.6px",
            height: "2.6px",
            boxShadow: "0 0 5px rgba(255,255,255,0.85)",
          }}
        />
      ))}
    </div>
  );
}