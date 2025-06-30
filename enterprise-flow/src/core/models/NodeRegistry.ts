import { type NodeDefinition, NodeCategory } from './types';

/**
 * NodeRegistry class
 * Handles registration and retrieval of node types
 */
export class NodeRegistry {
  private static instance: NodeRegistry;
  private nodeDefinitions: Map<string, NodeDefinition> = new Map();
  private nodesByCategory: Map<NodeCategory, Set<string>> = new Map();

  // Private constructor for singleton pattern
  private constructor() {
    // Initialize category sets
    Object.values(NodeCategory).forEach(category => {
      this.nodesByCategory.set(category, new Set());
    });
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
    }
    return NodeRegistry.instance;
  }

  /**
   * Register a new node type
   */
  public registerNodeType(definition: NodeDefinition): void {
    // Validate definition
    if (!definition.type || !definition.category || !definition.name) {
      console.error('Invalid node definition:', definition);
      throw new Error('Node definition must have type, category, and name');
    }

    // Check for duplicates
    if (this.nodeDefinitions.has(definition.type)) {
      console.warn(`Node type '${definition.type}' already registered. Overwriting.`);
    }

    // Register the node type
    this.nodeDefinitions.set(definition.type, definition);
    
    // Add to category index
    const categorySet = this.nodesByCategory.get(definition.category);
    if (categorySet) {
      categorySet.add(definition.type);
    } else {
      this.nodesByCategory.set(definition.category, new Set([definition.type]));
    }
  }

  /**
   * Unregister a node type
   */
  public unregisterNodeType(type: string): boolean {
    const definition = this.nodeDefinitions.get(type);
    if (!definition) {
      return false;
    }

    // Remove from category index
    const categorySet = this.nodesByCategory.get(definition.category);
    if (categorySet) {
      categorySet.delete(type);
    }

    // Remove from definitions map
    return this.nodeDefinitions.delete(type);
  }

  /**
   * Get a node definition by type
   */
  public getNodeDefinition(type: string): NodeDefinition | undefined {
    return this.nodeDefinitions.get(type);
  }

  /**
   * Get all registered node types
   */
  public getAllNodeTypes(): string[] {
    return Array.from(this.nodeDefinitions.keys());
  }

  /**
   * Get all node types in a specific category
   */
  public getNodeTypesByCategory(category: NodeCategory): string[] {
    const categorySet = this.nodesByCategory.get(category);
    if (!categorySet) {
      return [];
    }
    return Array.from(categorySet);
  }

  /**
   * Get all node definitions
   */
  public getAllNodeDefinitions(): NodeDefinition[] {
    return Array.from(this.nodeDefinitions.values());
  }

  /**
   * Get all node definitions in a specific category
   */
  public getNodeDefinitionsByCategory(category: NodeCategory): NodeDefinition[] {
    const types = this.getNodeTypesByCategory(category);
    return types.map(type => this.nodeDefinitions.get(type)!).filter(Boolean);
  }

  /**
   * Check if a node type is registered
   */
  public hasNodeType(type: string): boolean {
    return this.nodeDefinitions.has(type);
  }

  /**
   * Clear all registered node types
   */
  public clear(): void {
    this.nodeDefinitions.clear();
    Object.values(NodeCategory).forEach(category => {
      this.nodesByCategory.set(category, new Set());
    });
  }
}
