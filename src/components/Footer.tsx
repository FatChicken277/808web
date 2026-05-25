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
              <a href="#" className="hover:text-purple-500 transition-colors">Instagram</a>
              <a href="#" className="hover:text-purple-500 transition-colors">Twitter (X)</a>
              <a href="#" className="hover:text-purple-500 transition-colors">TikTok</a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="opacity-40">Legal</h3>
            <div className="flex flex-col space-y-2">
              <a href="#" className="hover:text-purple-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-purple-500 transition-colors">Privacy Policy</a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="opacity-40">Contact</h3>
            <div className="flex flex-col space-y-2">
              <a href="mailto:info@el808fest.com" className="hover:text-purple-500 transition-colors">info@el808fest.com</a>
              <a href="#" className="hover:text-purple-500 transition-colors">Press & Media</a>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-white/20 pt-8 flex justify-between items-center text-[10px] md:text-xs opacity-50 uppercase tracking-widest">
          <span>© 2026 808 FESTIVAL</span>
          <span>ALL RIGHTS RESERVED</span>
        </div>
      </div>
    </footer>
  );
}
