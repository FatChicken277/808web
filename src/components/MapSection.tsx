import React from "react";

export default function MapSection() {
  return (
    <section id="ubicacion" className="w-full flex flex-col md:flex-row bg-gradient-to-b from-black to-[#1a0b2e] text-white min-h-[60vh] md:h-[100vh] border-t border-black">
      {/* Left Content */}
      <div className="w-full md:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col justify-start">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-2">
          [UBICACIÓN]
        </h2>
        <p className="text-sm md:text-base font-normal text-white/90 leading-tight">
          Teatro Carlos Vieco
        </p>
      </div>

      {/* Right Map */}
      <div className="relative w-full md:w-1/2 flex-1 min-h-[40vh] md:min-h-0 md:h-full overflow-hidden">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6865.794382054848!2d-75.57949875203295!3d6.236416452107917!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4429b22326e351%3A0xe04c95aa432fffc1!2sTeatro%20Carlos%20Vieco!5e0!3m2!1ses-419!2sco!4v1777153411725!5m2!1ses-419!2sco"
          className="absolute inset-0 w-full h-full"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </section>
  );
}
