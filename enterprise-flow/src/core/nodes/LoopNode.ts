import type { Node, Field } from '../models/types';
import { NodeCategory } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';
import { getErrorMessage } from '../utils/errorHandling';
import { nanoid } from 'nanoid';

/**
 * LoopNode
 * Control flow node that executes a sequence of operations multiple times
 * Supports different loop types (count, while condition, for each item)
 * and advanced loop controls like early termination
 */
export class LoopNode implements Node {
  id: string;
  type: string = 'loop';
  name: string = 'Loop';
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
  category: string = NodeCategory.CONTROL_FLOW;
  description: string = 'Executes operations multiple times based on configured conditions';
  
  inputs: Record<string, any> = {
    loopType: 'count', // Options: 'count', 'while', 'forEach'
    iterations: 5, // For 'count' type: how many times to loop
    collection: [], // For 'forEach' type: items to iterate over
    condition: null, // For 'while' type: condition to evaluate
    conditionMode: 'input', // Options: 'input', 'expression', 'javascript'
    conditionExpression: '', // Expression to evaluate when conditionMode = 'expression'
    conditionJavaScript: '', // JavaScript code when conditionMode = 'javascript'
    initialState: {}, // Initial state to pass into the first iteration
    maxIterations: 100, // Safety limit to prevent infinite loops
    earlyTermination: false, // Whether loop has been terminated early
    currentIteration: 0 // Current loop iteration
  };
  
  outputs: Record<string, any> = {
    result: null, // Final result after all iterations
    currentItem: null, // Current item in iteration (for forEach)
    currentIndex: 0, // Current index in iteration
    isDone: false, // Whether loop is complete
    earlyTermination: false, // Whether loop was terminated early
    accumulatedState: {}, // Accumulated state across iterations
    error: null
  };
  
  constructor(id: string = nanoid()) {
    this.id = id;
  }
  
  /**
   * Compute - Executes one iteration of the loop
   * Note: In a real workflow engine, loops would be handled specially by the execution engine
   * This simplified implementation runs one iteration per compute call
   */
  async compute(): Promise<Record<string, any>> {
    const loopType = this.inputs.loopType;
    const currentIteration = this.inputs.currentIteration || 0;
    let accumulatedState = this.outputs.accumulatedState || this.inputs.initialState || {};
    
    try {
      // Check if we should continue looping
      const shouldContinue = this.shouldContinueLoop(currentIteration);
      
      if (!shouldContinue) {
        // Loop is complete
        return {
          result: accumulatedState,
          currentItem: null,
          currentIndex: currentIteration,
          isDone: true,
          earlyTermination: this.inputs.earlyTermination,
          accumulatedState,
          error: null
        };
      }
      
      // We have another iteration to perform
      
      // Get the current item if we're in a forEach loop
      let currentItem = null;
      if (loopType === 'forEach' && Array.isArray(this.inputs.collection)) {
        currentItem = this.inputs.collection[currentIteration];
      }
      
      // In a full implementation, the workflow engine would:
      // 1. Execute the body of the loop (connected nodes)
      // 2. Collect results
      // 3. Update accumulated state
      // 4. Check if we should continue
      // 5. If yes, increment and run another iteration
      // 6. If no, return final result
      
      // For this simplified example, we simulate processing:
      const processedItem = await this.simulateProcessing(currentItem, currentIteration, accumulatedState);
      
      // Update accumulated state based on processing
      accumulatedState = {
        ...accumulatedState,
        ...processedItem,
        lastProcessedIndex: currentIteration,
        itemCount: (accumulatedState.itemCount || 0) + 1
      };
      
      // Increment iteration counter
      const nextIteration = currentIteration + 1;
      
      // Check if we're done based on the updated iteration
      const isLoopComplete = !this.shouldContinueLoop(nextIteration);
      
      return {
        result: isLoopComplete ? accumulatedState : null,
        currentItem,
        currentIndex: currentIteration,
        isDone: isLoopComplete,
        earlyTermination: this.inputs.earlyTermination,
        accumulatedState,
        error: null
      };
    } catch (error) {
      return {
        result: null,
        currentItem: null,
        currentIndex: currentIteration,
        isDone: true, // End loop on error
        earlyTermination: true,
        accumulatedState,
        error: getErrorMessage(error, 'Loop execution failed')
      };
    }
  }
  
  /**
   * Determine if loop should continue based on current state
   */
  private shouldContinueLoop(currentIteration: number): boolean {
    // Early termination flag overrides other conditions
    if (this.inputs.earlyTermination) {
      return false;
    }
    
    // Safety check: prevent infinite loops
    if (currentIteration >= this.inputs.maxIterations) {
      throw new Error(`Loop exceeded maximum iterations (${this.inputs.maxIterations})`);
    }
    
    const loopType = this.inputs.loopType;
    
    switch (loopType) {
      case 'count':
        // Continue if we haven't reached the specified iteration count
        return currentIteration < this.inputs.iterations;
        
      case 'forEach':
        const collection = this.inputs.collection;
        // Continue if the collection is an array and we haven't processed all items
        return Array.isArray(collection) && currentIteration < collection.length;
        
      case 'while':
        // Continue if the condition evaluates to true
        return this.evaluateCondition();
        
      default:
        throw new Error(`Unsupported loop type: ${loopType}`);
    }
  }
  
  /**
   * Evaluate the loop continuation condition
   */
  private evaluateCondition(): boolean {
    const conditionMode = this.inputs.conditionMode;
    
    switch (conditionMode) {
      case 'input':
        // Use the direct input value as condition
        return !!this.inputs.condition;
        
      case 'expression':
        // Evaluate an expression string (in a real implementation, this would use a proper expression parser)
        const expression = this.inputs.conditionExpression;
        if (!expression) return false;
        
        // Simple expression evaluation - in a real app, use a proper expression evaluator
        try {
          // WARNING: Using Function constructor is unsafe in production code
          // This is only for demonstration purposes
          const evalFunc = new Function('state', 'iteration', `return ${expression};`);
          return !!evalFunc(this.outputs.accumulatedState, this.inputs.currentIteration);
        } catch (error) {
          throw new Error(`Error evaluating expression: ${getErrorMessage(error)}`);
        }
        
      case 'javascript':
        // Evaluate JavaScript code
        const jsCode = this.inputs.conditionJavaScript;
        if (!jsCode) return false;
        
        try {
          // WARNING: Using Function constructor is unsafe in production code
          // This is only for demonstration purposes
          const jsFunc = new Function('state', 'iteration', jsCode);
          return !!jsFunc(this.outputs.accumulatedState, this.inputs.currentIteration);
        } catch (error) {
          throw new Error(`Error evaluating JavaScript condition: ${getErrorMessage(error)}`);
        }
        
      default:
        throw new Error(`Unsupported condition mode: ${conditionMode}`);
    }
  }
  
  /**
   * Simulate processing of a loop iteration
   * In a real workflow, this would be handled by executing connected nodes
   */
  private async simulateProcessing(item: any, index: number, state: any): Promise<any> {
    // Mock implementation - in a real workflow engine, this would execute child nodes
    return new Promise(resolve => {
      setTimeout(() => {
        // Generate a mock result based on the item and index
        const result: any = {};
        
        if (item !== null && item !== undefined) {
          if (typeof item === 'object') {
            // For objects or arrays, create a processed copy
            result[`processed_item_${index}`] = {
              originalItem: item,
              timeProcessed: new Date().toISOString(),
              processingIndex: index
            };
          } else {
            // For primitive items, do a simple transformation
            result[`processed_item_${index}`] = `Processed: ${item} (at index ${index})`;
          }
        } else {
          // For count or while loops with no specific item
          result[`iteration_${index}`] = {
            timestamp: new Date().toISOString(),
            iteration: index
          };
        }
        
        // Add a summary field for cumulative data
        if (!state.summary) {
          result.summary = {
            iterations: [index],
            processedCount: 1
          };
        } else {
          result.summary = {
            iterations: [...(state.summary.iterations || []), index],
            processedCount: (state.summary.processedCount || 0) + 1
          };
        }
        
        resolve(result);
      }, 50); // Short delay to simulate processing
    });
  }
}

import { FieldDirection, FieldType } from '../models/types';

// Register the node with the NodeRegistry
NodeRegistry.getInstance().registerNodeType({
  type: 'loop',
  name: 'Loop',
  category: NodeCategory.CONTROL_FLOW,
  description: 'Executes operations multiple times based on configured conditions',
  nodeClass: LoopNode,
  inputs: [
    { 
      id: 'loopType',
      name: 'loopType', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'Type of loop to execute',
      options: ['count', 'while', 'forEach'],
      default: 'count'
    },
    { 
      id: 'iterations', 
      name: 'iterations', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.INPUT,
      description: 'For count loops: number of iterations to perform', 
      default: 5 
    },
    { 
      id: 'collection', 
      name: 'collection', 
      type: FieldType.ARRAY, 
      direction: FieldDirection.INPUT,
      description: 'For forEach loops: collection to iterate over' 
    },
    { 
      id: 'condition', 
      name: 'condition', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.INPUT,
      description: 'For while loops: condition input value' 
    },
    { 
      id: 'conditionMode',
      name: 'conditionMode', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'How to evaluate the loop condition',
      options: ['input', 'expression', 'javascript'],
      default: 'input'
    },
    { 
      id: 'conditionExpression', 
      name: 'conditionExpression', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'Expression to evaluate for while condition' 
    },
    { 
      id: 'conditionJavaScript', 
      name: 'conditionJavaScript', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'JavaScript code for evaluating while condition' 
    },
    { 
      id: 'initialState', 
      name: 'initialState', 
      type: FieldType.OBJECT, 
      direction: FieldDirection.INPUT,
      description: 'Initial state to pass into loop', 
      default: {} 
    },
    { 
      id: 'maxIterations', 
      name: 'maxIterations', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.INPUT,
      description: 'Safety limit to prevent infinite loops', 
      default: 100 
    },
    { 
      id: 'earlyTermination', 
      name: 'earlyTermination', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.INPUT,
      description: 'Set to true to terminate the loop early', 
      default: false 
    },
    { 
      id: 'currentIteration', 
      name: 'currentIteration', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.INPUT,
      description: 'Current iteration counter (managed by execution engine)', 
      default: 0 
    }
  ],
  outputs: [
    { 
      id: 'result', 
      name: 'result', 
      type: FieldType.ANY, 
      direction: FieldDirection.OUTPUT,
      description: 'Final result after all iterations are complete' 
    },
    { 
      id: 'currentItem', 
      name: 'currentItem', 
      type: FieldType.ANY, 
      direction: FieldDirection.OUTPUT,
      description: 'Current item in iteration (for forEach loops)' 
    },
    { 
      id: 'currentIndex', 
      name: 'currentIndex', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.OUTPUT,
      description: 'Current iteration index' 
    },
    { 
      id: 'isDone', 
      name: 'isDone', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.OUTPUT,
      description: 'Whether the loop execution is complete' 
    },
    { 
      id: 'earlyTermination', 
      name: 'earlyTermination', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.OUTPUT,
      description: 'Whether loop was terminated early' 
    },
    { 
      id: 'accumulatedState', 
      name: 'accumulatedState', 
      type: FieldType.OBJECT, 
      direction: FieldDirection.OUTPUT,
      description: 'Accumulated state across iterations' 
    },
    { 
      id: 'error', 
      name: 'error', 
      type: FieldType.STRING, 
      direction: FieldDirection.OUTPUT,
      description: 'Error message if loop execution fails' 
    }
  ],
  icon: 'LoopOutlined' // Material UI icon name
});
