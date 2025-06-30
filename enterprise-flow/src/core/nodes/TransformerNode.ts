import { NodeRegistry } from '../models/NodeRegistry';
import type { Node, Field } from '../models/types';
import { NodeCategory, FieldType, FieldDirection } from '../models/types';
import { nanoid } from 'nanoid';

/**
 * TransformerNode
 * Transforms input data using various transformation strategies
 * Supports JSON path extraction, object mapping, and custom JavaScript transformations
 */
export class TransformerNode implements Node {
  id: string;
  type: string = 'transformer';
  name: string = 'Transformer';
  position: { x: number; y: number } = { x: 0, y: 0 };
  
  data: {
    inputs: Record<string, Field>;
    outputs: Record<string, Field>;
    transformationType: string;
    jsonPath: string;
    mapConfig: Record<string, any>;
    jsTransform: string;
    [key: string]: any;
  } = {
    inputs: {},
    outputs: {},
    transformationType: 'map', // Options: 'map', 'jsonPath', 'javascript'
    jsonPath: '$.', // Used when transformationType is 'jsonPath'
    mapConfig: {}, // Used when transformationType is 'map'
    jsTransform: 'return input;', // Used when transformationType is 'javascript'
  };
  
  constructor(id: string = nanoid()) {
    this.id = id;
  }
  
  /**
   * Computes the transformation based on the selected transformation type
   */
  async compute(): Promise<Record<string, any>> {
    const inputData = this.data.inputs?.data?.value;
    const transformationType = this.data.transformationType;
    
    if (!inputData) {
      return {
        result: null,
        error: 'No input data provided'
      };
    }
    
    try {
      let result = null;
      
      switch (transformationType) {
        case 'map':
          return this.performObjectMapping(inputData);
        case 'jsonPath':
          return this.performJsonPathExtraction(inputData);
        case 'javascript':
          return this.performJavaScriptTransform(inputData);
        default:
          return {
            result: null,
            error: `Unsupported transformation type: ${transformationType}`
          };
      }
      
      return {
        result,
        error: null
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        result: null,
        error: `Transformation failed: ${errorMessage}`
      };
    }
  }
  
  /**
   * Maps input data to a new structure based on mapConfig
   */
  private performObjectMapping(data: any): Record<string, any> {
    try {
      const mapConfig = this.data.mapConfig || {};
      
      // Simple recursive object mapping
      const result: Record<string, any> = {};
      
      // Process the mapping configuration
      Object.entries(mapConfig).forEach(([targetKey, sourcePath]) => {
        // Simple dot notation path traversal
        const sourcePathParts = String(sourcePath).split('.');
        let current = data;
        
        // Traverse the data according to the source path
        for (const part of sourcePathParts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            current = undefined;
            break;
          }
        }
        
        // Assign the found value to the target key
        result[targetKey] = current;
      });
      
      return { result };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        result: null,
        error: `Object mapping error: ${errorMessage}` 
      };
    }
  }
  
  /**
   * Extracts data using a JSON path expression
   * Simple implementation of basic JSON path functionality
   */
  private performJsonPathExtraction(data: any): Record<string, any> {
    try {
      const jsonPath = this.data.jsonPath || '$.';
      
      // In a real implementation, use a proper JSONPath library
      // This is a simplified implementation for demonstration purposes
      const result = this.simpleJsonPathExtraction(data, jsonPath);
      
      return { result };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        result: null,
        error: `JSON path extraction error: ${errorMessage}`
      };
    }
  }
  
  private simpleJsonPathExtraction(data: any, jsonPath: string): any {
    const normalizedPath = jsonPath.startsWith('$.') ? jsonPath.substring(2) : jsonPath.startsWith('$') ? jsonPath.substring(1) : jsonPath;
    
    // Split into parts, handling both dot notation and array indices
    const parts = normalizedPath.split(/\.|\[|\]/).filter(Boolean);
    let result = data;
    
    for (const part of parts) {
      if (result === null || result === undefined) {
        return null;
      }
      
      // If part is a number, treat it as an array index
      const index = parseInt(part, 10);
      if (!isNaN(index)) {
        result = Array.isArray(result) ? result[index] : null;
      } else {
        result = result[part];
      }
    }
    
    return result;
  }
  
  /**
   * Executes a JavaScript function to transform the data
   * Uses Function constructor (similar to eval) - in a real implementation,
   * this should be replaced with a safer JavaScript execution environment
   */
  private performJavaScriptTransform(data: any): Record<string, any> {
    const jsTransform = this.data.jsTransform;
    
    // In a real app, avoid Function constructor due to security risks
    // This is only for demonstration purposes
    try {
      // Create a function that takes 'input' as parameter and returns the transformed data
      const transformFunction = new Function('input', jsTransform);
      return { result: transformFunction(data) };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`JavaScript transformation error: ${errorMessage}`);
    }
  }
}

// Register the node with the NodeRegistry
NodeRegistry.getInstance().registerNodeType({
  type: 'transformer',
  name: 'Transformer',
  category: NodeCategory.DATA_PROCESSING,
  description: 'Transforms input data using various transformation methods',
  inputs: [
    { id: 'data', name: 'data', type: FieldType.ANY, direction: FieldDirection.INPUT, description: 'Input data to transform' },
    { 
      id: 'transformationType',
      name: 'transformationType', 
      type: FieldType.STRING,
      direction: FieldDirection.INPUT,
      description: 'Type of transformation to apply',
      defaultValue: 'map'
    },
    { id: 'jsonPath', name: 'jsonPath', type: FieldType.STRING, direction: FieldDirection.INPUT, description: 'JSON Path expression for extraction' },
    { id: 'mapConfig', name: 'mapConfig', type: FieldType.OBJECT, direction: FieldDirection.INPUT, description: 'Object mapping configuration' },
    { id: 'jsTransform', name: 'jsTransform', type: FieldType.STRING, direction: FieldDirection.INPUT, description: 'JavaScript transformation code' }
  ],
  outputs: [
    { id: 'result', name: 'result', type: FieldType.ANY, direction: FieldDirection.OUTPUT, description: 'Transformed data output' },
    { id: 'error', name: 'error', type: FieldType.STRING, direction: FieldDirection.OUTPUT, description: 'Error message if transformation failed' }
  ]
});
