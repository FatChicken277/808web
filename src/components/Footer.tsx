import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white py-12 md:py-24 border-t border-white/20">
      <div className="flex flex-col items-center justify-center space-y-12 px-6">
        <h2 className="text-[18vw] leading-[0.8] font-black uppercase tracking-tighter text-center">
          808 FEST
        </h2>

        <div className="flex flex-col md:flex-row gap-8 md:gap-32 text-center md:text-left text-xs md:text-sm font-bold uppercase tracking-widest">
          <div className="space-y-4">
            <h3 className="opacity-40">Social</h3>
            <div className="flex flex-col space-y-2">
              <a href="https://www.instagram.com/808festoficial/" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">
                Instagram
              </a>
              <a href="https://www.facebook.com/profile.php?id=61550585335122" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">
                Facebook
              </a>
              <a href="https://www.tiktok.com/@enmedco" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">
                TikTok
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="opacity-40">Contacto</h3>
            <div className="flex flex-col space-y-2">
              <a
                href="mailto:808festoficial@gmail.com"
                className="hover:text-purple-500 transition-colors lowercase"
              >
                808festoficial@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-white/20 pt-8 flex justify-between items-center text-[10px] md:text-xs opacity-50 uppercase tracking-widest">
          <span>© 2026 808 FEST</span>
          <span>ALL RIGHTS RESERVED</span>
        </div>
      </div>
    </footer>
  );
}
