import { useState, useEffect, useCallback } from 'react';
import { type Point } from './FlowConnection';

/**
 * Custom hook to manage connection points for nodes
 * Replaces jQuery DOM manipulation with React state management
 */
export function useConnectionPoints(nodeId: string, portId: string) {
  const [point, setPoint] = useState<Point>({ x: 0, y: 0 });
  
  const updatePosition = useCallback(() => {
    const nodeElement = document.getElementById(`node-${nodeId}`);
    const portElement = document.getElementById(`port-${nodeId}-${portId}`);
    
    if (nodeElement && portElement) {
      const nodeRect = nodeElement.getBoundingClientRect();
      const portRect = portElement.getBoundingClientRect();
      
      // Calculate relative position of port to node
      setPoint({
        x: portRect.left - nodeRect.left + portRect.width / 2,
        y: portRect.top - nodeRect.top + portRect.height / 2,
      });
    }
  }, [nodeId, portId]);
  
  // Calculate position when mounted and on resize
  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    // Recalculate on node position changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'style' || 
            mutation.attributeName === 'class') {
          updatePosition();
          break;
        }
      }
    });
    
    const nodeElement = document.getElementById(`node-${nodeId}`);
    if (nodeElement) {
      observer.observe(nodeElement, { 
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      observer.disconnect();
    };
  }, [nodeId, portId, updatePosition]);
  
  return point;
}

/**
 * Hook to calculate multiple connection points at once
 * Useful when managing connections between multiple nodes
 */
export function useMultipleConnectionPoints(
  connections: Array<{ nodeId: string; portId: string; }>
): Record<string, Point> {
  const [points, setPoints] = useState<Record<string, Point>>({});
  
  useEffect(() => {
    const handlers: Record<string, () => void> = {};
    
    // Calculate positions for each connection
    
    connections.forEach(({ nodeId, portId }) => {
      const key = `${nodeId}-${portId}`;
      
      const updatePosition = () => {
        const nodeElement = document.getElementById(`node-${nodeId}`);
        const portElement = document.getElementById(`port-${nodeId}-${portId}`);
        
        if (nodeElement && portElement) {
          const nodeRect = nodeElement.getBoundingClientRect();
          const portRect = portElement.getBoundingClientRect();
          
          setPoints(prev => ({
            ...prev,
            [key]: {
              x: portRect.left - nodeRect.left + portRect.width / 2,
              y: portRect.top - nodeRect.top + portRect.height / 2
            }
          }));
        }
      };
      
      handlers[key] = updatePosition;
      updatePosition();
    });
    
    // Set up resize listener
    const handleResize = () => {
      Object.values(handlers).forEach(handler => handler());
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [connections]);
  
  return points;
}

export default useConnectionPoints;
