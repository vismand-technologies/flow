import { NodeRegistry } from '../models/NodeRegistry';
import type { Node, Field } from '../models/types';
import { NodeCategory, FieldType, FieldDirection } from '../models/types';
import { getErrorMessage } from '../utils/errorHandling';

import { nanoid } from 'nanoid';

/**
 * StateMachineNode
 * Control flow node that implements a finite state machine
 * Manages complex state transitions based on events and conditions
 */
export class StateMachineNode implements Node {
  id: string;
  type: string = 'stateMachine';
  name: string = 'State Machine';
  category: string = 'Control Flow';
  description: string = 'Manages workflow as a finite state machine with transitions';
  position: { x: number; y: number } = { x: 0, y: 0 };
  data: { [key: string]: any; inputs: Record<string, Field>; outputs: Record<string, Field>; } = {
    inputs: {},
    outputs: {}
  };
  
  inputs: Record<string, any> = {
    initialState: 'initial', // The starting state
    event: null, // Event that may trigger a state transition
    context: {}, // Context data for state transitions and actions
    states: {}, // State configuration object defining states, transitions, and actions
    transitionExpression: '', // Optional expression to evaluate for transitions
    maxTransitions: 50, // Safety limit to prevent infinite transition loops
    isActive: true // Whether the state machine is active
  };
  
  outputs: Record<string, any> = {
    currentState: 'initial', // The current state
    previousState: null, // The previous state
    history: [], // History of state transitions
    contextData: {}, // Current context data
    isInFinalState: false, // Whether the machine is in a final state
    activeTransitions: [], // Available transitions from current state
    transitionCount: 0, // Number of transitions executed
    error: null
  };
  
  constructor(id: string = nanoid()) {
    this.id = id;
  }
  
  /**
   * Compute - Process events and execute state transitions
   */
  async compute(): Promise<Record<string, any>> {
    try {
      // Initialize or retrieve current state information
      const currentState = this.outputs.currentState || this.inputs.initialState;
      const contextData = this.inputs.context || {};
      const stateConfig = this.inputs.states || {};
      const event = this.inputs.event;
      const history = this.outputs.history || [];
      const transitionCount = this.outputs.transitionCount || 0;
      
      // If the machine is not active, return current state without changes
      if (this.inputs.isActive === false) {
        return {
          currentState,
          previousState: this.outputs.previousState,
          history,
          contextData,
          isInFinalState: this.isFinalState(currentState, stateConfig),
          activeTransitions: this.getAvailableTransitions(currentState, stateConfig),
          transitionCount,
          error: null
        };
      }
      
      // Safety check: prevent too many transitions
      if (transitionCount >= this.inputs.maxTransitions) {
        return {
          currentState,
          previousState: this.outputs.previousState,
          history,
          contextData,
          isInFinalState: false,
          activeTransitions: [],
          transitionCount,
          error: `State machine exceeded maximum transitions (${this.inputs.maxTransitions})`
        };
      }
      
      // Get the current state configuration
      const currentStateConfig = stateConfig[currentState];
      
      if (!currentStateConfig) {
        return {
          currentState,
          previousState: this.outputs.previousState,
          history,
          contextData,
          isInFinalState: false,
          activeTransitions: [],
          transitionCount,
          error: `Invalid state: ${currentState}`
        };
      }
      
      // Execute entry actions for the current state if this is the first time
      // we're entering this state (not on subsequent compute calls in the same state)
      let updatedContext = { ...contextData };
      
      if (currentState !== this.outputs.currentState) {
        updatedContext = await this.executeActions(
          currentStateConfig.onEntry,
          updatedContext,
          event,
          currentState
        );
      }
      
      // Determine if a transition should occur based on the event
      const transition = this.determineTransition(currentState, event, updatedContext, stateConfig);
      
      if (!transition) {
        // No transition, remain in current state
        return {
          currentState,
          previousState: this.outputs.previousState,
          history,
          contextData: updatedContext,
          isInFinalState: this.isFinalState(currentState, stateConfig),
          activeTransitions: this.getAvailableTransitions(currentState, stateConfig),
          transitionCount,
          error: null
        };
      }
      
      // Execute exit actions for the current state
      updatedContext = await this.executeActions(
        currentStateConfig.onExit,
        updatedContext,
        event,
        currentState
      );
      
      // Execute transition actions
      updatedContext = await this.executeActions(
        transition.actions,
        updatedContext,
        event,
        currentState
      );
      
      // Record the transition in history
      const transitionRecord = {
        from: currentState,
        to: transition.target,
        event: event,
        timestamp: new Date().toISOString(),
      };
      
      const updatedHistory = [...history, transitionRecord];
      
      // Return the new state
      return {
        currentState: transition.target,
        previousState: currentState,
        history: updatedHistory,
        contextData: updatedContext,
        isInFinalState: this.isFinalState(transition.target, stateConfig),
        activeTransitions: this.getAvailableTransitions(transition.target, stateConfig),
        transitionCount: transitionCount + 1,
        error: null
      };
      
    } catch (error) {
      return {
        currentState: this.outputs.currentState || this.inputs.initialState,
        previousState: this.outputs.previousState,
        history: this.outputs.history || [],
        contextData: this.inputs.context || {},
        isInFinalState: false,
        activeTransitions: [],
        transitionCount: this.outputs.transitionCount || 0,
        error: getErrorMessage(error, 'State machine execution failed')
      };
    }
  }
  
  /**
   * Determine which transition should occur based on the event and conditions
   */
  private determineTransition(
    currentState: string,
    event: any,
    context: Record<string, any>,
    stateConfig: Record<string, any>
  ): any {
    const currentStateConfig = stateConfig[currentState];
    if (!currentStateConfig || !currentStateConfig.transitions) {
      return null;
    }
    
    // Find transitions that match the event
    const possibleTransitions = currentStateConfig.transitions.filter((transition: any) => {
      // If no event is specified in the transition, it's an automatic transition
      // that should only be taken if no event is provided
      if (!transition.event) {
        return !event;
      }
      
      // Otherwise, match the event
      return transition.event === event;
    });
    
    // Find the first transition whose condition evaluates to true
    for (const transition of possibleTransitions) {
      if (!transition.condition || this.evaluateCondition(transition.condition, context, event)) {
        return transition;
      }
    }
    
    return null;
  }
  
  /**
   * Evaluate a transition condition
   */
  private evaluateCondition(condition: string | Function, context: Record<string, any>, event: any): boolean {
    if (typeof condition === 'function') {
      return condition(context, event);
    }
    
    if (typeof condition === 'string') {
      try {
        // WARNING: Using Function constructor is unsafe in production code
        // This is only for demonstration purposes
        const evalFunc = new Function('context', 'event', `return ${condition};`);
        return !!evalFunc(context, event);
      } catch (error) {
        throw new Error(`Error evaluating condition: ${getErrorMessage(error)}`);
      }
    }
    
    return true;
  }
  
  /**
   * Execute actions associated with a state or transition
   */
  private async executeActions(
    actions: any[] | undefined,
    context: Record<string, any>,
    event: any,
    state: string
  ): Promise<Record<string, any>> {
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return context;
    }
    
    let updatedContext = { ...context };
    
    // Execute each action in sequence
    for (const action of actions) {
      // If action is a function, execute it
      if (typeof action === 'function') {
        const actionResult = await action(updatedContext, event, state);
        
        // Update context with action result if returned
        if (actionResult && typeof actionResult === 'object') {
          updatedContext = { ...updatedContext, ...actionResult };
        }
        continue;
      }
      
      // If action is a string (inline code), execute it
      if (typeof action === 'string' && action.trim()) {
        try {
          // WARNING: Using Function constructor is unsafe in production code
          // This is only for demonstration purposes
          const actionFunc = new Function('context', 'event', 'state', action);
          const actionResult = await actionFunc(updatedContext, event, state);
          
          // Update context with action result if returned
          if (actionResult && typeof actionResult === 'object') {
            updatedContext = { ...updatedContext, ...actionResult };
          }
        } catch (error) {
          throw new Error(`Error executing action: ${getErrorMessage(error)}`);
        }
      }
      
      // If action is an object with type and params
      if (action && typeof action === 'object' && action.type) {
        // In a full implementation, this would dispatch to different action handlers
        const actionResult = await this.executeTypedAction(action, updatedContext, event, state);
        
        // Update context with action result if returned
        if (actionResult && typeof actionResult === 'object') {
          updatedContext = { ...updatedContext, ...actionResult };
        }
      }
    }
    
    return updatedContext;
  }
  
  /**
   * Execute a typed action (with type and params)
   */
  private async executeTypedAction(
    action: { type: string; [key: string]: any },
    context: Record<string, any>,
    event: any,
    state: string
  ): Promise<Record<string, any> | void> {
    // Mock implementation - in a real app, this would dispatch to actual handlers
    const { type, ...params } = action;
    
    // Return a promise to simulate async action execution
    return new Promise(resolve => {
      setTimeout(() => {
        switch (type) {
          case 'log':
            console.log(`[StateMachine:${this.id}] ${params.message || 'State transition'}`, {
              state,
              event,
              params
            });
            resolve({});
            break;
            
          case 'setContextValue':
            resolve({
              [params.key]: params.value
            });
            break;
            
          case 'incrementCounter':
            const counterKey = params.key || 'counter';
            const increment = params.value || 1;
            resolve({
              [counterKey]: (context[counterKey] || 0) + increment
            });
            break;
            
          case 'delay':
            // Just a delay action - doesn't modify context
            resolve({});
            break;
            
          default:
            console.warn(`Unknown action type: ${type}`);
            resolve({});
        }
      }, 50); // Small delay to simulate processing
    });
  }
  
  /**
   * Check if a state is a final state
   */
  private isFinalState(state: string, stateConfig: Record<string, any>): boolean {
    const currentStateConfig = stateConfig[state];
    return currentStateConfig && currentStateConfig.final === true;
  }
  
  /**
   * Get available transitions from the current state
   */
  private getAvailableTransitions(state: string, stateConfig: Record<string, any>): any[] {
    const currentStateConfig = stateConfig[state];
    if (!currentStateConfig || !currentStateConfig.transitions) {
      return [];
    }
    
    // Return a simplified version of available transitions
    return currentStateConfig.transitions.map((transition: any) => ({
      event: transition.event,
      target: transition.target,
      hasCondition: !!transition.condition
    }));
  }
}

// Register the node with the NodeRegistry
NodeRegistry.getInstance().registerNodeType({
  type: 'stateMachine',
  name: 'State Machine',
  category: NodeCategory.CONTROL_FLOW,
  description: 'Manages workflow as a finite state machine with transitions',
  nodeClass: StateMachineNode,
  inputs: [
    { 
      id: 'initialState',
      name: 'initialState', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'The starting state', 
      defaultValue: 'initial' 
    },
    { 
      id: 'event',
      name: 'event', 
      type: FieldType.ANY, 
      direction: FieldDirection.INPUT,
      description: 'Event that may trigger a state transition' 
    },
    { 
      id: 'context',
      name: 'context', 
      type: FieldType.OBJECT, 
      direction: FieldDirection.INPUT,
      description: 'Context data for state transitions and actions', 
      defaultValue: {} 
    },
    { 
      id: 'states',
      name: 'states', 
      type: FieldType.OBJECT, 
      direction: FieldDirection.INPUT,
      description: 'State configuration object defining states, transitions, and actions',
      defaultValue: {
        initial: {
          transitions: [
            { event: 'next', target: 'processing' }
          ]
        },
        processing: {
          transitions: [
            { event: 'complete', target: 'completed' },
            { event: 'error', target: 'error' }
          ]
        },
        completed: {
          final: true
        },
        error: {
          final: true
        }
      }
    },
    { 
      id: 'transitionExpression',
      name: 'transitionExpression', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'Optional expression to evaluate for transitions' 
    },
    { 
      id: 'maxTransitions',
      name: 'maxTransitions', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.INPUT,
      description: 'Safety limit to prevent infinite transition loops', 
      defaultValue: 50 
    },
    { 
      id: 'isActive',
      name: 'isActive', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.INPUT,
      description: 'Whether the state machine is active', 
      defaultValue: true 
    }
  ],
  outputs: [
    { 
      id: 'currentState',
      name: 'currentState', 
      type: FieldType.STRING, 
      direction: FieldDirection.OUTPUT,
      description: 'The current state' 
    },
    { 
      id: 'previousState',
      name: 'previousState', 
      type: FieldType.STRING, 
      direction: FieldDirection.OUTPUT,
      description: 'The previous state' 
    },
    { 
      id: 'history',
      name: 'history', 
      type: FieldType.ARRAY, 
      direction: FieldDirection.OUTPUT,
      description: 'History of state transitions' 
    },
    { 
      id: 'contextData',
      name: 'contextData', 
      type: FieldType.OBJECT, 
      direction: FieldDirection.OUTPUT,
      description: 'Current context data' 
    },
    { 
      id: 'isInFinalState',
      name: 'isInFinalState', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.OUTPUT,
      description: 'Whether the machine is in a final state' 
    },
    { 
      id: 'activeTransitions',
      name: 'activeTransitions', 
      type: FieldType.ARRAY, 
      direction: FieldDirection.OUTPUT,
      description: 'Available transitions from current state' 
    },
    { 
      id: 'transitionCount',
      name: 'transitionCount', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.OUTPUT,
      description: 'Number of transitions executed' 
    },
    { 
      id: 'error',
      name: 'error', 
      type: FieldType.STRING, 
      direction: FieldDirection.OUTPUT,
      description: 'Error message if state machine execution fails' 
    }
  ],
  icon: 'AccountTreeOutlined' // Material UI icon name
});
