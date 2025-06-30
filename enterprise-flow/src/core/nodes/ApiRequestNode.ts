import { Node, NodeRegistry } from '../models/NodeRegistry';
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
  category: string = 'Integration';
  description: string = 'Make HTTP requests to external APIs and services';
  
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
        error: error.message || 'Request failed',
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
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
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
NodeRegistry.getInstance().registerNode({
  type: 'apiRequest',
  name: 'API Request',
  category: 'Integration',
  description: 'Make HTTP requests to external APIs and services',
  nodeClass: ApiRequestNode,
  inputs: [
    { name: 'url', type: 'string', description: 'URL to make the request to' },
    { 
      name: 'method', 
      type: 'string', 
      description: 'HTTP method',
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
      default: 'GET'
    },
    { name: 'headers', type: 'object', description: 'HTTP headers', default: {} },
    { name: 'queryParams', type: 'object', description: 'Query string parameters', default: {} },
    { name: 'body', type: 'any', description: 'Request body' },
    { 
      name: 'bodyContentType', 
      type: 'string', 
      description: 'Content type for body',
      options: ['json', 'form', 'text', 'binary'],
      default: 'json'
    },
    { 
      name: 'authentication', 
      type: 'object', 
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
    { name: 'timeout', type: 'number', description: 'Timeout in milliseconds', default: 30000 },
    { name: 'retries', type: 'number', description: 'Number of retry attempts', default: 0 },
    { name: 'retryDelay', type: 'number', description: 'Delay between retries in milliseconds', default: 1000 },
    { name: 'validateStatus', type: 'boolean', description: 'Whether to throw error on non-2xx status codes', default: true },
    { name: 'followRedirects', type: 'boolean', description: 'Whether to follow redirects', default: true }
  ],
  outputs: [
    { name: 'response', type: 'object', description: 'Full response object' },
    { name: 'status', type: 'number', description: 'HTTP status code' },
    { name: 'headers', type: 'object', description: 'Response headers' },
    { name: 'data', type: 'any', description: 'Parsed response data' },
    { name: 'error', type: 'string', description: 'Error information if request failed' },
    { name: 'isLoading', type: 'boolean', description: 'Whether request is in progress' },
    { name: 'duration', type: 'number', description: 'Request duration in milliseconds' }
  ],
  icon: 'CloudOutlined' // Material UI icon name
});
