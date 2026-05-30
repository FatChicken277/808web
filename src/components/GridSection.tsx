import React from "react";

interface BlockProps {
  type: "visual" | "content";
  title?: string;
  content?: string;
  img?: string;
  bg?: string;
  hoverClass?: string;
}

const VisualBlock = ({
  title,
  img,
  bg,
  className,
  style,
}: Partial<BlockProps> & { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`relative overflow-hidden ${bg || "bg-[#b5b5b5]"} flex items-center justify-center ${className || ""}`}
    style={style}
  >
    {img ? (
      <img
        src={img}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
      />
    ) : (
      <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter opacity-90 select-none">
        {title}
      </h2>
    )}
    <div className="absolute top-2 left-2 text-[8px] font-mono uppercase tracking-widest text-black/40">
      VISUAL_UNIT
    </div>
  </div>
);

const ContentBlock = ({
  title,
  content,
  hoverClass,
  className,
  style,
}: Partial<BlockProps> & { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`p-6 bg-black text-white transition-colors duration-500 flex flex-col justify-between overflow-hidden ${hoverClass} ${className || ""}`}
    style={style}
  >
    <div className="space-y-2">
      <h3 className="text-xl md:text-2xl lg:text-3xl font-black uppercase leading-tight tracking-tighter">
        {title}
      </h3>
      {content && (
        <p className="text-[10px] font-bold opacity-70 leading-tight uppercase tracking-tight">
          {content}
        </p>
      )}
    </div>
    <div className="text-[8px] font-mono uppercase tracking-widest opacity-40">
      00_{title?.slice(0, 3)}
    </div>
  </div>
);

export default function GridSection({ posts = [] }: { posts?: any[] }) {
  const defaultPosts = [
    {
      title: "Solarpunk Delivery",
      description: "Urban logistics reimagined.",
      image: "/video/video.avif",
      width: "2",
      direction: "vertical",
      distribution: "50/50",
    },
    {
      title: "Keep Up.",
      description: "Fast paced movement.",
      image: "/video/video.avif",
      width: "2",
      direction: "horizontal",
      distribution: "40/60",
    },
    {
      title: "The Noise",
      description: "Low frequency oscillations.",
      image: "/video/video.avif",
      width: "1",
      direction: "horizontal",
      distribution: "60/40",
    },
    {
      title: "Chaos System",
      description: "Asymmetric design patterns.",
      image: "/video/video.avif",
      width: "2",
      direction: "vertical",
      distribution: "60/40",
    },
    {
      title: "Aesthetic Unit",
      description: "Minimalist brutalism.",
      image: "/video/video.avif",
      width: "2",
      direction: "horizontal",
      distribution: "60/40",
    },
  ];

  const displayPosts = posts.length > 0 ? posts : defaultPosts;

  const hoverColors = [
    "group-hover:bg-white group-hover:text-black",
    "group-hover:bg-purple-600 group-hover:text-white",
    "group-hover:bg-green-500 group-hover:text-black",
    "group-hover:bg-red-600 group-hover:text-white",
    "group-hover:bg-blue-600 group-hover:text-white",
    "group-hover:bg-orange-500 group-hover:text-white",
  ];

  return (
    <section id="caos" className="w-full bg-black text-white">
      <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[30vh] md:auto-rows-[45vh]">
        {displayPosts.map((post: any, idx: number) => {
          let colSpan = "md:col-span-2"; // default for width="3"
          if (post.width === "1") colSpan = "md:col-span-6";
          if (post.width === "2") colSpan = "md:col-span-3";

          let flexDir = "flex-row";
          switch (post.direction) {
            case "vertical": flexDir = "flex-row"; break;
            case "vertical-f": flexDir = "flex-row-reverse"; break;
            case "horizontal": flexDir = "flex-col"; break;
            case "horizontal-f": flexDir = "flex-col-reverse"; break;
            default: flexDir = "flex-row"; break;
          }

          // Parse distribution like "60/40" or "80/40" into flex basis
          const [vStr, cStr] = (post.distribution || "50/50").split("/");
          const vFlex = parseInt(vStr) || 50;
          const cFlex = parseInt(cStr) || 50;

          const hoverClass = hoverColors[idx % hoverColors.length];

          return (
            <div
              key={idx}
              className={`group flex ${flexDir} overflow-hidden w-full h-full ${colSpan}`}
            >
              <VisualBlock
                img={post.image || "/video/video.avif"}
                style={{ flex: vFlex }}
              />
              <ContentBlock
                title={post.title}
                content={post.description}
                hoverClass={hoverClass}
                style={{ flex: cFlex }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
