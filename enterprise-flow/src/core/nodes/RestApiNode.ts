import { NodeModel } from '../models/NodeModel';
import { FieldType, NodeCategory, FieldDirection } from '../models/types';
import type { Node } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';

/**
 * RestApiNode
 * Implements a node that makes REST API calls to external services
 */
export class RestApiNode extends NodeModel {
  constructor(data?: any) {
    super(
      'rest_api',
      data?.name || 'REST API',
      data?.position || { x: 100, y: 100 },
      data?.id
    );
    
    // Add input fields
    this.addInput('url', FieldType.STRING, data?.inputs?.url?.value || 'https://api.example.com/data');
    this.addInput('method', FieldType.STRING, data?.inputs?.method?.value || 'GET');
    this.addInput('headers', FieldType.OBJECT, data?.inputs?.headers?.value || { 'Content-Type': 'application/json' });
    this.addInput('body', FieldType.OBJECT, data?.inputs?.body?.value || {});
    
    // Add output fields
    this.addOutput('response', FieldType.OBJECT, {});
    this.addOutput('status', FieldType.NUMBER, 0);
    this.addOutput('error', FieldType.STRING, '');
  }

  /**
   * Override compute method to implement REST API call
   * In a real implementation, this would be async and use fetch
   * For simplicity, we'll use a mock implementation here
   */
  compute(): boolean {
    if (!this.isDirty()) {
      return false;
    }
    
    // Get input values
    const url = this.getFieldValue('url', true) as string;
    const method = this.getFieldValue('method', true) as string;
    const headers = this.getFieldValue('headers', true) as Record<string, string>;
    const body = this.getFieldValue('body', true);
    
    try {
      // In a real implementation, this would be an actual API call
      // For now, we'll just mock the response
      const mockResult = this.mockApiCall(url, method, headers, body);
      
      // Set output values
      this.setFieldValue('response', mockResult.data, false);
      this.setFieldValue('status', mockResult.status, false);
      this.setFieldValue('error', '', false);
      
      return true;
    } catch (error: any) {
      // Handle error
      this.setFieldValue('response', {}, false);
      this.setFieldValue('status', 500, false);
      this.setFieldValue('error', error.message || 'Unknown error', false);
      
      return false;
    }
  }

  /**
   * Mock API call for demonstration purposes
   * In a real implementation, this would use fetch or axios
   */
  private mockApiCall(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any
  ): { status: number; data: any } {
    // Simple validation
    if (!url || url.trim() === '') {
      throw new Error('URL is required');
    }
    
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
      throw new Error('Invalid HTTP method');
    }

    // Mock different responses based on URL
    if (url.includes('example.com')) {
      return {
        status: 200,
        data: {
          success: true,
          message: 'Mock API response',
          timestamp: new Date().toISOString(),
          method: method,
          requestHeaders: headers,
          requestBody: body || {}
        }
      };
    } else if (url.includes('error')) {
      throw new Error('API Error: Service unavailable');
    }

    // Default mock response
    return {
      status: 200,
      data: {
        success: true,
        message: `Mock ${method} response for ${url}`,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Register this node type with the NodeRegistry
const registerRestApiNode = () => {
  const registry = NodeRegistry.getInstance();
  
  registry.registerNodeType({
    type: 'rest_api',
    category: NodeCategory.INTEGRATION,
    name: 'REST API',
    description: 'Makes HTTP requests to external API endpoints',
    
    // Define input field definitions
    inputs: [
      {
        id: 'url',
        name: 'URL',
        type: FieldType.STRING,
        direction: FieldDirection.INPUT,
        required: true,
        description: 'API endpoint URL'
      },
      {
        id: 'method',
        name: 'Method',
        type: FieldType.STRING,
        direction: FieldDirection.INPUT,
        required: true,
        description: 'HTTP method (GET, POST, PUT, DELETE, PATCH)'
      },
      {
        id: 'headers',
        name: 'Headers',
        type: FieldType.OBJECT,
        direction: FieldDirection.INPUT,
        required: false,
        description: 'HTTP headers as a JSON object'
      },
      {
        id: 'body',
        name: 'Body',
        type: FieldType.OBJECT,
        direction: FieldDirection.INPUT,
        required: false,
        description: 'HTTP request body as a JSON object'
      }
    ],
    
    // Define output field definitions
    outputs: [
      {
        id: 'response',
        name: 'Response',
        type: FieldType.OBJECT,
        direction: FieldDirection.OUTPUT,
        description: 'API response data'
      },
      {
        id: 'status',
        name: 'Status',
        type: FieldType.NUMBER,
        direction: FieldDirection.OUTPUT,
        description: 'HTTP status code'
      },
      {
        id: 'error',
        name: 'Error',
        type: FieldType.STRING,
        direction: FieldDirection.OUTPUT,
        description: 'Error message if request failed'
      }
    ],
    
    initialize: () => {
      // No special initialization needed
    },
    
    compute: (node: Node) => {
      const apiNode = node as unknown as RestApiNode;
      if (apiNode instanceof RestApiNode) {
        apiNode.compute();
      }
    }
  });
};

export default registerRestApiNode;
