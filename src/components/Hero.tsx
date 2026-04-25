import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Button } from "./ui/button";

export default function Hero() {
  const introRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [introFinished, setIntroFinished] = useState(false);

  const introTexts = ["808", "ENMED", "el mejor evento del año", "trapperia"];

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIntroFinished(true);
      },
    });

    // Animate text changes faster
    introTexts.forEach((text, index) => {
      tl.to(textRef.current, {
        duration: 0,
        textContent: text,
      })
        .fromTo(
          textRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" },
        )
        .to(textRef.current, {
          opacity: 0,
          scale: 1.1,
          duration: 0.2,
          ease: "power2.in",
          delay: 0.25,
        });
    });

    // Reveal the rest of the page BEFORE the black screen fades out.
    // This forces the scrollbar to appear while the screen is still black,
    // so when the layout fades in, it's already perfectly positioned with no jumps.
    tl.call(() => {
      const delayedContent = document.getElementById("delayed-content");
      if (delayedContent) delayedContent.classList.remove("hidden");
    });

    // Fade out black screen
    tl.to(introRef.current, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut",
    });

    // Animate main content in
    tl.fromTo(
      mainRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.4",
    );
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black font-sans text-white">
      {/* Intro Overlay */}
      <div
        ref={introRef}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black ${
          introFinished ? "pointer-events-none" : ""
        }`}
      >
        <div
          ref={textRef}
          className="text-4xl md:text-7xl font-bold tracking-widest text-white uppercase text-center"
        ></div>
      </div>

      {/* Background Video/Image Placeholder */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <img
          src="/video/video.avif"
          alt="Background Preview"
          className="h-full w-full object-cover opacity-80 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-black/90 animate-gradient"></div>
      </div>

      {/* Main Content */}
      <div
        ref={mainRef}
        className="relative z-10 flex h-full min-h-screen flex-col px-6 py-6 md:px-12 md:py-8 justify-between"
      >
        {/* Header */}
        <header className="flex w-full items-start justify-between mix-blend-difference text-white">
          {/* Left: Logos */}
          <div className="flex items-center gap-4">
            <img
              src="/logos/logos.png"
              alt="808 Logos"
              className="h-5 md:h-8 w-auto object-contain"
            />
          </div>

          {/* Right: Navbar & Contact */}
          <div className="flex flex-col items-end gap-4">
            <nav className="flex gap-4 text-sm font-bold tracking-widest uppercase">
              <a
                href="#showcase"
                className="hover:text-gray-300 transition-colors"
              >
                Showcase.
              </a>
              <a
                href="#index"
                className="hover:text-gray-300 transition-colors"
              >
                Index.
              </a>
              <a
                href="#studio"
                className="hover:text-gray-300 transition-colors"
              >
                Studio.
              </a>
              <a
                href="#contact"
                className="hover:text-gray-300 transition-colors"
              >
                Contact.
              </a>
            </nav>

            <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase">
              <a
                href="mailto:studio@fluoro.london"
                className="hover:text-gray-300 transition-colors flex items-center gap-2"
              >
                <span>➔</span> STUDIO@FLUORO.LONDON
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
              <a
                href="#tickets"
                className="block w-full text-center py-3 border-b border-black hover:bg-[#39FF14] transition-colors"
              >
                OBTENER TICKETS
              </a>
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
  );
}
