import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import type { ReactNode } from 'react';
// Define the props for the Node component
export interface FlowNodeProps {
  id: string;
  title: string;
  type?: string;
  selected?: boolean;
  selecting?: boolean;
  hasAnimation?: boolean;
  noInputs?: boolean;
  width?: '80' | '120' | '150' | '200' | '230';
  ratio?: '50-50' | '80-20' | '25-50-25';
  children?: ReactNode;
  inputs?: ReactNode;
  outputs?: ReactNode;
  center?: ReactNode;
  onSelect?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Create a styled component for the node
const StyledNodePaper = styled(Paper)(() => ({
  position: 'relative',
  minHeight: '30px',
  userSelect: 'none',
}));

/**
 * FlowNode component that preserves the visual language of the original Flow framework
 * This component follows the styling found in the original _nodes.sass file
 */
export const FlowNode: React.FC<FlowNodeProps> = ({
  id,
  title,
  type,
  selected = false,
  selecting = false,
  hasAnimation = false,
  noInputs = false,
  width = '150',
  ratio = '50-50',
  children,
  inputs,
  outputs,
  center,
  onSelect,
  className = '',
  style,
}) => {
  // Generate the CSS classes based on props
  const nodeClasses = [
    'flow-node',
    `flow-width-${width}`,
    `flow-ratio-${ratio}`,
    selected ? 'flow-node-selected' : '',
    selecting ? 'flow-node-selecting' : '',
    hasAnimation ? 'flow-node-has-animation' : '',
    noInputs ? 'flow-node-no-inputs' : '',
    type ? `flow-node-${type}` : '',
    className,
  ].filter(Boolean).join(' ');

  // Handle node selection
  const handleClick = () => {
    if (onSelect) {
      onSelect(id);
    }
  };

  return (
    <StyledNodePaper
      className={nodeClasses}
      onClick={handleClick}
      style={style}
      elevation={1}
      data-node-id={id}
    >
      {title && (
        <Box className="flow-node-title" sx={{ mb: 1 }}>
          <Typography variant="h6" component="h3">
            {title}
          </Typography>
        </Box>
      )}
      
      {children ? (
        // If children are provided, render them directly
        <Box className="flow-node-content">{children}</Box>
      ) : (
        // Otherwise use the inputs/outputs/center pattern
        <Box className="flow-node-content" sx={{ display: 'flex', width: '100%' }}>
          {/* Inputs section */}
          {!noInputs && (
            <Box className="flow-node-inputs">
              {inputs}
            </Box>
          )}
          
          {/* Center section - only rendered if provided and using the appropriate ratio */}
          {center && ratio === '25-50-25' && (
            <Box className="flow-node-center">
              {center}
            </Box>
          )}
          
          {/* Outputs section */}
          <Box className="flow-node-outputs">
            {outputs}
          </Box>
        </Box>
      )}
    </StyledNodePaper>
  );
};

/**
 * NodeField component for rendering connection points in the node
 */
interface NodeFieldProps {
  name: string;
  isInput?: boolean;
  isTarget?: boolean;
  isHovered?: boolean;
  children?: ReactNode;
  onConnect?: (name: string) => void;
  className?: string;
}

export const NodeField: React.FC<NodeFieldProps> = ({
  name,
  isInput = false,
  isTarget = false,
  isHovered = false,
  children,
  onConnect,
  className = '',
}) => {
  // Generate field classes
  const fieldClasses = [
    'flow-node-field',
    isTarget ? 'flow-field-target' : '',
    isHovered ? 'flow-field-hover' : '',
    className,
  ].filter(Boolean).join(' ');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConnect) {
      onConnect(name);
    }
  };

  return (
    <Box 
      className={fieldClasses} 
      onClick={handleClick}
      data-field-name={name}
    >
      {isInput ? (
        // Input field with connector before label
        <>
          <span className="flow-field-connector" />
          <Typography variant="body2" component="span">
            {children || name}
          </Typography>
        </>
      ) : (
        // Output field with connector after label
        <>
          <Typography variant="body2" component="span">
            {children || name}
          </Typography>
          <span className="flow-field-connector" />
        </>
      )}
    </Box>
  );
};

export default FlowNode;
