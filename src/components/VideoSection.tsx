import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function VideoSection({
  video = "/video/video.avif",
}: {
  video?: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const text = "808 FEST — TRAPERIA — ";

  useEffect(() => {
    if (isModalOpen) {
      window.dispatchEvent(new Event("system-audio-pause"));
      document.body.style.overflow = "hidden";
    } else {
      window.dispatchEvent(new Event("system-audio-resume"));
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const MarqueeRow = ({ reverse = false }: { reverse?: boolean }) => (
    <div className="relative flex overflow-hidden w-full h-[25vh] items-center whitespace-nowrap">
      <div
        className={`animate-marquee text-[11vw] font-black uppercase tracking-tighter text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.4)] flex items-center h-full ${reverse ? "[animation-direction:reverse]" : ""}`}
      >
        <span className="pr-4">{text}</span>
        <span className="pr-4">{text}</span>
        <span className="pr-4">{text}</span>
      </div>
      <div
        className={`absolute top-0 animate-marquee2 text-[11vw] font-black uppercase tracking-tighter text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.4)] flex items-center h-full ${reverse ? "[animation-direction:reverse]" : ""}`}
      >
        <span className="pr-4">{text}</span>
        <span className="pr-4">{text}</span>
        <span className="pr-4">{text}</span>
      </div>
    </div>
  );

  const isVideo = video?.match(/\.(mp4|webm|ogg)$/i);

  return (
    <section className="relative w-full h-screen bg-[#22003D] flex flex-col justify-between overflow-hidden select-none">
      {/* 4 Lines of Marquee */}
      <div className="absolute inset-0 z-0 flex flex-col justify-center">
        <MarqueeRow />
        <MarqueeRow reverse />
        <MarqueeRow />
        <MarqueeRow reverse />
      </div>

      {/* Center Square Video (On top of everything) */}
      <div
        onClick={() => isVideo && setIsModalOpen(true)}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] md:w-[35vw] aspect-square z-20 shadow-[0_30px_60px_rgba(0,0,0,0.8)] group cursor-pointer overflow-hidden bg-black border border-white/5"
      >
        {isVideo ? (
          <video
            src={`${video}#t=33`}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
            muted
            playsInline
          />
        ) : (
          <img
            src={video}
            alt="Video Highlight"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
          />
        )}
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-500 delay-100">
            <svg
              className="w-10 h-10 text-black ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Video Modal Popup rendered via Portal to avoid CSS transform issues */}
      {isModalOpen &&
        isVideo &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-9999999 bg-black/95 flex items-center justify-center p-4 md:p-10 backdrop-blur-xl animate-in fade-in duration-300"
            data-native-cursor="true"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-50 bg-black/50 p-2 rounded-full backdrop-blur-md cursor-pointer"
            >
              <X size={32} />
            </button>
            <div className="relative w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.3)] animate-in zoom-in-95 duration-500">
              <video
                src={video}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
