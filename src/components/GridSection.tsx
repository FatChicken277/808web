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
}: Partial<BlockProps> & { className?: string }) => (
  <div
    className={`relative overflow-hidden ${bg || "bg-[#b5b5b5]"} flex items-center justify-center ${className ? className : "w-full h-full flex-1"}`}
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
}: Partial<BlockProps> & { className?: string }) => (
  <div
    className={`p-6 bg-black text-white transition-colors duration-500 flex flex-col justify-between overflow-hidden ${hoverClass} ${className ? className : "w-full h-full flex-1"}`}
  >
    <div className="space-y-2">
      <h3 className="text-2xl md:text-3xl font-black uppercase leading-tight tracking-tighter">
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

  const getSizingClasses = (
    direction = "vertical",
    distribution = "50/50",
    isVisual = true,
  ) => {
    const classMap: Record<string, Record<string, { v: string; c: string }>> = {
      // vertical means side-by-side (vertical cut), so use width
      vertical: {
        "50/50": { v: "w-[50%] h-full shrink-0", c: "w-[50%] h-full shrink-0" },
        "60/40": { v: "w-[60%] h-full shrink-0", c: "w-[40%] h-full shrink-0" },
        "40/60": { v: "w-[40%] h-full shrink-0", c: "w-[60%] h-full shrink-0" },
        "80/20": { v: "w-[80%] h-full shrink-0", c: "w-[20%] h-full shrink-0" },
        "20/80": { v: "w-[20%] h-full shrink-0", c: "w-[80%] h-full shrink-0" },
      },
      // horizontal means top-to-bottom (horizontal cut), so use height
      horizontal: {
        "50/50": { v: "h-[50%] w-full shrink-0", c: "h-[50%] w-full shrink-0" },
        "60/40": { v: "h-[60%] w-full shrink-0", c: "h-[40%] w-full shrink-0" },
        "40/60": { v: "h-[40%] w-full shrink-0", c: "h-[60%] w-full shrink-0" },
        "80/20": { v: "h-[80%] w-full shrink-0", c: "h-[20%] w-full shrink-0" },
        "20/80": { v: "h-[20%] w-full shrink-0", c: "h-[80%] w-full shrink-0" },
      },
    };

    const dirMap = classMap[direction] || classMap["vertical"];
    const distMap = dirMap[distribution] || dirMap["50/50"];
    return isVisual ? distMap.v : distMap.c;
  };

  const rows = [];
  let i = 0;
  let colorIdx = 0;

  while (i < displayPosts.length) {
    const post = displayPosts[i];
    const width = post.width === "1" ? 1 : 2;

    if (width === 1) {
      rows.push({
        isSingle: true,
        ratio: "grid-cols-1",
        item: {
          v: {
            img: post.image || "/video/video.avif",
            className: getSizingClasses(
              post.direction,
              post.distribution,
              true,
            ),
          },
          c: {
            title: post.title,
            content: post.description,
            hover: hoverColors[colorIdx % hoverColors.length],
            className: getSizingClasses(
              post.direction,
              post.distribution,
              false,
            ),
          },
          direction: post.direction || "vertical",
        },
      });
      colorIdx += 1;
      i += 1;
    } else {
      const leftPost = displayPosts[i];
      const rightPost = displayPosts[i + 1];

      if (!rightPost || rightPost.width === "1") {
        rows.push({
          isSingle: false,
          ratio: "grid-cols-1 md:grid-cols-2",
          left: {
            v: {
              img: leftPost.image || "/video/video.avif",
              className: getSizingClasses(
                leftPost.direction,
                leftPost.distribution,
                true,
              ),
            },
            c: {
              title: leftPost.title,
              content: leftPost.description,
              hover: hoverColors[colorIdx % hoverColors.length],
              className: getSizingClasses(
                leftPost.direction,
                leftPost.distribution,
                false,
              ),
            },
            direction: leftPost.direction || "vertical",
          },
        });
        colorIdx += 1;
        i += 1;
      } else {
        rows.push({
          isSingle: false,
          ratio: "grid-cols-1 md:grid-cols-2",
          left: {
            v: {
              img: leftPost.image || "/video/video.avif",
              className: getSizingClasses(
                leftPost.direction,
                leftPost.distribution,
                true,
              ),
            },
            c: {
              title: leftPost.title,
              content: leftPost.description,
              hover: hoverColors[colorIdx % hoverColors.length],
              className: getSizingClasses(
                leftPost.direction,
                leftPost.distribution,
                false,
              ),
            },
            direction: leftPost.direction || "vertical",
          },
          right: {
            v: {
              img: rightPost.image || "/video/video.avif",
              className: getSizingClasses(
                rightPost.direction,
                rightPost.distribution,
                true,
              ),
            },
            c: {
              title: rightPost.title,
              content: rightPost.description,
              hover: hoverColors[(colorIdx + 1) % hoverColors.length],
              className: getSizingClasses(
                rightPost.direction,
                rightPost.distribution,
                false,
              ),
            },
            direction: rightPost.direction || "vertical",
          },
        });
        colorIdx += 2;
        i += 2;
      }
    }
  }

  return (
    <section className="w-full bg-black text-white">
      {rows.map((row: any, idx) => (
        <div key={idx} className={`grid ${row.ratio} h-[80vh]`}>
          {row.isSingle ? (
            <div
              className={`group flex ${row.item.direction === "vertical" ? "flex-row" : "flex-col"} overflow-hidden h-full w-full`}
            >
              <VisualBlock {...row.item.v} />
              <ContentBlock {...row.item.c} hoverClass={row.item.c.hover} />
            </div>
          ) : (
            <>
              {/* Left Column */}
              <div
                className={`group flex ${row.left.direction === "vertical" ? "flex-row" : "flex-col"} overflow-hidden h-full`}
              >
                <VisualBlock {...row.left.v} />
                <ContentBlock {...row.left.c} hoverClass={row.left.c.hover} />
              </div>

              {/* Right Column */}
              {row.right && (
                <div
                  className={`group flex ${row.right.direction === "vertical" ? "flex-row" : "flex-col"} overflow-hidden h-full`}
                >
                  <VisualBlock {...row.right.v} />
                  <ContentBlock
                    {...row.right.c}
                    hoverClass={row.right.c.hover}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </section>
  );
}
