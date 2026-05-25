import React from "react";

export default function Marquee() {
  const text = "808 FEST — TRAPERIA — ";

  return (
    <div className="relative flex overflow-x-hidden border-t border-b border-black bg-white py-4 font-black uppercase tracking-tighter text-black">
      <div className="animate-marquee whitespace-nowrap text-6xl md:text-8xl">
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
      </div>

      <div className="absolute top-0 animate-marquee2 whitespace-nowrap text-6xl md:text-8xl">
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}
