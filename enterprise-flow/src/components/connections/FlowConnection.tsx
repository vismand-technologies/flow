import React from 'react';
import { styled } from '@mui/material/styles';

// Define the point interface for connection coordinates
export interface Point {
  x: number;
  y: number;
}

// Props for the FlowConnection component
export interface FlowConnectionProps {
  id: string;
  sourcePoint: Point;
  targetPoint: Point;
  isAnimated?: boolean;
  isSelected?: boolean;
  curvature?: number;
  className?: string;
  onClick?: (id: string) => void;
}

// Create a styled SVG path for the connection line
const ConnectionPath = styled('path')(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    strokeWidth: 2,
    stroke: theme.palette.primary.main,
  },
}));

/**
 * FlowConnection component renders SVG bezier curve paths between nodes
 * Preserves the visual styling from the original Flow framework
 */
export const FlowConnection: React.FC<FlowConnectionProps> = ({
  id,
  sourcePoint,
  targetPoint,
  isAnimated = false,
  isSelected = false,
  curvature = 50,
  className = '',
  onClick,
}) => {
  // Generate the bezier curve path between points
  const generatePath = (): string => {
    const dx = targetPoint.x - sourcePoint.x;
    const dy = targetPoint.y - sourcePoint.y;
    
    // Calculate control points for the bezier curve
    // Apply curvature to control points based on the distance and direction
    const controlPoint1: Point = {
      x: sourcePoint.x + (dx * curvature / 100),
      y: sourcePoint.y + (dy * 0.2), // Use dy to slightly adjust vertical position
    };
    
    const controlPoint2: Point = {
      x: targetPoint.x - (dx * curvature / 100),
      y: targetPoint.y - (dy * 0.2), // Use dy for vertical adjustment of second control point
    };
    
    // Generate the SVG path command
    return `M ${sourcePoint.x},${sourcePoint.y} C ${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${targetPoint.x},${targetPoint.y}`;
  };
  
  // Generate CSS classes for the connection
  const connectionClasses = [
    'flow-connection',
    isAnimated ? 'flow-connection-animated' : '',
    isSelected ? 'flow-connection-selected' : '',
    className,
  ].filter(Boolean).join(' ');
  
  // Handle connection click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(id);
    }
  };
  
  return (
    <ConnectionPath 
      className={connectionClasses}
      d={generatePath()}
      fill="none"
      onClick={handleClick}
      data-connection-id={id}
    />
  );
};

/**
 * FlowConnectionCanvas wraps connection paths in an SVG container
 */
export interface FlowConnectionCanvasProps {
  width: number;
  height: number;
  children: React.ReactNode;
  className?: string;
}

export const FlowConnectionCanvas: React.FC<FlowConnectionCanvasProps> = ({
  width,
  height,
  children,
  className = '',
}) => {
  return (
    <svg 
      className={`flow-connection-canvas ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1,
        width: '100%',  // Make SVG responsive
        height: '100%', // Make SVG responsive
      }}
    >
      <g className="flow-connections-layer">
        {children}
      </g>
    </svg>
  );
};

export default FlowConnection;
