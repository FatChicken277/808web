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

const defaultTeam = [
  { name: "John Doe", role: "Creative Director", instagram: "johndoe" },
  { name: "Jane Smith", role: "Logistics", instagram: "janesmith" },
  { name: "Alex Johnson", role: "Sound Engineer", instagram: "alexjohnson" },
  { name: "Sam Wilson", role: "Visuals", instagram: "samw" },
];

export default function TeamSection({ team = [] }: { team?: any[] }) {
  const displayTeam = team.length > 0 ? team : defaultTeam;
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
    <section className="w-full bg-gradient-to-b from-[#1a0b2e] to-black text-white py-12 overflow-hidden border-t border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-6 md:px-12">
        <div className="flex items-baseline gap-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            [equipo]
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 hidden sm:inline">
            Equipo Organizador
          </span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => scroll("left")}
            className="hover:bg-white/10 transition-all p-2 border border-white/20 rounded-full active:scale-90 cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hover:bg-white/10 transition-all p-2 border border-white/20 rounded-full active:scale-90 cursor-pointer"
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

        {displayTeam.map((member, idx) => {
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
            <div
              key={idx}
              className="group relative flex-shrink-0 w-[65vw] sm:w-[40vw] md:w-[22vw] snap-start"
            >
              {/* Inner Wrapper */}
              <div
                className={`w-full flex flex-col bg-black/20 border border-white/10 overflow-hidden backdrop-blur-sm transition-all duration-500 ${randomRotation} group-hover:scale-[1.05] group-hover:z-50 group-hover:border-white/40 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)]`}
              >
                {/* Team Header */}
                <div className="p-3 flex justify-between items-center bg-black/40 border-b border-white/10 shrink-0 text-white">
                  <div className="flex flex-col justify-center overflow-hidden pr-2">
                    <span className="text-[11px] font-bold uppercase tracking-tight truncate">
                      {member.name}
                    </span>
                    {member.role && (
                      <span className="text-[9px] font-mono uppercase text-white/60 truncate mt-1">
                        {member.role}
                      </span>
                    )}
                  </div>
                  {member.instagram && (
                    <a
                      href={`https://instagram.com/${member.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-purple-400 transition-colors shrink-0 cursor-pointer"
                    >
                      <InstagramIcon size={14} />
                    </a>
                  )}
                </div>

                {/* Image container */}
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  <img
                    src={member.image || "/video/video.avif"}
                    alt={member.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Trailing spacer */}
        <div className="flex-shrink-0 w-6 md:w-12 h-1 pointer-events-none"></div>
      </div>
    </section>
  );
}
