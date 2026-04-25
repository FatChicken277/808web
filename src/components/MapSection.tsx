import React from "react";

export default function MapSection() {
  return (
    <section className="w-full flex flex-col md:flex-row bg-black text-white h-[100vh] border-t border-black">
      {/* Left Content */}
      <div className="w-full md:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col justify-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-2">
          [find us]
        </h2>
        <p className="text-sm md:text-base font-normal text-white/90 leading-tight">
          Warehouse One16, Pereira Henriques<br />
          1, No. 5, Armazém 16, 1950-242 Lisbon
        </p>
      </div>

      {/* Right Map */}
      <div className="relative w-full md:w-1/2 h-1/2 md:h-full bg-gray-300 overflow-hidden">
        {/* Placeholder Map Image - Using the same placeholder but in grayscale to mimic map */}
        <img 
          src="/video/video.avif" 
          alt="Map Location" 
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 opacity-50 mix-blend-multiply"
        />
        
        {/* Purple Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-800/70 via-purple-800/30 to-transparent"></div>

        {/* Black Star Marker */}
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 drop-shadow-lg">
          <svg viewBox="0 0 100 100" fill="black" className="w-full h-full">
            <polygon points="50,0 58,25 83,12 68,36 93,50 68,64 83,88 58,75 50,100 42,75 17,88 32,64 7,50 32,36 17,12 42,25" />
          </svg>
        </div>
      </div>
    </section>
  );
}
