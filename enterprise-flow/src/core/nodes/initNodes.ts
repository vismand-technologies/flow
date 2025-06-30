import registerAIPromptNode from './AIPromptNode';
import registerIfElseNode from './IfElseNode';
import registerRestApiNode from './RestApiNode';
import { NodeRegistry } from '../models/NodeRegistry';

/**
 * Initialize all node types and register them with the NodeRegistry
 * This function should be called on application startup
 */
export function initializeNodeTypes(): void {
  console.log('Initializing node types...');
  
  // Clear any existing registrations to prevent duplicates
  const registry = NodeRegistry.getInstance();
  registry.clear();
  
  // Register all custom node types
  registerAIPromptNode();
  registerIfElseNode();
  registerRestApiNode();
  
  // Log the registered node types for debugging
  const nodeTypes = registry.getAllNodeTypes();
  console.log(`Registered ${nodeTypes.length} node types:`, nodeTypes);
}

/**
 * Initialize the workflow engine with predefined node types
 * This should be called when the application loads
 */
export function initializeWorkflowSystem(): void {
  // Register all node types
  initializeNodeTypes();
  
  console.log('Workflow system initialized');
}
