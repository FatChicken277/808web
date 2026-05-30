import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import TicketModal from "./TicketModal";
import { ChevronDown } from "lucide-react";

export default function Hero({
  video = "/video/video.avif",
}: {
  video?: string;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Just animate main content in without any intro
    gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" },
    );
  }, []);

  const isVideo = video?.match(/\.(mp4|webm|ogg)$/i);

  return (
    <>
      <div className="relative min-h-screen w-full overflow-hidden bg-black font-sans text-white">
        {/* Background Video/Image Placeholder */}
        <div className="absolute inset-0 z-0 h-full w-full">
          {isVideo ? (
            <video
              src={video}
              className="h-full w-full object-cover opacity-80 mix-blend-screen"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={video}
              alt="Background Preview"
              className="h-full w-full object-cover opacity-80 mix-blend-screen"
            />
          )}
          <div className="absolute inset-0 bg-linear-to-tr from-purple-900/20 via-transparent to-black/90 animate-gradient"></div>
        </div>

        {/* Main Content */}
        <div
          ref={mainRef}
          className="relative z-10 flex h-full min-h-screen flex-col px-6 py-6 md:px-12 md:py-8 justify-between"
        >
          {/* Header */}
          <header className="flex flex-col md:flex-row w-full items-start md:items-start justify-between mix-blend-difference text-white gap-6">
            {/* Left: Logos */}
            <div className="hidden md:flex items-center gap-4 shrink-0">
              <img
                src="/logos/logos.png"
                alt="808 Logos"
                className="h-5 md:h-8 w-auto object-contain"
              />
            </div>

            {/* Right: Navbar & Contact */}
            <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
              <nav className="flex flex-wrap justify-center gap-4 text-xs md:text-sm font-bold tracking-widest uppercase">
                <a
                  href="#caos"
                  className="hover:text-gray-300 transition-colors"
                >
                  Galería.
                </a>
                <a
                  href="#artistas"
                  className="hover:text-gray-300 transition-colors"
                >
                  Artistas.
                </a>
                <a
                  href="#equipo"
                  className="hover:text-gray-300 transition-colors"
                >
                  Equipo.
                </a>
                <a
                  href="#ubicacion"
                  className="hover:text-gray-300 transition-colors"
                >
                  Ubicación.
                </a>
              </nav>

              <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase">
                <a
                  href="https://el808fest.com"
                  className="hover:text-gray-300 transition-colors flex items-center gap-2"
                >
                  <span>➔</span> EL808FEST.COM
                </a>
                <a
                  href="https://www.instagram.com/808festoficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white rounded-full px-3 py-1 hover:bg-white hover:text-black transition-colors"
                >
                  Instagram
                </a>
              </div>
            </div>
          </header>

          {/* Hero Body */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <div className="flex w-full max-w-[280px] sm:max-w-[340px] flex-col items-center space-y-4 pointer-events-auto px-6 mt-12 md:mt-0">
              {/* Event Logo Area */}
              <div className="relative w-full flex items-center justify-center">
                <img
                  src="/logos/808.png"
                  alt="808 FEST"
                  className="w-48 h-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                />
              </div>

              {/* Action Box */}
              <div className="w-full flex flex-col gap-3 mt-8">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="relative group w-full overflow-hidden bg-[#39FF14] text-black text-sm md:text-base font-black uppercase tracking-widest py-3 rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:shadow-[0_0_25px_rgba(57,255,20,0.6)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <span className="relative z-10 group-hover:text-black transition-colors duration-300">OBTENER TICKETS</span>
                  <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out"></div>
                </button>
                <div className="flex w-full gap-3">
                  <a
                    href="#artistas"
                    className="flex-1 text-center py-3 bg-white/5 backdrop-blur-md text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-lg border border-white/20 hover:bg-white/10 hover:border-[#9333ea] hover:-translate-y-1 shadow-lg transition-all duration-300"
                  >
                    ARTISTAS
                  </a>
                  <a
                    href="#video"
                    className="flex-1 text-center py-3 bg-white/5 backdrop-blur-md text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-lg border border-white/20 hover:bg-white/10 hover:border-[#9333ea] hover:-translate-y-1 shadow-lg transition-all duration-300"
                  >
                    SABER MÁS
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Only: Bottom Logos */}
          <div className="md:hidden flex justify-center pb-4 pt-10 mix-blend-difference">
            <img
              src="/logos/logos.png"
              alt="808 Logos"
              className="h-6 w-auto object-contain opacity-80"
            />
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center opacity-60 animate-bounce mix-blend-difference pointer-events-none">
            <ChevronDown size={28} />
          </div>
        </div>
      </div>

      <TicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
