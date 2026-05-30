import React from "react";

export default function MapSection() {
  return (
    <section id="ubicacion" className="w-full flex flex-col bg-black text-white h-[70vh] md:h-[80vh] border-t border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-6 md:px-12 pt-12 shrink-0">
        <div className="flex items-baseline gap-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            [ubicación]
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 hidden sm:inline">
            Teatro Carlos Vieco
          </span>
        </div>
      </div>

      {/* Map with Margins */}
      <div className="relative w-full flex-1 px-6 md:px-12 pb-24 lg:pb-12 pt-8">
        <div className="relative w-full h-full overflow-hidden rounded-[10px] border border-white/10">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6865.794382054848!2d-75.57949875203295!3d6.236416452107917!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4429b22326e351%3A0xe04c95aa432fffc1!2sTeatro%20Carlos%20Vieco!5e0!3m2!1ses-419!2sco!4v1777153411725!5m2!1ses-419!2sco"
            className="absolute inset-0 w-full h-full invert hue-rotate-180 opacity-80"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
