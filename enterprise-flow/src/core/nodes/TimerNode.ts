import type { Node, Field } from '../models/types';
import { NodeCategory, FieldType, FieldDirection } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';
import { nanoid } from 'nanoid';

/**
 * TimerNode
 * Time-based control flow node that handles scheduling and delay operations
 * Supports one-time delays, periodic execution, and cron-style scheduling
 */
export class TimerNode implements Node {
  id: string;
  type: string = 'timer';
  name: string = 'Timer';
  position: { x: number; y: number } = { x: 0, y: 0 };
  data: {
    inputs: Record<string, Field>;
    outputs: Record<string, Field>;
    [key: string]: any;
  } = {
    inputs: {},
    outputs: {}
  };
  
  // Internal state for timer management
  private timerId: number | null = null;
  private startTime: number | null = null;
  private executionCount: number = 0;
  private lastExecutionTime: number | null = null;
  
  inputs: Record<string, any> = {
    timerType: 'delay', // Options: 'delay', 'interval', 'schedule'
    delayMs: 1000, // Delay in milliseconds (for delay timer)
    intervalMs: 5000, // Interval in milliseconds (for interval timer)
    scheduleExpression: '', // Cron-style or natural language expression (for schedule timer)
    scheduleTimezone: 'UTC', // Timezone for schedule
    maxExecutions: 0, // 0 means unlimited
    startOnInitialization: false, // Whether to start timer immediately on initialization
    resetOnInput: true, // Whether to reset timer when input changes
    enabled: true, // Whether the timer is enabled
    triggerNow: false // Immediate execution trigger
  };
  
  outputs: Record<string, any> = {
    triggered: false, // True when timer fires
    triggerCount: 0, // Number of times the timer has fired
    lastTriggerTime: null, // Timestamp of last trigger
    nextTriggerTime: null, // Estimated next trigger time
    remainingTime: null, // Milliseconds until next trigger
    elapsedTime: 0, // Milliseconds elapsed since timer started
    isRunning: false, // Whether the timer is currently running
    error: null
  };
  
  constructor(id: string = nanoid()) {
    this.id = id;
  }
  
  /**
   * Compute timer state and handle timer events
   * Note: In a real application, persistent timers would be managed by the workflow engine
   * rather than within the node itself. This implementation is simplified.
   */
  async compute(): Promise<Record<string, any>> {
    // Clear any existing timer
    this.clearTimer();
    
    const {
      timerType,
      delayMs,
      intervalMs,
      maxExecutions,
      startOnInitialization,
      enabled,
      triggerNow
    } = this.inputs;
    
    // Determine current run state
    const isRunning = enabled && (startOnInitialization || triggerNow);
    
    // Handle immediate execution if triggerNow is true
    if (triggerNow && enabled) {
      this.executionCount++;
      this.lastExecutionTime = Date.now();
      
      const result = {
        triggered: true,
        triggerCount: this.executionCount,
        lastTriggerTime: new Date(this.lastExecutionTime).toISOString(),
        nextTriggerTime: this.calculateNextTriggerTime(timerType),
        remainingTime: this.calculateRemainingTime(),
        elapsedTime: this.calculateElapsedTime(),
        isRunning,
        error: null
      };
      
      // Reset the triggerNow flag after execution
      this.inputs.triggerNow = false;
      
      return result;
    }
    
    // If not enabled, just return current state
    if (!enabled) {
      return {
        triggered: false,
        triggerCount: this.executionCount,
        lastTriggerTime: this.lastExecutionTime ? new Date(this.lastExecutionTime).toISOString() : null,
        nextTriggerTime: null,
        remainingTime: null,
        elapsedTime: this.calculateElapsedTime(),
        isRunning: false,
        error: null
      };
    }
    
    // Initialize timer if needed
    if (isRunning) {
      try {
        this.initializeTimer();
        
        return {
          triggered: false,
          triggerCount: this.executionCount,
          lastTriggerTime: this.lastExecutionTime ? new Date(this.lastExecutionTime).toISOString() : null,
          nextTriggerTime: this.calculateNextTriggerTime(timerType),
          remainingTime: this.calculateRemainingTime(),
          elapsedTime: this.calculateElapsedTime(),
          isRunning: true,
          error: null
        };
      } catch (error) {
        return {
          triggered: false,
          triggerCount: this.executionCount,
          lastTriggerTime: this.lastExecutionTime ? new Date(this.lastExecutionTime).toISOString() : null,
          nextTriggerTime: null,
          remainingTime: null,
          elapsedTime: this.calculateElapsedTime(),
          isRunning: false,
          error: error.message || 'Timer initialization failed'
        };
      }
    }
    
    // Default return if not running or triggered
    return {
      triggered: false,
      triggerCount: this.executionCount,
      lastTriggerTime: this.lastExecutionTime ? new Date(this.lastExecutionTime).toISOString() : null,
      nextTriggerTime: null,
      remainingTime: null,
      elapsedTime: this.calculateElapsedTime(),
      isRunning: false,
      error: null
    };
  }
  
  /**
   * Initialize the timer based on timer type
   */
  private initializeTimer(): void {
    const { timerType, delayMs, intervalMs, scheduleExpression, maxExecutions } = this.inputs;
    
    // Start tracking time
    this.startTime = Date.now();
    
    switch (timerType) {
      case 'delay':
        // For delay timer, schedule a single execution after the specified delay
        this.timerId = window.setTimeout(() => {
          this.handleTimerTrigger();
        }, delayMs);
        break;
        
      case 'interval':
        // For interval timer, schedule repeated executions at the specified interval
        this.timerId = window.setInterval(() => {
          this.handleTimerTrigger();
          
          // Check if we've reached max executions
          if (maxExecutions > 0 && this.executionCount >= maxExecutions) {
            this.clearTimer();
          }
        }, intervalMs);
        break;
        
      case 'schedule':
        // For scheduled timer, we would normally use a cron-style scheduler
        // Since browsers don't have cron, this is a simplified implementation
        // that checks schedule every minute
        this.handleScheduledTimer(scheduleExpression);
        break;
        
      default:
        throw new Error(`Unsupported timer type: ${timerType}`);
    }
  }
  
  /**
   * Handle scheduled timer with cron-style expressions
   * Note: This is a simplified implementation for demonstration purposes
   */
  private handleScheduledTimer(scheduleExpression: string): void {
    // In a real implementation, this would parse cron expressions
    // For this demo, we'll just handle a few natural language expressions
    
    const now = new Date();
    let nextRun: Date = new Date();
    
    // Simple parser for natural language expressions
    if (scheduleExpression.includes('every minute')) {
      // Set to the next minute
      nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                          now.getHours(), now.getMinutes() + 1, 0);
    } else if (scheduleExpression.includes('every hour')) {
      // Set to the next hour
      nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                          now.getHours() + 1, 0, 0);
    } else if (scheduleExpression.includes('daily') || scheduleExpression.includes('every day')) {
      // Try to extract time like "daily at 9:00"
      const timeMatch = scheduleExpression.match(/(\d{1,2}):(\d{2})/);
      const hour = timeMatch ? parseInt(timeMatch[1]) : 0;
      const minute = timeMatch ? parseInt(timeMatch[2]) : 0;
      
      nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
      
      // If the time today has already passed, schedule for tomorrow
      if (nextRun <= now) {
        nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour, minute, 0);
      }
    } else {
      // Default: assume it's a specific time today
      const timeMatch = scheduleExpression.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2]);
        
        nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
        
        // If the time today has already passed, schedule for tomorrow
        if (nextRun <= now) {
          nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour, minute, 0);
        }
      } else {
        // If we can't parse the expression, default to running in one minute
        nextRun = new Date(now.getTime() + 60000);
      }
    }
    
    // Calculate time until next run
    const timeUntilNextRun = nextRun.getTime() - now.getTime();
    
    // Schedule the next execution
    this.timerId = window.setTimeout(() => {
      this.handleTimerTrigger();
      
      // Re-schedule if we haven't reached max executions
      const { maxExecutions } = this.inputs;
      if (!maxExecutions || this.executionCount < maxExecutions) {
        this.handleScheduledTimer(scheduleExpression);
      }
    }, timeUntilNextRun);
  }
  
  /**
   * Handle a timer trigger event
   */
  private handleTimerTrigger(): void {
    this.executionCount++;
    this.lastExecutionTime = Date.now();
    
    // In a real workflow engine, this would notify the execution engine
    // that the timer has triggered and processing should continue
    // For this demo, we just update our outputs
    this.outputs.triggered = true;
    this.outputs.triggerCount = this.executionCount;
    this.outputs.lastTriggerTime = new Date(this.lastExecutionTime).toISOString();
    this.outputs.nextTriggerTime = this.calculateNextTriggerTime(this.inputs.timerType);
    this.outputs.remainingTime = this.calculateRemainingTime();
    this.outputs.elapsedTime = this.calculateElapsedTime();
    
    // For delay timer, we're done after one execution
    if (this.inputs.timerType === 'delay') {
      this.clearTimer();
      this.outputs.isRunning = false;
    }
  }
  
  /**
   * Clear the current timer
   */
  private clearTimer(): void {
    if (this.timerId !== null) {
      if (this.inputs.timerType === 'interval') {
        window.clearInterval(this.timerId);
      } else {
        window.clearTimeout(this.timerId);
      }
      this.timerId = null;
    }
  }
  
  /**
   * Calculate the estimated next trigger time
   */
  private calculateNextTriggerTime(timerType: string): string | null {
    const now = Date.now();
    
    if (!this.timerId) {
      return null;
    }
    
    let nextTime: Date | null = null;
    
    switch (timerType) {
      case 'delay':
        nextTime = new Date(this.startTime + this.inputs.delayMs);
        break;
        
      case 'interval':
        if (this.lastExecutionTime) {
          nextTime = new Date(this.lastExecutionTime + this.inputs.intervalMs);
        } else if (this.startTime) {
          nextTime = new Date(this.startTime + this.inputs.intervalMs);
        }
        break;
        
      case 'schedule':
        // Calculating next time for schedule would require parsing the cron expression
        // This is a placeholder for a real implementation
        nextTime = null;
        break;
    }
    
    return nextTime ? nextTime.toISOString() : null;
  }
  
  /**
   * Calculate remaining time until next trigger
   */
  private calculateRemainingTime(): number | null {
    const nextTrigger = this.outputs.nextTriggerTime;
    
    if (!nextTrigger) {
      return null;
    }
    
    const now = Date.now();
    const next = new Date(nextTrigger).getTime();
    
    return Math.max(0, next - now);
  }
  
  /**
   * Calculate elapsed time since timer started
   */
  private calculateElapsedTime(): number {
    if (!this.startTime) {
      return 0;
    }
    
    return Date.now() - this.startTime;
  }
  
  /**
   * Clean up when node is removed
   * This should be called by the workflow engine when the node is deleted
   */
  public cleanup(): void {
    this.clearTimer();
  }
}

// Register the node with the NodeRegistry
NodeRegistry.getInstance().registerNodeType({
  type: 'timer',
  name: 'Timer',
  category: NodeCategory.CONTROL_FLOW,
  description: 'Schedule operations or introduce delays in workflows',
  nodeClass: TimerNode,
  inputs: [
    { 
      id: 'timerType',
      name: 'timerType', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'Type of timer',
      options: ['delay', 'interval', 'schedule'],
      defaultValue: 'delay'
    },
    { 
      id: 'delayMs',
      name: 'delayMs', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.INPUT,
      description: 'Delay in milliseconds for delay timer', 
      defaultValue: 1000 
    },
    { 
      id: 'intervalMs',
      name: 'intervalMs', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.INPUT,
      description: 'Interval in milliseconds for interval timer', 
      defaultValue: 5000 
    },
    { 
      id: 'scheduleExpression',
      name: 'scheduleExpression', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'Cron-style or natural language expression for scheduled timer' 
    },
    { 
      id: 'scheduleTimezone',
      name: 'scheduleTimezone', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'Timezone for schedule', 
      defaultValue: 'UTC' 
    },
    { 
      id: 'maxExecutions',
      name: 'maxExecutions', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.INPUT,
      description: 'Maximum number of executions (0 for unlimited)', 
      defaultValue: 0 
    },
    { 
      id: 'startOnInitialization',
      name: 'startOnInitialization', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.INPUT,
      description: 'Whether to start timer immediately on initialization', 
      defaultValue: false 
    },
    { 
      id: 'resetOnInput',
      name: 'resetOnInput', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.INPUT,
      description: 'Whether to reset timer when input changes', 
      defaultValue: true 
    },
    { 
      id: 'enabled',
      name: 'enabled', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.INPUT,
      description: 'Whether the timer is enabled', 
      defaultValue: true 
    },
    { 
      id: 'triggerNow',
      name: 'triggerNow', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.INPUT,
      description: 'Immediate execution trigger', 
      defaultValue: false 
    }
  ],
  outputs: [
    { 
      id: 'triggered',
      name: 'triggered', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.OUTPUT,
      description: 'True when timer fires' 
    },
    { 
      id: 'triggerCount',
      name: 'triggerCount', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.OUTPUT,
      description: 'Number of times the timer has fired' 
    },
    { 
      id: 'lastTriggerTime',
      name: 'lastTriggerTime', 
      type: FieldType.STRING, 
      direction: FieldDirection.OUTPUT,
      description: 'Timestamp of last trigger' 
    },
    { 
      id: 'nextTriggerTime',
      name: 'nextTriggerTime', 
      type: FieldType.STRING, 
      direction: FieldDirection.OUTPUT,
      description: 'Estimated next trigger time' 
    },
    { 
      id: 'remainingTime',
      name: 'remainingTime', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.OUTPUT,
      description: 'Milliseconds until next trigger' 
    },
    { 
      id: 'elapsedTime',
      name: 'elapsedTime', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.OUTPUT,
      description: 'Milliseconds elapsed since timer started' 
    },
    { 
      id: 'isRunning',
      name: 'isRunning', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.OUTPUT,
      description: 'Whether the timer is currently running' 
    },
    { 
      id: 'error',
      name: 'error', 
      type: FieldType.STRING, 
      direction: FieldDirection.OUTPUT,
      description: 'Error message if timer initialization fails' 
    }
  ],
  icon: 'TimerOutlined' // Material UI icon name
});
