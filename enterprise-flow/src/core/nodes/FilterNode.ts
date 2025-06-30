import type { Node, Field } from '../models/types';
import { NodeCategory, FieldType, FieldDirection } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';
import { nanoid } from 'nanoid';
import { getErrorMessage, createErrorResponse } from '../utils/errorHandling';

/**
 * FilterNode
 * Filters arrays or objects based on configurable conditions
 * Supports various filtering strategies including property matching, value comparison,
 * and array element filtering
 */
export class FilterNode implements Node {
  id: string;
  type: string = 'filter';
  name: string = 'Filter';
  position: { x: number; y: number } = { x: 0, y: 0 };
  data: {
    inputs: Record<string, Field>;
    outputs: Record<string, Field>;
    [key: string]: any;
  } = {
    inputs: {},
    outputs: {}
  };
  
  // Configuration properties
  category: string = NodeCategory.DATA_PROCESSING;
  description: string = 'Filters data based on configurable conditions';
  
  // Legacy inputs property - use data.inputs instead
  inputs: Record<string, any> = {
    data: null,
    filterType: 'condition', // Options: 'condition', 'property', 'javascript'
    propertyName: '', // Used when filterType is 'property'
    operator: 'equals', // Options: 'equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', etc.
    value: null, // Comparison value
    jsFilter: 'return item => true;', // Used when filterType is 'javascript'
    caseSensitive: false, // For string comparisons
  };
  
  outputs: Record<string, any> = {
    filtered: null, // The filtered data
    matches: 0, // Number of matches
    excluded: null, // Items that didn't match the filter
    error: null,
  };
  
  constructor(id: string = nanoid()) {
    this.id = id;
  }
  
  /**
   * Computes the filtered results based on input data and filter configuration
   */
  async compute(): Promise<Record<string, any>> {
    const data = this.inputs.data;
    
    if (!data) {
      return {
        filtered: null,
        matches: 0,
        excluded: null,
        error: 'No input data provided'
      };
    }
    
    try {
      if (Array.isArray(data)) {
        return this.filterArray(data);
      } else if (typeof data === 'object' && data !== null) {
        return this.filterObject(data);
      } else {
        throw new Error('Input data must be an array or object');
      }
    } catch (error: unknown) {
      return {
        filtered: null,
        matches: 0,
        excluded: null,
        ...createErrorResponse(error, undefined, 'Filter operation failed')
      };
    }
  }
  
  /**
   * Filter an array based on the selected filter type and criteria
   */
  private filterArray(data: any[]): Record<string, any> {
    const filterType = this.inputs.filterType;
    
    let filtered: any[];
    
    switch (filterType) {
      case 'condition':
        filtered = data.filter(item => this.evaluateCondition(item));
        break;
      case 'property':
        filtered = data.filter(item => this.evaluatePropertyFilter(item));
        break;
      case 'javascript':
        filtered = this.evaluateJavaScriptFilter(data);
        break;
      default:
        throw new Error(`Unsupported filter type: ${filterType}`);
    }
    
    const excluded = data.filter(item => !filtered.includes(item));
    
    return {
      filtered,
      matches: filtered.length,
      excluded,
      error: null
    };
  }
  
  /**
   * Filter an object based on the selected filter type and criteria
   */
  private filterObject(data: Record<string, any>): Record<string, any> {
    const filterType = this.inputs.filterType;
    
    let filtered: Record<string, any> = {};
    let excluded: Record<string, any> = {};
    
    switch (filterType) {
      case 'condition':
      case 'property':
        // For each property in the object, evaluate if it passes the filter
        for (const [key, value] of Object.entries(data)) {
          if (filterType === 'condition' ? this.evaluateCondition(value) : this.evaluatePropertyFilter(value)) {
            filtered[key] = value;
          } else {
            excluded[key] = value;
          }
        }
        break;
      case 'javascript':
        const result = this.evaluateJavaScriptFilter(data);
        filtered = result;
        excluded = Object.fromEntries(
          Object.entries(data).filter(([key]) => !(key in result))
        );
        break;
      default:
        throw new Error(`Unsupported filter type: ${filterType}`);
    }
    
    return {
      filtered,
      matches: Object.keys(filtered).length,
      excluded,
      error: null
    };
  }
  
  /**
   * Evaluates a condition against an item
   */
  private evaluateCondition(item: any): boolean {
    const operator = this.inputs.operator;
    const value = this.inputs.value;
    const caseSensitive = this.inputs.caseSensitive;
    
    // Handle special case for strings when case-insensitivity is enabled
    const normalizeForComparison = (val: any): any => {
      if (!caseSensitive && typeof val === 'string') {
        return val.toLowerCase();
      }
      return val;
    };
    
    const normalizedItem = normalizeForComparison(item);
    const normalizedValue = normalizeForComparison(value);
    
    switch (operator) {
      case 'equals':
        return normalizedItem === normalizedValue;
      case 'notEquals':
        return normalizedItem !== normalizedValue;
      case 'contains':
        if (typeof normalizedItem === 'string') {
          return normalizedItem.includes(String(normalizedValue));
        } else if (Array.isArray(normalizedItem)) {
          return normalizedItem.some(el => 
            normalizeForComparison(el) === normalizedValue
          );
        }
        return false;
      case 'greaterThan':
        return normalizedItem > normalizedValue;
      case 'lessThan':
        return normalizedItem < normalizedValue;
      case 'greaterOrEqual':
        return normalizedItem >= normalizedValue;
      case 'lessOrEqual':
        return normalizedItem <= normalizedValue;
      case 'empty':
        return normalizedItem === '' || normalizedItem === null || normalizedItem === undefined || 
               (Array.isArray(normalizedItem) && normalizedItem.length === 0) ||
               (typeof normalizedItem === 'object' && Object.keys(normalizedItem).length === 0);
      case 'notEmpty':
        return !this.evaluateCondition(item); // Reuse the 'empty' condition and negate it
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }
  
  /**
   * Evaluates a property-based filter against an item
   */
  private evaluatePropertyFilter(item: any): boolean {
    const propertyName = this.inputs.propertyName;
    
    if (!propertyName || typeof item !== 'object' || item === null) {
      return false;
    }
    
    // Handle nested properties using dot notation
    const propertyPath = propertyName.split('.');
    let propertyValue = item;
    
    for (const pathPart of propertyPath) {
      if (propertyValue === null || propertyValue === undefined) {
        return false;
      }
      propertyValue = propertyValue[pathPart];
    }
    
    // Once we have the property value, use the evaluateCondition method
    // Replace the item with the property value for evaluation
    return this.evaluateCondition(propertyValue);
  }
  
  /**
   * Evaluates a JavaScript function for filtering
   */
  private evaluateJavaScriptFilter(data: any): any {
    const jsFilter = this.inputs.jsFilter;
    
    try {
      // For array filtering
      if (Array.isArray(data)) {
        // Create a function that returns a filter function to apply to the array
        const filterFunctionCreator = new Function('return ' + jsFilter);
        const filterFunction = filterFunctionCreator();
        
        // Apply the filter function to the array
        return data.filter(filterFunction);
      } 
      // For object filtering
      else {
        // Create a function that takes the input object and returns a filtered object
        const filterFunction = new Function('input', `
          const result = {};
          ${jsFilter}
          return result;
        `);
        
        return filterFunction(data);
      }
    } catch (error: unknown) {
      throw new Error(`JavaScript filter error: ${getErrorMessage(error)}`);
    }
  }
}

// Register the node with the NodeRegistry
NodeRegistry.getInstance().registerNodeType({
  type: 'filter',
  name: 'Filter',
  category: NodeCategory.DATA_PROCESSING,
  description: 'Filters data based on configurable conditions',
  nodeClass: FilterNode,
  inputs: [
    {
      id: 'data',
      name: 'Data',
      type: FieldType.ANY,
      direction: FieldDirection.INPUT,
      description: 'Input data to filter (array or object)'
    },
    {
      id: 'filterType',
      name: 'Filter Type',
      type: FieldType.STRING,
      direction: FieldDirection.INPUT,
      description: 'Type of filter to apply',
      defaultValue: 'condition'
    },
    {
      id: 'propertyName',
      name: 'Property Name',
      type: FieldType.STRING,
      direction: FieldDirection.INPUT,
      description: 'Property name/path to check when filterType is "property"',
    },
    {
      id: 'operator',
      name: 'Operator',
      type: FieldType.STRING,
      direction: FieldDirection.INPUT,
      description: 'Comparison operator for the condition',
      defaultValue: 'equals'
    },
    {
      id: 'value',
      name: 'Value',
      type: FieldType.ANY,
      direction: FieldDirection.INPUT,
      description: 'Value to compare against',
    },
    {
      id: 'jsFilter',
      name: 'JavaScript Filter',
      type: FieldType.STRING,
      direction: FieldDirection.INPUT,
      description: 'JavaScript code for custom filtering',
    },
    {
      id: 'caseSensitive',
      name: 'Case Sensitive',
      type: FieldType.BOOLEAN,
      direction: FieldDirection.INPUT,
      description: 'Make string comparisons case sensitive',
      defaultValue: false,
    },
  ],
  outputs: [
    {
      id: 'filtered',
      name: 'Filtered Data',
      type: FieldType.ANY,
      direction: FieldDirection.OUTPUT,
      description: 'Data that passes the filter conditions',
    },
    {
      id: 'matches',
      name: 'Count',
      type: FieldType.NUMBER,
      direction: FieldDirection.OUTPUT,
      description: 'Number of items that passed the filter',
    },
    {
      id: 'excluded',
      name: 'Rejected',
      type: FieldType.ANY,
      direction: FieldDirection.OUTPUT,
      description: 'Data that did not pass the filter conditions',
    },
    {
      id: 'error',
      name: 'Error',
      type: FieldType.STRING,
      direction: FieldDirection.OUTPUT,
      description: 'Error message if filtering fails',
    },
  ],
  icon: 'FilterListOutlined' // Material UI icon name
});
