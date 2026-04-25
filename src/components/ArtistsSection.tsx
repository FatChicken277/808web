import React, { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const InstagramIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const artists = [
  { name: "Dr. Agala Ferreira" },
  { name: "Amir Taaki" },
  { name: "Andrea Franz" },
  { name: "Bola Jardemalie" },
  { name: "Brewster Kahle" },
  { name: "Julian Assange" },
  { name: "Vitalik Buterin" },
];

export default function ArtistsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = current.clientWidth * 0.8;
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  return (
    <section className="w-full bg-black text-white py-12 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-6 md:px-12">
        <div className="flex items-baseline gap-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            [artists]
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 hidden sm:inline">
            In alphabetical order
          </span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => scroll("left")}
            className="hover:opacity-60 transition-all p-2 border border-white/20 rounded-full active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hover:opacity-60 transition-all p-2 border border-white/20 rounded-full active:scale-90"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-24 pt-8 scroll-smooth no-scrollbar pl-6 md:pl-12 scroll-pl-6 md:scroll-pl-12"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `,
          }}
        />

        {artists.map((artist, idx) => {
          // Pseudo-random slight rotations
          const rotations = [
            "group-hover:-rotate-2", 
            "group-hover:rotate-1", 
            "group-hover:-rotate-1", 
            "group-hover:rotate-2",
            "group-hover:-rotate-3",
            "group-hover:rotate-3"
          ];
          const randomRotation = rotations[idx % rotations.length];

          return (
            <div
              key={idx}
              className="group relative flex-shrink-0 w-[65vw] sm:w-[40vw] md:w-[22vw] snap-start"
            >
              {/* Inner Wrapper - Removed h-full so it hugs the content tightly */}
              <div className={`w-full flex flex-col bg-white/5 border border-white/10 overflow-hidden transition-all duration-500 ${randomRotation} group-hover:scale-[1.05] group-hover:z-50 group-hover:border-white/40 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.8)]`}>
                {/* Artist Header */}
                <div className="p-3 flex justify-between items-center bg-black border-b border-white/10 shrink-0">
                  <span className="text-[11px] font-bold uppercase tracking-tight truncate pr-2">
                    {artist.name}
                  </span>
                <a
                  href="#"
                  className="text-white hover:text-purple-400 transition-colors"
                >
                  <InstagramIcon size={14} />
                </a>
              </div>

              {/* Image container - Absolute inset to prevent bleeding/layout shifts */}
              <div className="relative w-full aspect-[3/4] overflow-hidden">
                <img
                  src="/video/video.avif"
                  alt={artist.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          );
        })}

        {/* Trailing spacer to preserve right padding and rotation space */}
        <div className="flex-shrink-0 w-6 md:w-12 h-1 pointer-events-none"></div>
      </div>
    </section>
  );
}
