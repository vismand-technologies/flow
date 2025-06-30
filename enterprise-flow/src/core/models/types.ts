/**
 * Core type definitions for the Enterprise AI Workflow system
 */

// Field types supported by the system
export const FieldType = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  ARRAY: 'array',
  ANY: 'any',
  // Add more field types as needed for business processes and AI
  JSON: 'json',
  DATE: 'date',
  DOCUMENT: 'document',
  AI_PROMPT: 'ai_prompt',
  AI_RESPONSE: 'ai_response',
} as const;

export type FieldType = typeof FieldType[keyof typeof FieldType];

// Direction of the field (input or output)
export const FieldDirection = {
  INPUT: 'input',
  OUTPUT: 'output',
} as const;

export type FieldDirection = typeof FieldDirection[keyof typeof FieldDirection];

// Base field definition
export interface FieldDefinition {
  id: string;
  name: string;
  type: FieldType;
  direction: FieldDirection;
  required?: boolean;
  defaultValue?: any;
  default?: any; // Legacy alias for defaultValue
  description?: string;
  options?: string[]; // Available options for selection fields
}

// Field instance with value
export interface Field extends FieldDefinition {
  nodeId: string;
  value: any;
  connections: string[]; // IDs of connected fields
}

// Node categories for organization
export const NodeCategory = {
  CONTROL_FLOW: 'Control Flow',
  DATA_PROCESSING: 'Data Processing',
  INTEGRATION: 'Integration',
  AI_AGENT: 'AI Agent',
  BUSINESS_PROCESS: 'Business Process',
} as const;

export type NodeCategory = typeof NodeCategory[keyof typeof NodeCategory];

// Node definition used for registration
export interface NodeDefinition {
  type: string;
  category: NodeCategory;
  name: string;
  description: string;
  inputs: FieldDefinition[];
  outputs: FieldDefinition[];
  initialize?: (node: Node) => void;
  compute?: (node: Node) => void;
  nodeClass?: any; // Constructor for the node class
  icon?: string; // Material UI icon name
}

// Node instance in the workflow
export interface Node {
  id: string;
  type: string;
  name: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    inputs: Record<string, Field>;
    outputs: Record<string, Field>;
    [key: string]: any; // Additional node-specific data
  };
  width?: number;
  height?: number;
}

// Interface for node updates, allowing partial updates
export interface NodeUpdate {
  id: string; // ID of the node to update
  changes?: Partial<Omit<Node, 'id'>>; // Changes to apply to the node
  [key: string]: any; // Allow passing other properties directly
}

// Connection between nodes
export interface Connection {
  id: string;
  sourceNodeId: string;
  sourceFieldId: string;
  targetNodeId: string;
  targetFieldId: string;
}

// Complete workflow definition
export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  connections: Connection[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    author: string;
    version: string;
    [key: string]: any; // Additional metadata
  };
}
