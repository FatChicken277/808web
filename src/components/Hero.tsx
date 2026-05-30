import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import TicketModal from "./TicketModal";

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
            <div className="flex items-center gap-4 shrink-0">
              <img
                src="/logos/logos.png"
                alt="808 Logos"
                className="h-5 md:h-8 w-auto object-contain"
              />
            </div>

            {/* Right: Navbar & Contact */}
            <div className="flex flex-col items-start md:items-end gap-4 w-full md:w-auto">
              <nav className="flex flex-wrap gap-4 text-xs md:text-sm font-bold tracking-widest uppercase">
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
                  href="#instagram"
                  className="border border-white rounded-full px-3 py-1 hover:bg-white hover:text-black transition-colors"
                >
                  Instagram
                </a>
              </div>
            </div>
          </header>

          {/* Hero Body */}
          <div className="flex flex-1 flex-col items-end justify-start pt-20">
            <div className="flex w-full sm:w-60 flex-col items-center space-y-4">
              {/* Event Logo Area */}
              <div className="relative w-full flex items-center justify-center">
                <img
                  src="/logos/808.png"
                  alt="808 FEST"
                  className="w-48 h-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                />
              </div>

              {/* Action Box */}
              <div className="w-full bg-white text-black text-xs font-bold uppercase tracking-widest mt-5 flex flex-col">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="block w-full text-center py-3 border-b border-black hover:bg-[#39FF14] transition-colors"
                >
                  OBTENER TICKETS
                </button>
                <div className="flex w-full">
                  <a
                    href="#artistas"
                    className="flex-1 text-center py-3 border-r border-black hover:bg-gray-200 transition-colors"
                  >
                    ARTISTAS
                  </a>
                  <a
                    href="#about"
                    className="flex-1 text-center py-3 hover:bg-gray-200 transition-colors"
                  >
                    SABER MÁS
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
