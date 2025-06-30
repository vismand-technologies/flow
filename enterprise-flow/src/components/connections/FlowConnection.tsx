import React, { useRef, useState, useEffect } from 'react';
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
 * Optimized with React.memo for performance
 */
export const FlowConnection = React.memo<FlowConnectionProps>(({
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
});

/**
 * FlowConnectionCanvas wraps connection paths in an SVG container
 * Uses ResizeObserver for responsive connections
 */
export interface FlowConnectionCanvasProps {
  width?: number;
  height?: number;
  children: React.ReactNode;
  className?: string;
  onResize?: (width: number, height: number) => void;
}

// Styled SVG path with proper theme integration
const StyledSVG = styled('svg')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  pointerEvents: 'none',
  zIndex: 1,
  width: '100%', 
  height: '100%',
  '& path': {
    pointerEvents: 'auto',
    stroke: theme.palette.mode === 'dark' ? '#646464' : '#999999',
    strokeWidth: 1,
    transition: 'stroke 0.2s, stroke-width 0.2s',
  },
  '& path.flow-connection-selected': {
    stroke: theme.palette.primary.main,
    strokeWidth: 2,
  },
  '& path.flow-connection-animated': {
    strokeDasharray: '5,5',
    animation: 'flowDashOffset 0.5s linear infinite',
  },
  '@keyframes flowDashOffset': {
    '0%': { strokeDashoffset: 0 },
    '100%': { strokeDashoffset: 10 },
  },
}));

/**
 * FlowConnectionCanvas component with improved responsive behavior
 * Uses React refs and ResizeObserver for automatic sizing
 */
export const FlowConnectionCanvas = React.memo<FlowConnectionCanvasProps>(({ 
  width: initialWidth,
  height: initialHeight,
  children, 
  className = '',
  onResize
}) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ 
    width: initialWidth || 800, 
    height: initialHeight || 600 
  });
  
  // Use ResizeObserver for responsive connections
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          const newWidth = parent.clientWidth;
          const newHeight = parent.clientHeight;
          setDimensions({ width: newWidth, height: newHeight });
          
          if (onResize) {
            onResize(newWidth, newHeight);
          }
        }
      }
    };
    
    const observer = new ResizeObserver(updateDimensions);
    
    if (canvasRef.current?.parentElement) {
      observer.observe(canvasRef.current.parentElement);
    }
    
    // Initial measurement
    updateDimensions();
    
    return () => observer.disconnect();
  }, [onResize]);

  return (
    <StyledSVG 
      ref={canvasRef}
      className={`flow-connection-canvas ${className}`}
      width={dimensions.width}
      height={dimensions.height}
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <g className="flow-connections-layer">
        {children}
      </g>
    </StyledSVG>
  );
});

export default FlowConnection;
