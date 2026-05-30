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

const defaultArtists = [
  { name: "Dr. Agala Ferreira" },
  { name: "Amir Taaki" },
  { name: "Andrea Franz" },
  { name: "Bola Jardemalie" },
  { name: "Brewster Kahle" },
  { name: "Julian Assange" },
  { name: "Vitalik Buterin" },
];

export default function ArtistsSection({ artists = [] }: { artists?: any[] }) {
  const displayArtists = artists.length > 0 ? artists : defaultArtists;
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
    <section id="artistas" className="w-full bg-linear-to-bl from-[#4a126b] via-black via-50% to-[#0f5c24] text-white py-12 overflow-hidden border-t border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-6 md:px-12">
        <div className="flex items-baseline gap-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            [artistas]
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 hidden sm:inline">
            En orden alfabético
          </span>
        </div>
        <div className="flex gap-4 lg:hidden">
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

      {/* Horizontal Scroll Area / Desktop Grid */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto lg:grid lg:grid-cols-4 xl:grid-cols-5 lg:overflow-visible lg:snap-none snap-x snap-mandatory pb-24 lg:pb-12 pt-8 scroll-smooth no-scrollbar pl-6 md:pl-12 lg:px-12 scroll-pl-6 md:scroll-pl-12 lg:scroll-pl-0"
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

        {displayArtists.map((artist, idx) => {
          // Pseudo-random slight rotations
          const rotations = [
            "group-hover:-rotate-2",
            "group-hover:rotate-1",
            "group-hover:-rotate-1",
            "group-hover:rotate-2",
            "group-hover:-rotate-3",
            "group-hover:rotate-3",
          ];
          const randomRotation = rotations[idx % rotations.length];

          return (
            <a
              key={idx}
              href={
                artist.instagram
                  ? `https://instagram.com/${artist.instagram}`
                  : undefined
              }
              target={artist.instagram ? "_blank" : undefined}
              rel={artist.instagram ? "noopener noreferrer" : undefined}
              className="group relative shrink-0 w-[65vw] sm:w-[40vw] md:w-[22vw] lg:w-auto snap-start lg:snap-align-none block cursor-pointer"
            >
              {/* Apple-style Animated Border Wrapper */}
              <div
                className={`relative w-full rounded-xl p-[2px] transition-all duration-500 ${randomRotation} group-hover:scale-[1.05] group-hover:z-50 group-hover:shadow-[0_20px_50px_rgba(162,49,244,0.4)] overflow-hidden`}
              >
                {/* Default border */}
                <div className="absolute inset-0 bg-white/10 group-hover:opacity-0 transition-opacity duration-500"></div>

                {/* Animated Rainbow border (808 colors: purple & green) */}
                <div className="absolute -inset-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#9333ea_0%,#39FF14_25%,#9333ea_50%,#39FF14_75%,#9333ea_100%)]"></div>

                {/* Inner Content Wrapper */}
                <div
                  className={`relative z-10 w-full h-full flex flex-col bg-black rounded-[10px] overflow-hidden`}
                >
                  {/* Artist Header */}
                  <div className="p-3 flex justify-between items-center bg-black border-b border-white/10 shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-tight truncate pr-2">
                      {artist.name}
                    </span>
                    <div className="text-white group-hover:text-purple-400 transition-colors">
                      <InstagramIcon size={14} />
                    </div>
                  </div>

                  {/* Image container - Absolute inset to prevent bleeding/layout shifts */}
                  <div className="relative w-full aspect-3/4 overflow-hidden">
                    <img
                      src={artist.image || "/video/video.avif"}
                      alt={artist.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </a>
          );
        })}

        {/* Trailing spacer to preserve right padding and rotation space */}
        <div className="shrink-0 w-6 md:w-12 lg:hidden h-1 pointer-events-none"></div>
      </div>
    </section>
  );
}
