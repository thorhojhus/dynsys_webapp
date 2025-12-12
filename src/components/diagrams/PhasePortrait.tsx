import { useMemo } from 'react';

export type PortraitType =
  | 'stable_node'
  | 'unstable_node'
  | 'saddle'
  | 'stable_spiral'
  | 'unstable_spiral'
  | 'center';

interface PhasePortraitProps {
  type: PortraitType;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export function PhasePortrait({
  type,
  size = 200,
  className = '',
  showLabel = false,
}: PhasePortraitProps) {
  const center = size / 2;
  const scale = size / 200;

  const paths = useMemo(() => {
    switch (type) {
      case 'stable_node':
        return generateStableNode(center, scale);
      case 'unstable_node':
        return generateUnstableNode(center, scale);
      case 'saddle':
        return generateSaddle(center, scale);
      case 'stable_spiral':
        return generateStableSpiral(center, scale);
      case 'unstable_spiral':
        return generateUnstableSpiral(center, scale);
      case 'center':
        return generateCenter(center, scale);
      default:
        return [];
    }
  }, [type, center, scale]);

  const label = useMemo(() => {
    switch (type) {
      case 'stable_node': return 'Stable Node';
      case 'unstable_node': return 'Unstable Node';
      case 'saddle': return 'Saddle';
      case 'stable_spiral': return 'Stable Spiral';
      case 'unstable_spiral': return 'Unstable Spiral';
      case 'center': return 'Center';
    }
  }, [type]);

  return (
    <div className={`inline-block ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="bg-white rounded border border-gray-200"
      >
        {/* Axes */}
        <line
          x1={10 * scale}
          y1={center}
          x2={size - 10 * scale}
          y2={center}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        <line
          x1={center}
          y1={10 * scale}
          x2={center}
          y2={size - 10 * scale}
          stroke="#e5e7eb"
          strokeWidth={1}
        />

        {/* Trajectories */}
        {paths.map((path, i) => (
          <path
            key={i}
            d={path.d}
            stroke={path.stroke || '#3b82f6'}
            strokeWidth={path.strokeWidth || 1.5}
            fill="none"
            markerEnd={path.arrow ? 'url(#arrowhead)' : undefined}
          />
        ))}

        {/* Origin point */}
        <circle cx={center} cy={center} r={4 * scale} fill="#1f2937" />

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>
      {showLabel && (
        <div className="text-center text-sm text-gray-600 mt-1">{label}</div>
      )}
    </div>
  );
}

interface PathData {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  arrow?: boolean;
}

function generateStableNode(center: number, scale: number): PathData[] {
  const paths: PathData[] = [];

  // Straight trajectories toward center
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  angles.forEach((angle) => {
    const rad = (angle * Math.PI) / 180;
    const x1 = center + 80 * scale * Math.cos(rad);
    const y1 = center + 80 * scale * Math.sin(rad);
    const x2 = center + 15 * scale * Math.cos(rad);
    const y2 = center + 15 * scale * Math.sin(rad);
    paths.push({
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      arrow: true,
    });
  });

  return paths;
}

function generateUnstableNode(center: number, scale: number): PathData[] {
  const paths: PathData[] = [];

  // Straight trajectories away from center
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  angles.forEach((angle) => {
    const rad = (angle * Math.PI) / 180;
    const x1 = center + 15 * scale * Math.cos(rad);
    const y1 = center + 15 * scale * Math.sin(rad);
    const x2 = center + 80 * scale * Math.cos(rad);
    const y2 = center + 80 * scale * Math.sin(rad);
    paths.push({
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      arrow: true,
    });
  });

  return paths;
}

function generateSaddle(center: number, scale: number): PathData[] {
  const paths: PathData[] = [];

  // Stable manifold (horizontal, arrows toward center)
  paths.push({
    d: `M ${center - 80 * scale} ${center} L ${center - 15 * scale} ${center}`,
    stroke: '#22c55e',
    arrow: true,
  });
  paths.push({
    d: `M ${center + 80 * scale} ${center} L ${center + 15 * scale} ${center}`,
    stroke: '#22c55e',
    arrow: true,
  });

  // Unstable manifold (vertical, arrows away from center)
  paths.push({
    d: `M ${center} ${center - 15 * scale} L ${center} ${center - 80 * scale}`,
    stroke: '#ef4444',
    arrow: true,
  });
  paths.push({
    d: `M ${center} ${center + 15 * scale} L ${center} ${center + 80 * scale}`,
    stroke: '#ef4444',
    arrow: true,
  });

  // Hyperbolic trajectories
  const hyperPoints = [
    [20, 30], [30, 20], [40, 15], [50, 12], [60, 10],
    [-20, 30], [-30, 20], [-40, 15], [-50, 12], [-60, 10],
    [20, -30], [30, -20], [40, -15], [50, -12], [60, -10],
    [-20, -30], [-30, -20], [-40, -15], [-50, -12], [-60, -10],
  ];

  // Connect quadrant curves
  paths.push({
    d: `M ${center + 60 * scale} ${center + 10 * scale} Q ${center + 20 * scale} ${center + 20 * scale} ${center + 10 * scale} ${center + 60 * scale}`,
    arrow: true,
  });
  paths.push({
    d: `M ${center - 60 * scale} ${center + 10 * scale} Q ${center - 20 * scale} ${center + 20 * scale} ${center - 10 * scale} ${center + 60 * scale}`,
    arrow: true,
  });
  paths.push({
    d: `M ${center + 60 * scale} ${center - 10 * scale} Q ${center + 20 * scale} ${center - 20 * scale} ${center + 10 * scale} ${center - 60 * scale}`,
    arrow: true,
  });
  paths.push({
    d: `M ${center - 60 * scale} ${center - 10 * scale} Q ${center - 20 * scale} ${center - 20 * scale} ${center - 10 * scale} ${center - 60 * scale}`,
    arrow: true,
  });

  return paths;
}

function generateStableSpiral(center: number, scale: number): PathData[] {
  const paths: PathData[] = [];

  // Spiral inward
  let d = `M ${center + 70 * scale} ${center}`;
  for (let t = 0; t <= 4 * Math.PI; t += 0.1) {
    const r = 70 * scale * Math.exp(-0.15 * t);
    const x = center + r * Math.cos(t);
    const y = center + r * Math.sin(t);
    d += ` L ${x} ${y}`;
  }
  paths.push({ d, arrow: true });

  // Second spiral from different start
  d = `M ${center - 50 * scale} ${center + 30 * scale}`;
  for (let t = Math.PI; t <= 4 * Math.PI; t += 0.1) {
    const r = 58 * scale * Math.exp(-0.15 * t);
    const x = center + r * Math.cos(t);
    const y = center + r * Math.sin(t);
    d += ` L ${x} ${y}`;
  }
  paths.push({ d, arrow: true });

  return paths;
}

function generateUnstableSpiral(center: number, scale: number): PathData[] {
  const paths: PathData[] = [];

  // Spiral outward
  let d = `M ${center + 10 * scale} ${center}`;
  for (let t = 0; t <= 3 * Math.PI; t += 0.1) {
    const r = 10 * scale * Math.exp(0.2 * t);
    if (r > 80 * scale) break;
    const x = center + r * Math.cos(t);
    const y = center + r * Math.sin(t);
    d += ` L ${x} ${y}`;
  }
  paths.push({ d, arrow: true });

  // Second spiral
  d = `M ${center - 8 * scale} ${center + 5 * scale}`;
  for (let t = Math.PI; t <= 3.5 * Math.PI; t += 0.1) {
    const r = 9 * scale * Math.exp(0.2 * t);
    if (r > 80 * scale) break;
    const x = center + r * Math.cos(t);
    const y = center + r * Math.sin(t);
    d += ` L ${x} ${y}`;
  }
  paths.push({ d, arrow: true });

  return paths;
}

function generateCenter(center: number, scale: number): PathData[] {
  const paths: PathData[] = [];

  // Concentric circles (closed orbits)
  const radii = [20, 40, 60];
  radii.forEach((r) => {
    paths.push({
      d: `M ${center + r * scale} ${center} A ${r * scale} ${r * scale} 0 1 1 ${center + r * scale - 0.1} ${center}`,
      arrow: true,
    });
  });

  return paths;
}

// Bifurcation diagram component
export type BifurcationType = 'saddle_node' | 'transcritical' | 'pitchfork_super' | 'pitchfork_sub';

interface BifurcationDiagramProps {
  type: BifurcationType;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export function BifurcationDiagram({
  type,
  size = 200,
  className = '',
  showLabel = false,
}: BifurcationDiagramProps) {
  const width = size;
  const height = size * 0.75;
  const scale = size / 200;

  const label = useMemo(() => {
    switch (type) {
      case 'saddle_node': return 'Saddle-Node';
      case 'transcritical': return 'Transcritical';
      case 'pitchfork_super': return 'Supercritical Pitchfork';
      case 'pitchfork_sub': return 'Subcritical Pitchfork';
    }
  }, [type]);

  return (
    <div className={`inline-block ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-white rounded border border-gray-200"
      >
        {/* Axes */}
        <line
          x1={20 * scale}
          y1={height / 2}
          x2={width - 10 * scale}
          y2={height / 2}
          stroke="#9ca3af"
          strokeWidth={1}
        />
        <line
          x1={width / 2}
          y1={10 * scale}
          x2={width / 2}
          y2={height - 10 * scale}
          stroke="#9ca3af"
          strokeWidth={1}
        />

        {/* Axis labels */}
        <text x={width - 15 * scale} y={height / 2 - 5 * scale} fontSize={10 * scale} fill="#6b7280">r</text>
        <text x={width / 2 + 5 * scale} y={15 * scale} fontSize={10 * scale} fill="#6b7280">x</text>

        {/* Diagram curves */}
        {type === 'saddle_node' && (
          <>
            {/* Stable branch (solid) */}
            <path
              d={`M ${width / 2} ${height / 2} Q ${width / 2 - 40 * scale} ${height / 2 - 30 * scale} ${width / 2 - 60 * scale} ${height / 2 - 50 * scale}`}
              stroke="#22c55e"
              strokeWidth={2}
              fill="none"
            />
            {/* Unstable branch (dashed) */}
            <path
              d={`M ${width / 2} ${height / 2} Q ${width / 2 - 40 * scale} ${height / 2 + 30 * scale} ${width / 2 - 60 * scale} ${height / 2 + 50 * scale}`}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4"
              fill="none"
            />
          </>
        )}

        {type === 'transcritical' && (
          <>
            {/* x = 0 line (changes stability) */}
            <line
              x1={20 * scale}
              y1={height / 2}
              x2={width / 2}
              y2={height / 2}
              stroke="#22c55e"
              strokeWidth={2}
            />
            <line
              x1={width / 2}
              y1={height / 2}
              x2={width - 20 * scale}
              y2={height / 2}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4"
            />
            {/* x = r line (changes stability) */}
            <line
              x1={20 * scale}
              y1={height / 2 + 40 * scale}
              x2={width / 2}
              y2={height / 2}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4"
            />
            <line
              x1={width / 2}
              y1={height / 2}
              x2={width - 20 * scale}
              y2={height / 2 - 40 * scale}
              stroke="#22c55e"
              strokeWidth={2}
            />
          </>
        )}

        {type === 'pitchfork_super' && (
          <>
            {/* x = 0 for r < 0 (stable) */}
            <line
              x1={20 * scale}
              y1={height / 2}
              x2={width / 2}
              y2={height / 2}
              stroke="#22c55e"
              strokeWidth={2}
            />
            {/* x = 0 for r > 0 (unstable) */}
            <line
              x1={width / 2}
              y1={height / 2}
              x2={width - 20 * scale}
              y2={height / 2}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4"
            />
            {/* Upper branch (stable) */}
            <path
              d={`M ${width / 2} ${height / 2} Q ${width / 2 + 30 * scale} ${height / 2 - 25 * scale} ${width - 20 * scale} ${height / 2 - 40 * scale}`}
              stroke="#22c55e"
              strokeWidth={2}
              fill="none"
            />
            {/* Lower branch (stable) */}
            <path
              d={`M ${width / 2} ${height / 2} Q ${width / 2 + 30 * scale} ${height / 2 + 25 * scale} ${width - 20 * scale} ${height / 2 + 40 * scale}`}
              stroke="#22c55e"
              strokeWidth={2}
              fill="none"
            />
          </>
        )}

        {type === 'pitchfork_sub' && (
          <>
            {/* x = 0 for r < 0 (unstable) */}
            <line
              x1={20 * scale}
              y1={height / 2}
              x2={width / 2}
              y2={height / 2}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4"
            />
            {/* x = 0 for r > 0 (stable) */}
            <line
              x1={width / 2}
              y1={height / 2}
              x2={width - 20 * scale}
              y2={height / 2}
              stroke="#22c55e"
              strokeWidth={2}
            />
            {/* Upper branch (unstable) */}
            <path
              d={`M ${width / 2} ${height / 2} Q ${width / 2 - 30 * scale} ${height / 2 - 25 * scale} ${20 * scale} ${height / 2 - 40 * scale}`}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4"
              fill="none"
            />
            {/* Lower branch (unstable) */}
            <path
              d={`M ${width / 2} ${height / 2} Q ${width / 2 - 30 * scale} ${height / 2 + 25 * scale} ${20 * scale} ${height / 2 + 40 * scale}`}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4"
              fill="none"
            />
          </>
        )}

        {/* Bifurcation point */}
        <circle cx={width / 2} cy={height / 2} r={4 * scale} fill="#1f2937" />
      </svg>
      {showLabel && (
        <div className="text-center text-sm text-gray-600 mt-1">{label}</div>
      )}
    </div>
  );
}
