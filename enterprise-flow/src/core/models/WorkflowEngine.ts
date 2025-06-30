import { NodeModel } from './NodeModel';
import type { Connection, Workflow } from './types';

/**
 * WorkflowEngine class
 * Manages execution of workflow nodes and data propagation
 */
export class WorkflowEngine {
  private nodes: Map<string, NodeModel> = new Map();
  private connections: Connection[] = [];
  private executionOrder: string[] = [];
  private workflowId: string = '';
  private workflowName: string = '';
  private workflowDescription: string = '';
  private metadata: Record<string, any> = {};

  /**
   * Add or update a node in the workflow
   */
  public addNode(node: NodeModel): void {
    this.nodes.set(node.getId(), node);
    this.updateExecutionOrder();
  }

  /**
   * Remove a node from the workflow
   */
  public removeNode(nodeId: string): boolean {
    const removed = this.nodes.delete(nodeId);
    
    // Remove any connections to/from this node
    this.connections = this.connections.filter(
      connection => connection.sourceNodeId !== nodeId && connection.targetNodeId !== nodeId
    );
    
    this.updateExecutionOrder();
    return removed;
  }

  /**
   * Get a node by ID
   */
  public getNode(nodeId: string): NodeModel | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all nodes in the workflow
   */
  public getAllNodes(): NodeModel[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Add a connection between nodes
   */
  public addConnection(connection: Connection): void {
    // Validate connection
    const sourceNode = this.nodes.get(connection.sourceNodeId);
    const targetNode = this.nodes.get(connection.targetNodeId);
    
    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found');
    }
    
    // Check if connection already exists
    const connectionExists = this.connections.some(
      conn => 
        conn.sourceNodeId === connection.sourceNodeId && 
        conn.sourceFieldId === connection.sourceFieldId &&
        conn.targetNodeId === connection.targetNodeId && 
        conn.targetFieldId === connection.targetFieldId
    );
    
    if (connectionExists) {
      return;
    }
    
    // Add connection
    this.connections.push(connection);
    
    // Update node connection references
    sourceNode.addConnection(connection.sourceFieldId, connection.id, false);
    targetNode.addConnection(connection.targetFieldId, connection.id, true);
    
    // Mark target node as dirty (needs recomputation)
    targetNode.markDirty();
    
    this.updateExecutionOrder();
  }

  /**
   * Remove a connection
   */
  public removeConnection(connectionId: string): boolean {
    const connectionIndex = this.connections.findIndex(conn => conn.id === connectionId);
    
    if (connectionIndex === -1) {
      return false;
    }
    
    const connection = this.connections[connectionIndex];
    
    // Update node connection references
    const sourceNode = this.nodes.get(connection.sourceNodeId);
    const targetNode = this.nodes.get(connection.targetNodeId);
    
    if (sourceNode) {
      sourceNode.removeConnection(connection.sourceFieldId, connectionId, false);
    }
    
    if (targetNode) {
      targetNode.removeConnection(connection.targetFieldId, connectionId, true);
      targetNode.markDirty();
    }
    
    // Remove connection
    this.connections.splice(connectionIndex, 1);
    
    this.updateExecutionOrder();
    return true;
  }

  /**
   * Get all connections in the workflow
   */
  public getAllConnections(): Connection[] {
    return [...this.connections];
  }

  /**
   * Update execution order based on node dependencies
   * Uses topological sort to determine correct execution order
   */
  private updateExecutionOrder(): void {
    // Create dependency graph
    const graph: Record<string, string[]> = {};
    const nodeIds = Array.from(this.nodes.keys());
    
    // Initialize graph with all nodes
    nodeIds.forEach(nodeId => {
      graph[nodeId] = [];
    });
    
    // Add edges (dependencies)
    this.connections.forEach(connection => {
      const { sourceNodeId, targetNodeId } = connection;
      
      // Target depends on source
      if (!graph[targetNodeId].includes(sourceNodeId)) {
        graph[targetNodeId].push(sourceNodeId);
      }
    });
    
    // Perform topological sort
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];
    
    // Visit function for DFS
    const visit = (nodeId: string): void => {
      // Skip if already visited
      if (visited.has(nodeId)) return;
      
      // Check for cycles
      if (temp.has(nodeId)) {
        console.warn('Cycle detected in workflow graph, execution order may not be optimal');
        return;
      }
      
      // Mark as temporary visited
      temp.add(nodeId);
      
      // Visit dependencies
      for (const depId of graph[nodeId] || []) {
        visit(depId);
      }
      
      // Mark as visited
      temp.delete(nodeId);
      visited.add(nodeId);
      
      // Add to order
      order.push(nodeId);
    };
    
    // Visit all nodes
    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }
    
    // Reverse to get correct order (from dependencies to dependents)
    this.executionOrder = order.reverse();
  }

  /**
   * Execute the workflow - compute all nodes in execution order
   */
  public execute(): void {
    for (const nodeId of this.executionOrder) {
      const node = this.nodes.get(nodeId);
      if (node && node.isDirty()) {
        // Before computation, propagate input values from connections
        this.propagateInputs(node);
        
        // Compute the node
        node.compute();
      }
    }
  }

  /**
   * Propagate input values from source nodes
   */
  private propagateInputs(targetNode: NodeModel): void {
    // Find all connections targeting this node
    const incomingConnections = this.connections.filter(
      conn => conn.targetNodeId === targetNode.getId()
    );
    
    // For each connection, get the value from the source and set it on the target
    for (const connection of incomingConnections) {
      const sourceNode = this.nodes.get(connection.sourceNodeId);
      if (!sourceNode) continue;
      
      const sourceValue = sourceNode.getFieldValue(connection.sourceFieldId, false);
      targetNode.setFieldValue(connection.targetFieldId, sourceValue);
    }
  }

  /**
   * Set workflow metadata
   */
  public setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  /**
   * Get workflow metadata
   */
  public getMetadata(key: string): any {
    return this.metadata[key];
  }

  /**
   * Set workflow properties
   */
  public setWorkflowProperties(id: string, name: string, description: string): void {
    this.workflowId = id;
    this.workflowName = name;
    this.workflowDescription = description;
  }

  /**
   * Clear the workflow
   */
  public clear(): void {
    this.nodes.clear();
    this.connections = [];
    this.executionOrder = [];
  }

  /**
   * Export workflow as a serializable object
   */
  public exportWorkflow(): Workflow {
    return {
      id: this.workflowId,
      name: this.workflowName,
      description: this.workflowDescription,
      nodes: this.getAllNodes().map(node => node.toObject()),
      connections: this.getAllConnections(),
      metadata: {
        ...this.metadata,
        createdAt: this.metadata.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: this.metadata.author || 'System',
        version: this.metadata.version || '1.0.0',
      }
    };
  }

  /**
   * Import workflow from a serialized object
   */
  public importWorkflow(workflow: Workflow): void {
    this.clear();
    
    this.workflowId = workflow.id;
    this.workflowName = workflow.name;
    this.workflowDescription = workflow.description;
    this.metadata = { ...workflow.metadata };
    
    // Import nodes
    workflow.nodes.forEach(nodeObj => {
      const node = NodeModel.fromObject(nodeObj);
      this.addNode(node);
    });
    
    // Import connections
    workflow.connections.forEach(connection => {
      this.addConnection(connection);
    });
  }
}
