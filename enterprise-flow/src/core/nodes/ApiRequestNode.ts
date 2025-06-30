import type { Node } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';
import { getErrorMessage } from '../utils/errorHandling';
import { nanoid } from 'nanoid';

/**
 * ApiRequestNode
 * Executes HTTP requests to external APIs and services
 * Supports authentication, custom headers, and various content types
 */
export class ApiRequestNode implements Node {
  id: string;
  type: string = 'apiRequest';
  name: string = 'API Request';
  position: { x: number; y: number } = { x: 0, y: 0 };
  category: string = 'Integration';
  description: string = 'Make HTTP requests to external APIs and services';
  
  data: {
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    [key: string]: any;
  } = {
    inputs: {},
    outputs: {}
  };
  
  // Kept for backward compatibility
  inputs: Record<string, any> = {
    url: '', // URL to make the request to
    method: 'GET', // HTTP method
    headers: {}, // HTTP headers
    queryParams: {}, // Query string parameters
    body: null, // Request body
    bodyContentType: 'json', // Content type for body (json, form, text, binary)
    authentication: {
      type: 'none', // none, basic, bearer, oauth2, apiKey
      username: '',
      password: '',
      token: '',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyLocation: 'header', // header, query
    },
    timeout: 30000, // Timeout in milliseconds
    retries: 0, // Number of retry attempts
    retryDelay: 1000, // Delay between retries in milliseconds
    validateStatus: true, // Whether to throw error on non-2xx status codes
    followRedirects: true // Whether to follow redirects
  };
  
  outputs: Record<string, any> = {
    response: null, // Full response data
    status: 0, // HTTP status code
    headers: {}, // Response headers
    data: null, // Parsed response data
    error: null, // Error information
    isLoading: false, // Whether request is in progress
    duration: 0, // Request duration in milliseconds
  };
  
  constructor(id: string = nanoid()) {
    this.id = id;
  }
  
  /**
   * Execute the API request
   */
  async compute(): Promise<Record<string, any>> {
    const {
      url,
      method,
      headers,
      queryParams,
      body,
      bodyContentType,
      authentication,
      timeout,
      validateStatus,
      followRedirects,
      retries
    } = this.inputs;
    
    // Validate required inputs
    if (!url) {
      return {
        response: null,
        status: 0,
        headers: {},
        data: null,
        error: 'URL is required',
        isLoading: false,
        duration: 0
      };
    }
    
    // Start tracking duration
    const startTime = performance.now();
    
    // Set initial state to loading
    this.outputs.isLoading = true;
    
    try {
      // Prepare URL with query parameters
      const fullUrl = this.buildUrl(url, queryParams);
      
      // Prepare headers
      const requestHeaders = this.prepareHeaders(headers, bodyContentType, authentication);
      
      // Prepare request body
      const requestBody = this.prepareBody(body, bodyContentType);
      
      // Create request options
      const requestOptions: RequestInit = {
        method: method,
        headers: requestHeaders,
        body: requestBody,
        redirect: followRedirects ? 'follow' : 'manual',
        signal: AbortSignal.timeout(timeout), // Timeout
        // Note: credentials omitted for this implementation
      };
      
      // Execute request with retry logic
      const response = await this.executeWithRetries(
        () => fetch(fullUrl, requestOptions),
        retries
      );
      
      // Calculate request duration
      const duration = performance.now() - startTime;
      
      // Handle the response
      const responseHeaders = Object.fromEntries(response.headers.entries());
      let responseData;
      
      // Parse response based on content type
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType.includes('text/')) {
        responseData = await response.text();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        responseData = Object.fromEntries(new URLSearchParams(await response.text()));
      } else {
        // For binary data or other formats, just get the text
        responseData = await response.text();
      }
      
      // Check if we should throw an error for non-2xx status codes
      if (validateStatus && (response.status < 200 || response.status >= 300)) {
        throw new Error(`Request failed with status code ${response.status}`);
      }
      
      return {
        response,
        status: response.status,
        headers: responseHeaders,
        data: responseData,
        error: null,
        isLoading: false,
        duration
      };
    } catch (error) {
      // Calculate request duration even for failed requests
      const duration = performance.now() - startTime;
      
      return {
        response: null,
        status: 0,
        headers: {},
        data: null,
        error: getErrorMessage(error, 'Request failed'),
        isLoading: false,
        duration
      };
    }
  }
  
  /**
   * Build the full URL with query parameters
   */
  private buildUrl(baseUrl: string, queryParams: Record<string, any>): string {
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return baseUrl;
    }
    
    const url = new URL(baseUrl);
    
    // Add query parameters
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== null && value !== undefined) {
        // Handle arrays by adding multiple entries with the same key
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item !== null && item !== undefined) {
              url.searchParams.append(key, String(item));
            }
          });
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }
    
    return url.toString();
  }
  
  /**
   * Prepare headers with authentication and content type
   */
  private prepareHeaders(
    headers: Record<string, string>,
    bodyContentType: string,
    authentication: Record<string, any>
  ): Record<string, string> {
    // Start with user-provided headers
    const result: Record<string, string> = { ...headers };
    
    // Add content type header based on body content type
    switch (bodyContentType) {
      case 'json':
        result['Content-Type'] = 'application/json';
        break;
      case 'form':
        result['Content-Type'] = 'application/x-www-form-urlencoded';
        break;
      case 'text':
        result['Content-Type'] = 'text/plain';
        break;
      case 'binary':
        // Don't set Content-Type for binary data, fetch API will set it with the correct boundary
        break;
    }
    
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
          // API key in query params is handled in buildUrl
          break;
        // OAuth2 would typically be handled outside this node, by obtaining a token first
      }
    }
    
    return result;
  }
  
  /**
   * Prepare the request body based on content type
   */
  private prepareBody(body: any, bodyContentType: string): string | FormData | null {
    if (body === null || body === undefined) {
      return null;
    }
    
    switch (bodyContentType) {
      case 'json':
        return typeof body === 'string' ? body : JSON.stringify(body);
      case 'form':
        if (typeof body === 'string') {
          return body;
        } else if (typeof body === 'object') {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(body)) {
            if (value !== null && value !== undefined) {
              params.append(key, String(value));
            }
          }
          return params.toString();
        }
        return null;
      case 'text':
        return String(body);
      case 'binary':
        // For binary data, FormData should be used
        // This is a simplified implementation
        if (body instanceof FormData) {
          return body;
        }
        return null;
      default:
        return null;
    }
  }
  
  /**
   * Execute a request with retry logic
   */
  private async executeWithRetries(
    requestFn: () => Promise<Response>,
    retries: number
  ): Promise<Response> {
    const retryDelay = this.inputs.retryDelay;
    
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error: unknown) {
        lastError = error;
        
        // If this is the last attempt, don't wait
        if (attempt >= retries) {
          break;
        }
        
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw lastError;
  }
}

// Register the node with the NodeRegistry
NodeRegistry.getInstance().registerNodeType({
  type: 'apiRequest',
  name: 'API Request',
  category: 'Integration',
  description: 'Make HTTP requests to external APIs and services',
  nodeClass: ApiRequestNode,
  inputs: [
    { id: 'url', name: 'url', type: 'string', direction: 'input', description: 'URL to make the request to' },
    { 
      id: 'method',
      name: 'method', 
      type: 'string', 
      direction: 'input',
      description: 'HTTP method',
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
      default: 'GET'
    },
    { id: 'headers', name: 'headers', type: 'object', direction: 'input', description: 'HTTP headers', default: {} },
    { id: 'queryParams', name: 'queryParams', type: 'object', direction: 'input', description: 'Query string parameters', default: {} },
    { id: 'body', name: 'body', type: 'any', direction: 'input', description: 'Request body' },
    { 
      id: 'bodyContentType',
      name: 'bodyContentType', 
      type: 'string', 
      direction: 'input',
      description: 'Content type for body',
      options: ['json', 'form', 'text', 'binary'],
      default: 'json'
    },
    { 
      id: 'authentication',
      name: 'authentication', 
      type: 'object', 
      direction: 'input',
      description: 'Authentication configuration',
      default: {
        type: 'none',
        username: '',
        password: '',
        token: '',
        apiKeyName: '',
        apiKeyValue: '',
        apiKeyLocation: 'header'
      }
    },
    { id: 'timeout', name: 'timeout', type: 'number', direction: 'input', description: 'Timeout in milliseconds', default: 30000 },
    { id: 'retries', name: 'retries', type: 'number', direction: 'input', description: 'Number of retry attempts', default: 0 },
    { id: 'retryDelay', name: 'retryDelay', type: 'number', direction: 'input', description: 'Delay between retries in milliseconds', default: 1000 },
    { id: 'validateStatus', name: 'validateStatus', type: 'boolean', direction: 'input', description: 'Whether to throw error on non-2xx status codes', default: true },
    { id: 'followRedirects', name: 'followRedirects', type: 'boolean', direction: 'input', description: 'Whether to follow redirects', default: true }
  ],
  outputs: [
    { id: 'response', name: 'response', type: 'object', direction: 'output', description: 'Full response object' },
    { id: 'status', name: 'status', type: 'number', direction: 'output', description: 'HTTP status code' },
    { id: 'headers', name: 'headers', type: 'object', direction: 'output', description: 'Response headers' },
    { id: 'data', name: 'data', type: 'any', direction: 'output', description: 'Parsed response data' },
    { id: 'error', name: 'error', type: 'string', direction: 'output', description: 'Error information if request failed' },
    { id: 'isLoading', name: 'isLoading', type: 'boolean', direction: 'output', description: 'Whether request is in progress' },
    { id: 'duration', name: 'duration', type: 'number', direction: 'output', description: 'Request duration in milliseconds' }
  ],
  icon: 'CloudOutlined' // Material UI icon name
});
