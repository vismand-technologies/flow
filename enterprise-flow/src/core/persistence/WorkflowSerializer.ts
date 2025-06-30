import type { Workflow } from '../models/types';
import { nanoid } from 'nanoid';

/**
 * WorkflowSerializer
 * Handles serialization and deserialization of workflows for persistence
 */
export class WorkflowSerializer {
  /**
   * Serialize a workflow to a JSON string
   * @param workflow The workflow to serialize
   * @returns JSON string representation of the workflow
   */
  public static serializeWorkflow(workflow: Workflow): string {
    // Make a deep copy to avoid modifying the original
    const copy = this.deepCopyWorkflow(workflow);
    
    // Add metadata if missing
    if (!copy.metadata) {
      copy.metadata = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Unknown',
        version: '1.0.0'
      };
    } else {
      copy.metadata.updatedAt = new Date().toISOString();
    }
    
    return JSON.stringify(copy, null, 2);
  }
  
  /**
   * Deserialize a workflow from a JSON string
   * @param json The JSON string to deserialize
   * @returns Deserialized workflow object
   */
  public static deserializeWorkflow(json: string): Workflow {
    try {
      const parsed = JSON.parse(json);
      
      // Validate the parsed object
      this.validateWorkflow(parsed);
      
      // Set defaults for any missing properties
      return this.setWorkflowDefaults(parsed);
    } catch (error) {
      console.error('Error deserializing workflow:', error);
      throw new Error(`Invalid workflow JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create a new empty workflow
   * @param name Optional name for the workflow
   * @returns A new empty workflow
   */
  public static createEmptyWorkflow(name: string = 'New Workflow'): Workflow {
    return {
      id: nanoid(),
      name,
      description: 'Created on ' + new Date().toLocaleString(),
      nodes: [],
      connections: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Unknown',
        version: '1.0.0'
      }
    };
  }
  
  /**
   * Make a deep copy of a workflow
   * @param workflow The workflow to copy
   * @returns A deep copy of the workflow
   */
  private static deepCopyWorkflow(workflow: Workflow): Workflow {
    return JSON.parse(JSON.stringify(workflow));
  }
  
  /**
   * Validate a workflow object
   * @param obj The object to validate
   * @throws Error if validation fails
   */
  private static validateWorkflow(obj: any): void {
    if (!obj) throw new Error('Workflow is null or undefined');
    if (typeof obj !== 'object') throw new Error('Workflow is not an object');
    
    // Check required properties
    if (!obj.id) throw new Error('Workflow is missing an id');
    if (!obj.name) throw new Error('Workflow is missing a name');
    if (!Array.isArray(obj.nodes)) throw new Error('Workflow nodes must be an array');
    if (!Array.isArray(obj.connections)) throw new Error('Workflow connections must be an array');
    
    // Validate nodes
    obj.nodes.forEach((node: any, index: number) => {
      if (!node.id) throw new Error(`Node at index ${index} is missing an id`);
      if (!node.type) throw new Error(`Node at index ${index} is missing a type`);
      if (!node.position) throw new Error(`Node at index ${index} is missing a position`);
      if (!node.data) throw new Error(`Node at index ${index} is missing data object`);
      if (!node.data.inputs) throw new Error(`Node at index ${index} is missing inputs`);
      if (!node.data.outputs) throw new Error(`Node at index ${index} is missing outputs`);
    });
    
    // Validate connections
    obj.connections.forEach((conn: any, index: number) => {
      if (!conn.id) throw new Error(`Connection at index ${index} is missing an id`);
      if (!conn.sourceNodeId) throw new Error(`Connection at index ${index} is missing sourceNodeId`);
      if (!conn.sourceFieldId) throw new Error(`Connection at index ${index} is missing sourceFieldId`);
      if (!conn.targetNodeId) throw new Error(`Connection at index ${index} is missing targetNodeId`);
      if (!conn.targetFieldId) throw new Error(`Connection at index ${index} is missing targetFieldId`);
    });
  }
  
  /**
   * Set default values for missing workflow properties
   * @param workflow The workflow to set defaults for
   * @returns Workflow with defaults set
   */
  private static setWorkflowDefaults(workflow: any): Workflow {
    // Ensure metadata exists
    if (!workflow.metadata) {
      workflow.metadata = {};
    }
    
    // Set default metadata values if missing
    if (!workflow.metadata.createdAt) {
      workflow.metadata.createdAt = new Date().toISOString();
    }
    
    if (!workflow.metadata.updatedAt) {
      workflow.metadata.updatedAt = new Date().toISOString();
    }
    
    if (!workflow.metadata.author) {
      workflow.metadata.author = 'Unknown';
    }
    
    if (!workflow.metadata.version) {
      workflow.metadata.version = '1.0.0';
    }
    
    if (!workflow.description) {
      workflow.description = '';
    }
    
    return workflow as Workflow;
  }
}

/**
 * Functions to save and load workflows from local storage
 */
export const WorkflowStorage = {
  /**
   * Save a workflow to local storage
   * @param workflow The workflow to save
   */
  saveWorkflow(workflow: Workflow): void {
    try {
      const serialized = WorkflowSerializer.serializeWorkflow(workflow);
      localStorage.setItem(`workflow_${workflow.id}`, serialized);
      
      // Update list of saved workflows
      const savedWorkflows = this.getSavedWorkflowList();
      if (!savedWorkflows.includes(workflow.id)) {
        savedWorkflows.push(workflow.id);
        localStorage.setItem('saved_workflows', JSON.stringify(savedWorkflows));
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      throw new Error(`Failed to save workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  
  /**
   * Load a workflow from local storage
   * @param id The ID of the workflow to load
   * @returns The loaded workflow
   */
  loadWorkflow(id: string): Workflow {
    const serialized = localStorage.getItem(`workflow_${id}`);
    if (!serialized) {
      throw new Error(`Workflow with ID '${id}' not found`);
    }
    
    return WorkflowSerializer.deserializeWorkflow(serialized);
  },
  
  /**
   * Get a list of saved workflow IDs
   * @returns Array of saved workflow IDs
   */
  getSavedWorkflowList(): string[] {
    const saved = localStorage.getItem('saved_workflows');
    return saved ? JSON.parse(saved) : [];
  },
  
  /**
   * Get summary information for all saved workflows
   * @returns Array of workflow summary objects
   */
  getWorkflowSummaries(): Array<{ id: string, name: string, updatedAt: string }> {
    const ids = this.getSavedWorkflowList();
    const summaries = [];
    
    for (const id of ids) {
      try {
        const serialized = localStorage.getItem(`workflow_${id}`);
        if (serialized) {
          const data = JSON.parse(serialized);
          summaries.push({
            id: data.id,
            name: data.name,
            updatedAt: data.metadata?.updatedAt || 'Unknown'
          });
        }
      } catch (error) {
        console.warn(`Error loading summary for workflow ${id}:`, error);
      }
    }
    
    return summaries;
  },
  
  /**
   * Delete a workflow from local storage
   * @param id The ID of the workflow to delete
   */
  deleteWorkflow(id: string): void {
    localStorage.removeItem(`workflow_${id}`);
    
    // Update list of saved workflows
    const savedWorkflows = this.getSavedWorkflowList();
    const index = savedWorkflows.indexOf(id);
    if (index !== -1) {
      savedWorkflows.splice(index, 1);
      localStorage.setItem('saved_workflows', JSON.stringify(savedWorkflows));
    }
  }
};
