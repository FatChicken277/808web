import React from "react";

interface BlockProps {
  type: "visual" | "content";
  title?: string;
  content?: string;
  img?: string;
  bg?: string;
  hoverClass?: string;
}

const VisualBlock = ({ title, img, bg }: Partial<BlockProps>) => (
  <div className={`flex-1 relative overflow-hidden ${bg || "bg-[#b5b5b5]"} flex items-center justify-center h-full w-full`}>
    {img ? (
      <img src={img} alt={title} className="w-full h-full object-cover grayscale transition-all duration-700 opacity-80" />
    ) : (
      <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter opacity-90 select-none">
        {title}
      </h2>
    )}
    <div className="absolute top-2 left-2 text-[8px] font-mono uppercase tracking-widest text-black/40">VISUAL_UNIT</div>
  </div>
);

const ContentBlock = ({ title, content, hoverClass }: Partial<BlockProps>) => (
  <div className={`flex-1 p-6 bg-white transition-colors duration-500 flex flex-col justify-between h-full w-full ${hoverClass}`}>
    <div className="space-y-2">
      <h3 className="text-2xl md:text-3xl font-black uppercase leading-tight tracking-tighter">
        {title}
      </h3>
      {content && <p className="text-[10px] font-bold opacity-70 leading-tight uppercase tracking-tight">{content}</p>}
    </div>
    <div className="text-[8px] font-mono uppercase tracking-widest opacity-40">
      00_{title?.slice(0, 3)}
    </div>
  </div>
);

export default function GridSection() {
  const rows = [
    {
      ratio: "grid-cols-1 md:grid-cols-[40%_60%]",
      left: { type: "horizontal", v: { title: "V2" }, c: { title: "Solarpunk Delivery", content: "Urban logistics reimagined.", hover: "group-hover:bg-black group-hover:text-white" } },
      right: { type: "vertical", v: { img: "/video/video.avif" }, c: { title: "Keep Up.", content: "Fast paced movement.", hover: "group-hover:bg-purple-600 group-hover:text-white" } }
    },
    {
      ratio: "grid-cols-1 md:grid-cols-[55%_45%]",
      left: { type: "vertical", v: { title: "808" }, c: { title: "The Noise", content: "Low frequency oscillations.", hover: "group-hover:bg-green-500 group-hover:text-black" } },
      right: { type: "horizontal", v: { img: "/video/video.avif" }, c: { title: "Chaos System", content: "Asymmetric design patterns.", hover: "group-hover:bg-red-600 group-hover:text-white" } }
    },
    {
      ratio: "grid-cols-1 md:grid-cols-[35%_65%]",
      left: { type: "horizontal", v: { title: "RAW" }, c: { title: "Aesthetic Unit", content: "Minimalist brutalism.", hover: "group-hover:bg-white group-hover:text-black" } },
      right: { type: "vertical", v: { img: "/video/video.avif" }, c: { title: "Final Cut.", content: "Precision in motion.", hover: "group-hover:bg-orange-500 group-hover:text-white" } }
    }
  ];

  return (
    <section className="w-full bg-white text-black border-t border-black">
      {rows.map((row, idx) => (
        <div key={idx} className={`grid ${row.ratio} h-auto md:h-[80vh] border-b border-black last:border-b-0`}>
          
          {/* Left Column - Hover group */}
          <div className={`group flex ${row.left.type === "horizontal" ? "flex-col" : "flex-row"} border-b md:border-b-0 md:border-r border-black overflow-hidden h-full`}>
            <div className="flex-1 overflow-hidden">
              <VisualBlock {...row.left.v} />
            </div>
            <div className={`flex-1 overflow-hidden border-black ${row.left.type === "vertical" ? "border-l" : "border-t"}`}>
              <ContentBlock {...row.left.c} hoverClass={row.left.c.hover} />
            </div>
          </div>

          {/* Right Column - Hover group */}
          <div className={`group flex ${row.right.type === "horizontal" ? "flex-col" : "flex-row"} overflow-hidden h-full`}>
            <div className="flex-1 overflow-hidden">
              <VisualBlock {...row.right.v} />
            </div>
            <div className={`flex-1 overflow-hidden border-black ${row.right.type === "vertical" ? "border-l" : "border-t"}`}>
              <ContentBlock {...row.right.c} hoverClass={row.right.c.hover} />
            </div>
          </div>

        </div>
      ))}
    </section>
  );
}
