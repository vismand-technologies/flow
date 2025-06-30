import { nanoid } from 'nanoid';
// Import values
import { FieldType, FieldDirection } from './types';
// Import types only
import type { Node, Field } from './types';

/**
 * NodeModel class - Core implementation of the Node pattern
 * Responsible for managing node state, fields, and computation
 */
export class NodeModel {
  private id: string;
  private type: string;
  private name: string;
  private position: { x: number; y: number };
  private inputs: Record<string, Field> = {};
  private outputs: Record<string, Field> = {};
  private dirty: boolean = true;
  private computed: boolean = false;
  private computeFunction?: (node: NodeModel) => void;
  private width?: number;
  private height?: number;
  private data: Record<string, any> = {};

  constructor(
    type: string,
    name: string,
    position: { x: number; y: number } = { x: 0, y: 0 },
    id?: string
  ) {
    this.id = id || nanoid();
    this.type = type;
    this.name = name;
    this.position = position;
  }

  /**
   * Add an input field to the node
   */
  public addInput(
    name: string,
    type: FieldType,
    defaultValue?: any,
    required: boolean = false
  ): Field {
    const id = nanoid();
    const field: Field = {
      id,
      nodeId: this.id,
      name,
      type,
      direction: FieldDirection.INPUT,
      value: defaultValue,
      required,
      connections: [],
    };

    this.inputs[name] = field;
    this.dirty = true;
    return field;
  }

  /**
   * Add an output field to the node
   */
  public addOutput(
    name: string,
    type: FieldType,
    defaultValue?: any
  ): Field {
    const id = nanoid();
    const field: Field = {
      id,
      nodeId: this.id,
      name,
      type,
      direction: FieldDirection.OUTPUT,
      value: defaultValue,
      connections: [],
    };

    this.outputs[name] = field;
    return field;
  }

  /**
   * Set a field value and mark node as dirty
   */
  public setFieldValue(name: string, value: any, isInput: boolean = true): void {
    const fields = isInput ? this.inputs : this.outputs;
    if (fields[name]) {
      fields[name].value = value;
      if (isInput) {
        this.dirty = true;
      }
    }
  }

  /**
   * Get a field value
   */
  public getFieldValue(name: string, isInput: boolean = true): any {
    const fields = isInput ? this.inputs : this.outputs;
    if (fields[name]) {
      return fields[name].value;
    }
    return undefined;
  }

  /**
   * Add a connection to a field
   */
  public addConnection(
    fieldName: string,
    connectionId: string,
    isInput: boolean = true
  ): boolean {
    const fields = isInput ? this.inputs : this.outputs;
    if (fields[fieldName]) {
      fields[fieldName].connections.push(connectionId);
      if (isInput) {
        this.dirty = true;
      }
      return true;
    }
    return false;
  }

  /**
   * Remove a connection from a field
   */
  public removeConnection(
    fieldName: string,
    connectionId: string,
    isInput: boolean = true
  ): boolean {
    const fields = isInput ? this.inputs : this.outputs;
    if (fields[fieldName]) {
      const index = fields[fieldName].connections.indexOf(connectionId);
      if (index !== -1) {
        fields[fieldName].connections.splice(index, 1);
        if (isInput) {
          this.dirty = true;
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Set the compute function for this node
   */
  public setComputeFunction(computeFn: (node: NodeModel) => void): void {
    this.computeFunction = computeFn;
  }

  /**
   * Compute the node's outputs based on its inputs
   * Returns true if computation was performed, false if skipped (not dirty)
   */
  public compute(): boolean {
    if (!this.dirty) {
      return false;
    }

    if (this.computeFunction) {
      this.computeFunction(this);
    }

    this.dirty = false;
    this.computed = true;
    return true;
  }

  /**
   * Mark the node as dirty (needing recomputation)
   */
  public markDirty(): void {
    this.dirty = true;
    this.computed = false;
  }

  /**
   * Check if the node is dirty and needs computation
   */
  public isDirty(): boolean {
    return this.dirty;
  }

  /**
   * Check if the node has been computed at least once
   */
  public isComputed(): boolean {
    return this.computed;
  }

  /**
   * Get all inputs
   */
  public getInputs(): Record<string, Field> {
    return this.inputs;
  }

  /**
   * Get all outputs
   */
  public getOutputs(): Record<string, Field> {
    return this.outputs;
  }

  /**
   * Get the node ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get the node type
   */
  public getType(): string {
    return this.type;
  }

  /**
   * Get the node name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Set the node name
   */
  public setName(name: string): void {
    this.name = name;
  }

  /**
   * Get the node position
   */
  public getPosition(): { x: number; y: number } {
    return this.position;
  }

  /**
   * Set the node position
   */
  public setPosition(position: { x: number; y: number }): void {
    this.position = position;
  }

  /**
   * Set custom data on the node
   */
  public setData(key: string, value: any): void {
    this.data[key] = value;
  }

  /**
   * Get custom data from the node
   */
  public getData(key: string): any {
    return this.data[key];
  }

  /**
   * Set node dimensions
   */
  public setDimensions(width?: number, height?: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Convert to a plain object representation suitable for serialization
   */
  public toObject(): Node {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      position: { ...this.position },
      data: {
        inputs: { ...this.inputs },
        outputs: { ...this.outputs },
        ...this.data,
      },
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Create a NodeModel instance from a plain object
   */
  public static fromObject(obj: Node): NodeModel {
    const node = new NodeModel(obj.type, obj.name, obj.position, obj.id);
    
    // Restore dimensions
    if (obj.width !== undefined && obj.height !== undefined) {
      node.setDimensions(obj.width, obj.height);
    }
    
    // Restore fields
    if (obj.data.inputs) {
      node.inputs = { ...obj.data.inputs };
    }
    
    if (obj.data.outputs) {
      node.outputs = { ...obj.data.outputs };
    }
    
    // Restore other data
    for (const [key, value] of Object.entries(obj.data)) {
      if (key !== 'inputs' && key !== 'outputs') {
        node.setData(key, value);
      }
    }
    
    return node;
  }
}
