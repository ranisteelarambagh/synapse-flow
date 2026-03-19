import { memo, useEffect, useRef } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import { useExecutionStore } from '@/stores/executionStore';

interface FlowEdgeData {
  animated?: boolean;
  label?: string;
}

function DataParticle({
  path,
  delay,
  color,
}: {
  path: string;
  delay: number;
  color: string;
}) {
  return (
    <circle r={3} fill={color} opacity={0.9}>
      <animateMotion
        dur="1.4s"
        begin={`${delay}s`}
        repeatCount="indefinite"
        path={path}
        rotate="auto"
      />
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        dur="1.4s"
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
      <animate
        attributeName="r"
        values="2;3;2"
        dur="1.4s"
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}

function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<FlowEdgeData>) {
  const isStreaming = useExecutionStore(s => s.isStreaming);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = isStreaming || data?.animated;
  const color = selected ? '#6C63FF' : isActive ? '#00D4AA' : '#3A3D4A';
  const strokeWidth = selected ? 2 : 1.5;

  return (
    <>
      {/* Glow layer when active */}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke="#00D4AA"
          strokeWidth={8}
          strokeOpacity={0.12}
          strokeLinecap="round"
        />
      )}

      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth,
          strokeDasharray: isActive ? '8 4' : undefined,
          animation: isActive ? 'edge-flow 0.6s linear infinite' : undefined,
          transition: 'stroke 200ms ease, stroke-width 200ms ease',
        }}
      />

      {/* Data-flow particles when streaming */}
      {isActive && (
        <svg overflow="visible">
          <DataParticle path={edgePath} delay={0} color="#00D4AA" />
          <DataParticle path={edgePath} delay={0.47} color="#6C63FF" />
          <DataParticle path={edgePath} delay={0.94} color="#00D4AA" />
        </svg>
      )}

      {/* Edge label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
            className="pointer-events-none absolute px-1.5 py-0.5 text-[9px] font-ui rounded bg-syn-raised border border-syn-border text-syn-text-muted"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(FlowEdge);
