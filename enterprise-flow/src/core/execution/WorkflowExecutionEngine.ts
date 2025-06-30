import type { Node, Connection, Workflow } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';

/**
 * WorkflowExecutionEngine
 * Handles dependency resolution and execution of nodes in a workflow
 */
export class WorkflowExecutionEngine {
  private workflow: Workflow | null = null;
  private nodeMap: Map<string, Node> = new Map();
  private connectionMap: Map<string, Connection[]> = new Map(); // Map of nodeId -> connections
  private registry: NodeRegistry;
  private executionQueue: string[] = []; // Node IDs to be executed
  private executing: boolean = false;

  constructor() {
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
    this.buildConnectionMap();
  }

  /**
   * Reset the execution state
   */
  private resetState(): void {
    this.nodeMap.clear();
    this.connectionMap.clear();
    this.executionQueue = [];
    this.executing = false;
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
   * Build a map of connections grouped by source nodeId
   */
  private buildConnectionMap(): void {
    if (!this.workflow) return;

    // Initialize connection map for each node
    this.workflow.nodes.forEach(node => {
      this.connectionMap.set(node.id, []);
    });

    // Populate connection map
    this.workflow.connections.forEach(connection => {
      const sourceNodeId = connection.sourceNodeId;
      const connections = this.connectionMap.get(sourceNodeId) || [];
      connections.push(connection);
      this.connectionMap.set(sourceNodeId, connections);
    });
  }

  /**
   * Execute a specific node and its dependencies
   * @param nodeId ID of the node to execute
   * @returns Promise that resolves when execution is complete
   */
  public async executeNode(nodeId: string): Promise<void> {
    const node = this.nodeMap.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Build dependencies
    const dependencyOrder = this.resolveDependencies(nodeId);
    
    // Queue dependencies for execution
    this.executionQueue = dependencyOrder;
    
    // Start execution if not already running
    if (!this.executing) {
      await this.executeQueue();
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

    // Find terminal nodes (nodes with no outgoing connections)
    const terminalNodes: string[] = [];
    this.workflow.nodes.forEach(node => {
      const connections = this.connectionMap.get(node.id) || [];
      if (connections.length === 0) {
        terminalNodes.push(node.id);
      }
    });

    // If no terminal nodes, execute all nodes
    if (terminalNodes.length === 0) {
      this.executionQueue = this.workflow.nodes.map(node => node.id);
    } else {
      // Build dependency order from terminal nodes
      const allDependencies: string[] = [];
      terminalNodes.forEach(nodeId => {
        const dependencies = this.resolveDependencies(nodeId);
        dependencies.forEach(depId => {
          if (!allDependencies.includes(depId)) {
            allDependencies.push(depId);
          }
        });
      });
      this.executionQueue = allDependencies;
    }

    // Start execution
    return this.executeQueue();
  }

  /**
   * Execute nodes in the queue
   */
  private async executeQueue(): Promise<void> {
    if (this.executing || this.executionQueue.length === 0) {
      return;
    }

    this.executing = true;

    try {
      while (this.executionQueue.length > 0) {
        const nodeId = this.executionQueue.shift()!;
        await this.executeNodeComputation(nodeId);
      }
    } finally {
      this.executing = false;
    }
  }

  /**
   * Execute computation for a single node
   */
  private async executeNodeComputation(nodeId: string): Promise<void> {
    const node = this.nodeMap.get(nodeId);
    if (!node) return;

    // Get compute function for this node type
    const nodeDef = this.registry.getNodeDefinition(node.type);
    if (!nodeDef || !nodeDef.compute) {
      console.warn(`No compute function for node type: ${node.type}`);
      return;
    }

    // Execute the node's compute function
    try {
      nodeDef.compute(node);
      
      // Propagate changes to connected nodes
      this.propagateChanges(nodeId);
    } catch (error) {
      console.error(`Error executing node ${nodeId}:`, error);
    }
  }

  /**
   * Propagate changes from a node to its connected nodes
   */
  private propagateChanges(nodeId: string): void {
    const connections = this.connectionMap.get(nodeId) || [];
    
    // Get unique target node IDs
    const targetNodeIds = new Set<string>();
    connections.forEach(conn => {
      targetNodeIds.add(conn.targetNodeId);
    });
    
    // Mark target nodes as dirty
    targetNodeIds.forEach(targetId => {
      const targetNode = this.nodeMap.get(targetId);
      if (targetNode) {
        // In a real implementation, we would mark the node as dirty
        // For now, just add to execution queue
        if (!this.executionQueue.includes(targetId)) {
          this.executionQueue.push(targetId);
        }
      }
    });
  }

  /**
   * Resolve dependencies for a node in execution order
   * @param nodeId ID of the node to resolve dependencies for
   * @returns Array of node IDs in execution order
   */
  private resolveDependencies(nodeId: string): string[] {
    // Use a set to track visited nodes (prevents infinite recursion for cycles)
    const visited = new Set<string>();
    // Use array to maintain order
    const ordered: string[] = [];
    
    // Helper function to recursively resolve dependencies
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      // Find input connections to this node
      const inputConnections = this.findInputConnections(id);
      
      // Visit all dependencies first
      inputConnections.forEach(conn => {
        visit(conn.sourceNodeId);
      });
      
      // Add this node to ordered list
      ordered.push(id);
    };
    
    // Start resolving from the target node
    visit(nodeId);
    return ordered;
  }

  /**
   * Find all input connections to a node
   * @param nodeId The node ID to find inputs for
   * @returns Array of connections that target this node
   */
  private findInputConnections(nodeId: string): Connection[] {
    if (!this.workflow) return [];
    
    return this.workflow.connections.filter(conn => conn.targetNodeId === nodeId);
  }
}

// Export singleton instance
export const workflowExecutionEngine = new WorkflowExecutionEngine();
