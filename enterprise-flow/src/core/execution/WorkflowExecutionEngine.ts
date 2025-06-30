import type { Node, Connection, Workflow } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';
import { getErrorMessage } from '../utils/errorHandling';

// Simple TypeScript event emitter implementation
type EventHandler = (...args: any[]) => void;

class TypedEventEmitter {
  private events: Record<string, EventHandler[]> = {};

  on(event: string, handler: EventHandler): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
  }

  off(event: string, handler: EventHandler): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(h => h !== handler);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(handler => handler(...args));
  }
}

// Define execution event types
export type NodeStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface NodeExecutionStatus {
  id: string;
  name: string;
  type: string;
  status: NodeStatus;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  data?: Record<string, any>;
}

export interface WorkflowExecutionStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  nodeStatuses: Record<string, NodeExecutionStatus>;
  progress: number; // Percentage complete (0-100)
  error?: string;
}

// Define execution events as string literals for better TypeScript compatibility
export const ExecutionEvents = {
  WORKFLOW_START: 'workflow:start',
  WORKFLOW_COMPLETE: 'workflow:complete',
  WORKFLOW_ERROR: 'workflow:error',
  NODE_START: 'node:start',
  NODE_COMPLETE: 'node:complete',
  NODE_ERROR: 'node:error',
  EXECUTION_PROGRESS: 'execution:progress',
  EXECUTION_STATUS: 'execution:status'
} as const;

export type ExecutionEventType = typeof ExecutionEvents[keyof typeof ExecutionEvents];

/**
 * WorkflowExecutionEngine
 * Handles dependency resolution and execution of nodes in a workflow
 */
export class WorkflowExecutionEngine extends TypedEventEmitter {
  private static instance: WorkflowExecutionEngine;
  
  /**
   * Get the singleton instance of WorkflowExecutionEngine
   * @returns The singleton instance
   */
  public static getInstance(): WorkflowExecutionEngine {
    if (!WorkflowExecutionEngine.instance) {
      WorkflowExecutionEngine.instance = new WorkflowExecutionEngine();
    }
    return WorkflowExecutionEngine.instance;
  }
  private workflow: Workflow | null = null;
  private nodeMap: Map<string, Node> = new Map();
  private connectionMap: Map<string, Connection[]> = new Map(); // Map of nodeId -> connections
  private inputConnectionMap: Map<string, Connection[]> = new Map(); // Map of nodeId -> incoming connections
  private registry: NodeRegistry;
  private executionQueue: string[] = []; // Node IDs to be executed
  private executing: boolean = false;
  private nodeResults: Map<string, any> = new Map(); // Cache of node execution results
  private executionStatus: WorkflowExecutionStatus = {
    status: 'idle',
    nodeStatuses: {},
    progress: 0
  };

  constructor() {
    super();
    this.registry = NodeRegistry.getInstance();
  }

  /**
   * Load a workflow for execution
   * @param workflow The workflow to load
   */
  public loadWorkflow(workflow: Workflow): void {
    this.workflow = workflow;
    this.resetState();
    this.buildNodeMap();
    this.buildConnectionMaps();
    
    // Initialize node statuses
    if (workflow.nodes) {
      workflow.nodes.forEach(node => {
        this.executionStatus.nodeStatuses[node.id] = {
          id: node.id,
          name: node.data?.label || 'Unnamed Node',
          type: node.type || 'unknown',
          status: 'idle'
        };
      });
    }
    
    // Emit initial status
    this.emit(ExecutionEvents.EXECUTION_STATUS, { ...this.executionStatus });
  }

  /**
   * Reset the execution state
   */
  private resetState(): void {
    this.nodeMap.clear();
    this.connectionMap.clear();
    this.inputConnectionMap.clear();
    this.executionQueue = [];
    this.nodeResults.clear();
    this.executing = false;
    this.executionStatus = {
      status: 'idle',
      nodeStatuses: {},
      progress: 0
    };
  }
  
  /**
   * Update a node's execution status
   * @param nodeId ID of the node to update
   * @param updates Status updates to apply
   */
  private updateNodeStatus(nodeId: string, updates: Partial<NodeExecutionStatus>): void {
    if (!this.executionStatus.nodeStatuses[nodeId]) {
      return;
    }
    
    this.executionStatus.nodeStatuses[nodeId] = {
      ...this.executionStatus.nodeStatuses[nodeId],
      ...updates
    };
    
    // Emit updated execution status
    this.emit(ExecutionEvents.EXECUTION_STATUS, { ...this.executionStatus });
  }
  
  /**
   * Get the current execution status
   * @returns Current workflow execution status
   */
  public getExecutionStatus(): WorkflowExecutionStatus {
    return { ...this.executionStatus };
  }

  /**
   * Build a map of nodes by ID for quick lookup
   */
  private buildNodeMap(): void {
    if (!this.workflow) return;

    this.workflow.nodes.forEach(node => {
      this.nodeMap.set(node.id, node);
    });
  }

  /**
   * Build maps of connections grouped by source and target nodeId
   */
  private buildConnectionMaps(): void {
    if (!this.workflow) return;

    // Initialize connection maps for each node
    this.workflow.nodes.forEach(node => {
      this.connectionMap.set(node.id, []);
      this.inputConnectionMap.set(node.id, []);
    });

    // Populate connection maps
    this.workflow.connections.forEach(connection => {
      // Add to outgoing connections map
      const sourceNodeId = connection.sourceNodeId;
      const outgoingConnections = this.connectionMap.get(sourceNodeId) || [];
      outgoingConnections.push(connection);
      this.connectionMap.set(sourceNodeId, outgoingConnections);
      
      // Add to incoming connections map
      const targetNodeId = connection.targetNodeId;
      const incomingConnections = this.inputConnectionMap.get(targetNodeId) || [];
      incomingConnections.push(connection);
      this.inputConnectionMap.set(targetNodeId, incomingConnections);
    });
  }

  /**
   * Find nodes with no incoming connections (start nodes)
   * @returns Array of node IDs that have no incoming connections
   */
  private findStartNodes(): string[] {
    const startNodes: string[] = [];
    
    if (!this.workflow) return startNodes;
    
    this.workflow.nodes.forEach(node => {
      const incomingConnections = this.inputConnectionMap.get(node.id) || [];
      if (incomingConnections.length === 0) {
        startNodes.push(node.id);
      }
    });
    
    return startNodes;
  }

  /**
   * Get inputs for a node from its incoming connections
   * @param node The node to get inputs for
   * @returns Object containing input values by input name
   */
  private getNodeInputs(node: Node): Record<string, any> {
    const inputs: Record<string, any> = {};
    const incomingConnections = this.inputConnectionMap.get(node.id) || [];
    
    incomingConnections.forEach(connection => {
      const sourceNodeId = connection.sourceNodeId;
      const sourceFieldId = connection.sourceFieldId;
      const targetFieldId = connection.targetFieldId;
      
      // Map field IDs to input/output names
      // In a real implementation, we would have a proper mapping between field IDs and names
      // For now, we'll use the field IDs as the input/output names
      const sourceOutputName = sourceFieldId;
      const targetInputName = targetFieldId;
      
      // Get the result from the source node
      const sourceResult = this.nodeResults.get(sourceNodeId);
      
      if (sourceResult !== undefined && sourceOutputName && targetInputName) {
        // If the source has a specific output field, use that
        if (typeof sourceResult === 'object' && sourceResult !== null && sourceOutputName in sourceResult) {
          inputs[targetInputName] = sourceResult[sourceOutputName];
        } else {
          // Otherwise use the entire result
          inputs[targetInputName] = sourceResult;
        }
      }
    });
    
    return inputs;
  }

  /**
   * Execute a specific node
   * @param nodeId ID of the node to execute
   * @returns Promise that resolves when execution is complete
   */
  public async executeNode(nodeId: string): Promise<void> {
    const node = this.nodeMap.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Get the node implementation from registry
    const nodeImpl = this.registry.getNodeImplementation(node.type);
    if (!nodeImpl) {
      throw new Error(`No implementation found for node type: ${node.type}`);
    }

    // Update node status to running
    this.updateNodeStatus(nodeId, {
      status: 'running',
      startTime: new Date()
    });
    
    // Emit node start event
    this.emit(ExecutionEvents.NODE_START, { ...this.executionStatus.nodeStatuses[nodeId] });

    // Execute the node
    try {
      const inputs = this.getNodeInputs(node);
      const result = await nodeImpl.execute(node, inputs);
      
      // Cache the result
      this.nodeResults.set(nodeId, result);
      
      // Update node status to completed
      this.updateNodeStatus(nodeId, {
        status: 'completed',
        endTime: new Date(),
        data: result
      });
      
      // Emit node complete event
      this.emit(ExecutionEvents.NODE_COMPLETE, { 
        ...this.executionStatus.nodeStatuses[nodeId],
        result
      });

      return result;
    } catch (error) {
      // Update node status to failed
      this.updateNodeStatus(nodeId, {
        status: 'failed',
        endTime: new Date(),
        error: getErrorMessage(error, `Error executing node ${node.type}`)
      });
      
      // Emit node error event
      this.emit(ExecutionEvents.NODE_ERROR, { 
        ...this.executionStatus.nodeStatuses[nodeId],
        error: this.executionStatus.nodeStatuses[nodeId].error
      });
      
      console.error(`Error executing node ${nodeId}:`, error);
      throw error;
    }
  }

  /**
   * Execute the entire workflow
   * @returns Promise that resolves when execution is complete
   */
  public async executeWorkflow(): Promise<void> {
    if (!this.workflow) {
      throw new Error('No workflow loaded');
    }

    if (this.executing) {
      throw new Error('Workflow execution already in progress');
    }

    this.executing = true;
    
    // Reset node results
    this.nodeResults.clear();
    
    // Find start nodes (nodes with no incoming connections)
    const startNodes = this.findStartNodes();
    if (startNodes.length === 0) {
      throw new Error('No start nodes found in workflow');
    }
    
    // Initialize execution queue with start nodes
    this.executionQueue = [...startNodes];
    
    // Update workflow status to running
    this.executionStatus.status = 'running';
    this.executionStatus.startTime = new Date();
    this.executionStatus.progress = 0;
    
    // Emit workflow start event
    this.emit(ExecutionEvents.WORKFLOW_START, { ...this.executionStatus });

    try {
      const totalNodes = this.workflow.nodes.length;
      let completedNodes = 0;
      
      // Process execution queue
      while (this.executionQueue.length > 0) {
        const nodeId = this.executionQueue.shift();
        if (!nodeId) continue;

        // Skip nodes that have already been executed
        if (this.executionStatus.nodeStatuses[nodeId]?.status === 'completed') {
          continue;
        }

        // Execute the node
        await this.executeNode(nodeId);
        
        // Update progress
        completedNodes++;
        this.executionStatus.progress = Math.round((completedNodes / totalNodes) * 100);
        this.emit(ExecutionEvents.EXECUTION_PROGRESS, { 
          progress: this.executionStatus.progress,
          completedNodes,
          totalNodes
        });
        
        // Queue dependent nodes for execution
        this.queueDependentNodes(nodeId);
      }
      
      // Workflow completed successfully
      this.executionStatus.status = 'completed';
      this.executionStatus.endTime = new Date();
      this.executionStatus.progress = 100;
      this.emit(ExecutionEvents.WORKFLOW_COMPLETE, { ...this.executionStatus });
      
    } catch (error) {
      // Workflow failed
      this.executionStatus.status = 'failed';
      this.executionStatus.endTime = new Date();
      this.executionStatus.error = getErrorMessage(error, 'Workflow execution failed');
      
      this.emit(ExecutionEvents.WORKFLOW_ERROR, { 
        ...this.executionStatus,
        error: this.executionStatus.error
      });
      
      console.error('Workflow execution error:', error);
      throw error;
    } finally {
      this.executing = false;
    }
  }

  /**
   * Queue dependent nodes for execution
   * @param nodeId ID of the completed node
   */
  private queueDependentNodes(nodeId: string): void {
    const connections = this.connectionMap.get(nodeId) || [];
    
    // Get unique target node IDs
    const targetNodeIds = new Set<string>();
    connections.forEach(conn => {
      targetNodeIds.add(conn.targetNodeId);
    });
    
    // Check if all dependencies are satisfied for each target node
    targetNodeIds.forEach(targetId => {
      if (this.areDependenciesSatisfied(targetId)) {
        // Add to execution queue if not already there
        if (!this.executionQueue.includes(targetId)) {
          this.executionQueue.push(targetId);
        }
      }
    });
  }

  /**
   * Check if all dependencies for a node are satisfied
   * @param nodeId ID of the node to check
   * @returns True if all dependencies are satisfied
   */
  private areDependenciesSatisfied(nodeId: string): boolean {
    const incomingConnections = this.inputConnectionMap.get(nodeId) || [];
    
    // Check if all source nodes are completed
    for (const connection of incomingConnections) {
      const sourceNodeId = connection.sourceNodeId;
      const sourceStatus = this.executionStatus.nodeStatuses[sourceNodeId]?.status;
      
      if (sourceStatus !== 'completed') {
        return false;
      }
    }
    
    return true;
  }
}

// Create and export a singleton instance
export const workflowExecutionEngine = WorkflowExecutionEngine.getInstance();
