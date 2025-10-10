interface LuminationProps {
  name: string;
  count?: number;
  colors: string[];
  width?: number;
  height?: number;
  seed?: number;
  className?: string;
}

export function Lumination({
  count = 3,
  seed = 0,
  colors,
  width = 400,
  height = 300,
  className = "",
  name,
}: LuminationProps) {
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
      const radius = 0.3 + rng() * 0.4;
      const offsetX = Math.cos(angle) * (width * 0.1);
      const offsetY = Math.sin(angle) * (height * 0.1);

      ellipses.push({
        cx: centerX + offsetX,
        cy: centerY + offsetY,
        rx: width * radius * (0.8 + rng() * 0.4),
        ry: height * radius * (0.6 + rng() * 0.4),
        color: colors[i] || colors[0],
        opacity: 0.6 + rng() * 0.3,
      });
    }

    return ellipses;
  };

  const ellipses = generateEllipseData();

  return (
    <div className={`duration-500 ${className}`} style={{ width, height }}>
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: to hide from browser tooltip */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 transition-all duration-700 group-hover:brightness-125"
      >
        <defs>
          <filter id={`glow-${name}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {ellipses.map((ellipse, index) => (
            <radialGradient
              key={`gradient-${index}-${name}`}
              id={`fadeGradient-${index}-${name}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={ellipse.color} stopOpacity={ellipse.opacity} />
              <stop offset="70%" stopColor={ellipse.color} stopOpacity={ellipse.opacity * 0.5} />
              <stop offset="100%" stopColor={ellipse.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {ellipses.map((ellipse, index) => {
          const points = Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * 2 * Math.PI;
            const radius = Math.min(ellipse.rx, ellipse.ry) * (0.6 + rng() * 0.4);
            return [ellipse.cx + Math.cos(angle) * radius, ellipse.cy + Math.sin(angle) * radius];
          });

          const pathData = `${points
            .map((p, i) => {
              const next = points[(i + 1) % points.length];
              const ctrl1 = [
                (p[0] + next[0]) / 2 + (rng() - 0.5) * 20,
                (p[1] + next[1]) / 2 + (rng() - 0.5) * 20,
              ];
              return `${i === 0 ? "M" : "C"} ${ctrl1[0]},${ctrl1[1]} ${next[0]},${next[1]} ${next[0]},${next[1]}`;
            })
            .join(" ")} Z`;

          return (
            <path
              key={`${index}_${name}`}
              d={pathData}
              fill={`url(#fadeGradient-${index}-${name})`}
              filter={`url(#glow-${name})`}
              className="origin-center transition-all duration-700 ease-out group-hover:scale-110 "
              style={{
                mixBlendMode: "screen",
                transformBox: "fill-box",
                transformOrigin: "center",
              }}
            />
          );
        })}

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
                r={1.5 + rng() * 1.5}
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

export default Lumination;
