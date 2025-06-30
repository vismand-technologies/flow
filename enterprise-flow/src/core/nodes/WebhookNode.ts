import { NodeRegistry } from '../models/NodeRegistry';
import type { Node, Field } from '../models/types';
import { FieldType, FieldDirection, NodeCategory } from '../models/types';
import { nanoid } from 'nanoid';
import { createErrorResponse } from '../utils/errorHandling';

/**
 * WebhookNode
 * Integration node for webhook event handling and transmission
 * Supports both receiving external events and sending webhook notifications
 */
export class WebhookNode implements Node {
  id: string;
  type: string = 'webhook';
  name: string = 'Webhook';
  category: string = NodeCategory.INTEGRATION;
  description: string = 'Handle incoming webhook events or send outgoing webhook notifications';
  position: { x: number; y: number } = { x: 0, y: 0 };
  data: { [key: string]: any; inputs: Record<string, Field>; outputs: Record<string, Field>; } = {
    inputs: {},
    outputs: {}
  };
  
  // Internal state for webhook management
  private static webhookRegistry: Map<string, any> = new Map();
  private webhookId: string | null = null;
  private lastEvent: any = null;
  private eventCount: number = 0;
  
  inputs: Record<string, any> = {
    mode: 'receive', // Options: 'receive' or 'send'
    endpoint: '', // For send mode: URL to send webhook to
    method: 'POST', // For send mode: HTTP method
    headers: {}, // For send mode: HTTP headers
    payload: null, // For send mode: Payload to send
    authentication: {
      type: 'none', // Options: 'none', 'basic', 'bearer', 'apiKey'
      username: '',
      password: '',
      token: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyLocation: 'header' // Options: 'header', 'query'
    },
    path: '', // For receive mode: URL path to register webhook on
    secret: '', // For receive mode: Secret for webhook validation
    eventTypes: [], // For receive mode: Types of events to accept
    isActive: true // Whether webhook is active
  };
  
  outputs: Record<string, any> = {
    event: null, // For receive mode: The received event data
    lastEventTime: null, // For receive mode: Timestamp of last event
    eventCount: 0, // For receive mode: Count of received events
    response: null, // For send mode: Response from webhook delivery
    status: null, // For send mode: Status of webhook delivery
    error: null, // Error information
    webhookUrl: '' // For receive mode: Full webhook URL to share
  };
  
  constructor(id: string = nanoid()) {
    this.id = id;
  }
  
  /**
   * Compute based on webhook mode
   */
  async compute(): Promise<Record<string, any>> {
    const { mode, isActive } = this.inputs;
    
    try {
      if (!isActive) {
        // Deactivate any existing webhook
        this.deactivateWebhook();
        
        return {
          event: null,
          lastEventTime: this.lastEvent ? this.lastEvent.timestamp : null,
          eventCount: this.eventCount,
          response: null,
          status: 'inactive',
          error: null,
          webhookUrl: ''
        };
      }
      
      if (mode === 'receive') {
        return this.handleReceiveMode();
      } else if (mode === 'send') {
        return this.handleSendMode();
      } else {
        throw new Error(`Invalid webhook mode: ${mode}`);
      }
    } catch (error: unknown) {
      return {
        event: null,
        lastEventTime: null,
        eventCount: this.eventCount,
        response: null,
        status: 'error',
        ...createErrorResponse(error, undefined, 'Webhook operation failed'),
        webhookUrl: ''
      };
    }
  }
  
  /**
   * Handle receive mode - register a webhook endpoint to receive events
   */
  private async handleReceiveMode(): Promise<Record<string, any>> {
    const { path, secret, eventTypes } = this.inputs;
    
    if (!path) {
      throw new Error('Webhook path is required for receive mode');
    }
    
    // Check if we already have a registered webhook
    if (!this.webhookId) {
      this.webhookId = await this.registerWebhook(path, secret, eventTypes);
    }
    
    // Generate webhook URL (in a real system, this would include domain, etc.)
    const webhookUrl = `/api/webhooks${path}`;
    
    // Check if there's a new event since last compute
    const newEvent = await this.checkForNewEvent();
    
    if (newEvent) {
      this.lastEvent = newEvent;
      this.eventCount++;
      
      return {
        event: newEvent.data,
        lastEventTime: newEvent.timestamp,
        eventCount: this.eventCount,
        response: null,
        status: 'received',
        error: null,
        webhookUrl
      };
    }
    
    // No new event
    return {
      event: null,
      lastEventTime: this.lastEvent ? this.lastEvent.timestamp : null,
      eventCount: this.eventCount,
      response: null,
      status: 'waiting',
      error: null,
      webhookUrl
    };
  }
  
  /**
   * Handle send mode - send a webhook notification to an external endpoint
   */
  private async handleSendMode(): Promise<Record<string, any>> {
    const { endpoint, method, headers, payload, authentication } = this.inputs;
    
    if (!endpoint) {
      throw new Error('Endpoint URL is required for send mode');
    }
    
    // Prepare request headers with authentication
    const requestHeaders = this.prepareHeaders(headers, authentication);
    
    try {
      // In a real implementation, this would make an actual HTTP request
      // For this demo, we'll mock the response
      const response = await this.mockSendWebhook(endpoint, method, requestHeaders, payload);
      
      return {
        event: null,
        lastEventTime: null,
        eventCount: 0,
        response: response.data,
        status: response.status,
        error: null,
        webhookUrl: ''
      };
    } catch (error: unknown) {
      return {
        event: null,
        lastEventTime: null,
        eventCount: 0,
        response: null,
        status: 'failed',
        ...createErrorResponse(error, undefined, 'Failed to send webhook'),
        webhookUrl: ''
      };
    }
  }
  
  /**
   * Register a webhook endpoint (mock implementation)
   */
  private async registerWebhook(path: string, secret: string, eventTypes: string[]): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const webhookId = nanoid();
        
        // Register webhook in static registry
        WebhookNode.webhookRegistry.set(webhookId, {
          id: webhookId,
          nodeId: this.id,
          path,
          secret,
          eventTypes,
          createdAt: new Date().toISOString(),
          events: []
        });
        
        resolve(webhookId);
      }, 100);
    });
  }
  
  /**
   * Deactivate a webhook
   */
  private deactivateWebhook(): void {
    if (this.webhookId) {
      WebhookNode.webhookRegistry.delete(this.webhookId);
      this.webhookId = null;
    }
  }
  
  /**
   * Check for new events on the registered webhook
   */
  private async checkForNewEvent(): Promise<any | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // This is a mock implementation
        // In a real system, this would check a queue or database for new events
        
        if (!this.webhookId || !WebhookNode.webhookRegistry.has(this.webhookId)) {
          resolve(null);
          return;
        }
        
        // 20% chance of having a new event for demonstration
        const hasNewEvent = Math.random() < 0.2;
        
        if (!hasNewEvent) {
          resolve(null);
          return;
        }
        
        // Generate a mock event
        const event = {
          id: nanoid(),
          timestamp: new Date().toISOString(),
          type: this.inputs.eventTypes.length > 0 
            ? this.inputs.eventTypes[Math.floor(Math.random() * this.inputs.eventTypes.length)]
            : 'default',
          data: {
            action: 'update',
            resource: 'item',
            resourceId: Math.floor(Math.random() * 1000).toString(),
            changes: {
              status: 'completed',
              updatedAt: new Date().toISOString()
            }
          }
        };
        
        // Store event in webhook registry
        const webhook = WebhookNode.webhookRegistry.get(this.webhookId);
        webhook.events.push(event);
        
        resolve(event);
      }, 150);
    });
  }
  
  /**
   * Mock sending a webhook to an external endpoint
   */
  private async mockSendWebhook(
    endpoint: string,
    _method: string,
    _headers: Record<string, string>,
    _payload: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Validate URL format
        try {
          new URL(endpoint);
        } catch (error) {
          reject(new Error('Invalid endpoint URL'));
          return;
        }
        
        // Mock success or failure based on endpoint and payload
        if (endpoint.includes('example.com/error') || endpoint.includes('invalid')) {
          reject(new Error('Failed to deliver webhook: Remote server error'));
          return;
        }
        
        // Simulate 5% random failures
        if (Math.random() < 0.05) {
          reject(new Error('Failed to deliver webhook: Connection timeout'));
          return;
        }
        
        // Mock successful response
        resolve({
          data: {
            success: true,
            message: 'Webhook received',
            timestamp: new Date().toISOString()
          },
          status: 'delivered',
          statusCode: 200
        });
      }, 300); // Simulate network delay
    });
  }
  
  /**
   * Prepare headers with authentication
   */
  private prepareHeaders(
    headers: Record<string, string>,
    authentication: Record<string, any>
  ): Record<string, string> {
    // Start with user-provided headers
    const result: Record<string, string> = { ...headers };
    
    // Add authentication headers
    if (authentication) {
      switch (authentication.type) {
        case 'basic':
          if (authentication.username || authentication.password) {
            const credentials = btoa(`${authentication.username || ''}:${authentication.password || ''}`);
            result['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'bearer':
          if (authentication.token) {
            result['Authorization'] = `Bearer ${authentication.token}`;
          }
          break;
        case 'apiKey':
          if (authentication.apiKeyLocation === 'header' && authentication.apiKeyName && authentication.apiKeyValue) {
            result[authentication.apiKeyName] = authentication.apiKeyValue;
          }
          break;
      }
    }
    
    // Add content type if not present
    if (!result['Content-Type']) {
      result['Content-Type'] = 'application/json';
    }
    
    return result;
  }
  
  /**
   * Clean up resources when node is removed
   */
  public cleanup(): void {
    this.deactivateWebhook();
  }
  
  /**
   * Static method to trigger a webhook event (for testing/demo)
   * This would be called by an API endpoint in a real system
   */
  public static triggerWebhook(path: string, eventType: string, data: any): boolean {
    // Find webhook that matches the path
    for (const [_id, webhook] of this.webhookRegistry.entries()) {
      if (webhook.path === path) {
        // Check if webhook accepts this event type
        if (webhook.eventTypes.length === 0 || webhook.eventTypes.includes(eventType)) {
          // Create event
          const event = {
            id: nanoid(),
            timestamp: new Date().toISOString(),
            type: eventType,
            data
          };
          
          // Add to webhook's event queue
          webhook.events.push(event);
          return true;
        }
      }
    }
    
    return false;
  }
}

// Register the node with the NodeRegistry
NodeRegistry.getInstance().registerNodeType({
  type: 'webhook',
  name: 'Webhook',
  category: NodeCategory.INTEGRATION,
  description: 'Handle incoming webhook events or send outgoing webhook notifications',
  nodeClass: WebhookNode,
  inputs: [
    { 
      id: 'mode',
      name: 'mode', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'Webhook operation mode',
      options: ['receive', 'send'],
      defaultValue: 'receive'
    },
    { id: 'endpoint', name: 'endpoint', type: FieldType.STRING, direction: FieldDirection.INPUT, description: 'For send mode: URL to send webhook to' },
    { 
      id: 'method',
      name: 'method', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'For send mode: HTTP method',
      options: ['POST', 'PUT', 'PATCH'],
      defaultValue: 'POST'
    },
    { id: 'headers', name: 'headers', type: FieldType.OBJECT, direction: FieldDirection.INPUT, description: 'For send mode: HTTP headers', defaultValue: {} },
    { id: 'payload', name: 'payload', type: FieldType.ANY, direction: FieldDirection.INPUT, description: 'For send mode: Payload to send' },
    { 
      id: 'authentication',
      name: 'authentication', 
      type: FieldType.OBJECT, 
      direction: FieldDirection.INPUT,
      description: 'Authentication configuration',
      defaultValue: {
        type: 'none',
        username: '',
        password: '',
        token: '',
        apiKeyName: '',
        apiKeyValue: '',
        apiKeyLocation: 'header'
      }
    },
    { id: 'path', name: 'path', type: FieldType.STRING, direction: FieldDirection.INPUT, description: 'For receive mode: URL path to register webhook on' },
    { id: 'secret', name: 'secret', type: FieldType.STRING, direction: FieldDirection.INPUT, description: 'For receive mode: Secret for webhook validation' },
    { id: 'eventTypes', name: 'eventTypes', type: FieldType.ARRAY, direction: FieldDirection.INPUT, description: 'For receive mode: Types of events to accept', defaultValue: [] },
    { id: 'isActive', name: 'isActive', type: FieldType.BOOLEAN, direction: FieldDirection.INPUT, description: 'Whether webhook is active', defaultValue: true }
  ],
  outputs: [
    { id: 'event', name: 'event', type: FieldType.ANY, direction: FieldDirection.OUTPUT, description: 'For receive mode: The received event data' },
    { id: 'lastEventTime', name: 'lastEventTime', type: FieldType.STRING, direction: FieldDirection.OUTPUT, description: 'For receive mode: Timestamp of last event' },
    { id: 'eventCount', name: 'eventCount', type: FieldType.NUMBER, direction: FieldDirection.OUTPUT, description: 'For receive mode: Count of received events' },
    { id: 'response', name: 'response', type: FieldType.ANY, direction: FieldDirection.OUTPUT, description: 'For send mode: Response from webhook delivery' },
    { id: 'status', name: 'status', type: FieldType.STRING, direction: FieldDirection.OUTPUT, description: 'Status of webhook operation' },
    { id: 'error', name: 'error', type: FieldType.STRING, direction: FieldDirection.OUTPUT, description: 'Error information' },
    { id: 'webhookUrl', name: 'webhookUrl', type: FieldType.STRING, direction: FieldDirection.OUTPUT, description: 'For receive mode: Full webhook URL to share' }
  ],
  icon: 'WebhookOutlined' // Material UI icon name
});
