import { cn } from "@/lib/utils";

interface LuminationProps {
  name: string;
  count?: number;
  colors: string[];
  width?: number;
  height?: number;
  seed?: number;
  className?: string;
}

/**
 * Lumination – soft vertical gradient ellipses that fade from color to transparent,
 * similar to the painterly “spotlight” look in reference SVGs.
 */
export function Lumination({
  name,
  colors,
  count = 3,
  seed = 0,
  width = 400,
  height = 300,
  className = "",
}: LuminationProps) {
  // deterministic pseudo-RNG
  const rng = (() => {
    let s = seed || Math.random();
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  })();

  const generateEllipseData = () => {
    const ellipses = [];
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.25 + rng() * 0.3;
      const offsetX = Math.cos(angle) * (width * 0.08);
      const offsetY = Math.sin(angle) * (height * 0.03);

      ellipses.push({
        cx: centerX + offsetX,
        cy: centerY + offsetY,
        rx: width * radius * (0.7 + rng() * 0.1),
        ry: height * radius * (0.5 + rng() * 0.2), // taller
        color: colors[i % colors.length],
        opacity: 0.7 + rng() * 0.3,
        rotate: (rng() - 0.5) * 10,
      });
    }

    return ellipses;
  };

  const ellipses = generateEllipseData();

  return (
    <div
      className={cn(
        "relative transform overflow-visible transition-transform duration-500 ease-out group-hover:scale-110",
        className,
      )}
      style={{ width, height }}
    >
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: to disable browser tooltip */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 transition-all duration-700 group-hover:brightness-125"
      >
        <defs>
          {ellipses.map((ellipse, index) => (
            <radialGradient
              key={`gradient-${index}-${name}`}
              id={`fadeGradient-${index}-${name}`}
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform={`
                translate(${ellipse.cx} ${ellipse.cy})
                rotate(${ellipse.rotate})
                scale(${ellipse.rx} ${ellipse.ry})
              `}
            >
              <stop offset="0%" stopColor={ellipse.color} stopOpacity={ellipse.opacity} />
              <stop offset="100%" stopColor={ellipse.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {ellipses.map((ellipse, index) => (
          <rect
            key={`${index}_${name}`}
            x="0"
            y="0"
            width={width}
            height={height}
            fill={`url(#fadeGradient-${index}-${name})`}
            style={{ mixBlendMode: "screen" }}
          />
        ))}

        {/* Fireflies on hover */}
        <g className="opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100">
          {Array.from({ length: 8 }).map((_, i) => {
            const x = rng() * width;
            const y = rng() * height;
            const dur = 2 + rng() * 3;
            return (
              <circle
                key={`firefly-${i}-${name}`}
                cx={x}
                cy={y}
                r={1.2 + rng() * 1.3}
                fill={colors[Math.floor(rng() * colors.length)]}
                opacity="0"
              >
                <animate
                  attributeName="opacity"
                  values="0;1;0"
                  dur={`${dur}s`}
                  repeatCount="indefinite"
                  begin={`${rng() * 2}s`}
                />
                <animate
                  attributeName="cx"
                  values={`${x};${x + (rng() - 0.5) * 40};${x}`}
                  dur={`${dur * 2}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cy"
                  values={`${y};${y + (rng() - 0.5) * 40};${y}`}
                  dur={`${dur * 2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
