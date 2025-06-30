import type { Node, Field } from '../models/types';
import { NodeCategory, FieldType, FieldDirection } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';
import { nanoid } from 'nanoid';
import { getErrorMessage } from '../utils/errorHandling';

/**
 * DatabaseConnectorNode
 * Enterprise integration node for database operations
 * Supports multiple database types and query operations
 */
export class DatabaseConnectorNode implements Node {
  id: string;
  type: string = 'databaseConnector';
  name: string = 'Database Connector';
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
  category: string = NodeCategory.INTEGRATION;
  description: string = 'Connect to databases and execute operations';
  
  inputs: Record<string, any> = {
    connectionConfig: {
      type: 'mysql', // Options: mysql, postgres, sqlite, mongodb, dynamodb, etc.
      host: '',
      port: '',
      database: '',
      username: '',
      password: '',
      connectionString: '',
      useConnectionString: false,
      ssl: false,
      options: {}
    },
    operation: 'query', // Options: query, insert, update, delete, procedure
    query: '',
    parameters: [],
    tableName: '',
    records: [],
    batchSize: 100,
    timeout: 30000,
  };
  
  outputs: Record<string, any> = {
    results: null,
    affectedRows: 0,
    insertId: null,
    fields: [],
    queryTime: 0,
    isConnected: false,
    connectionId: null,
    error: null
  };
  
  // Mock connection pool for demonstration
  private static connections: Map<string, any> = new Map();
  
  constructor(id: string = nanoid()) {
    this.id = id;
  }
  
  /**
   * Execute database operation
   * In a real implementation, this would connect to actual database systems
   */
  async compute(): Promise<Record<string, any>> {
    const startTime = performance.now();
    const {
      connectionConfig,
      operation,
      query,
      parameters,
      tableName,
      records,
      timeout = 30000 // Default 30s timeout
    } = this.inputs;
    
    try {
      // Get or create connection
      const connection = await this.getConnection(connectionConfig);
      
      // Apply timeout to the operation
      setTimeout(() => {
        // This would cancel the operation in a real implementation
        console.log(`Database operation timeout after ${timeout}ms`);
      }, timeout);
      
      // In a real implementation, we would store the timer and clear it when done
      // clearTimeout(timer);
      
      // Mock execution based on operation type
      let results: any[] = [];
      let affectedRows = 0;
      let insertId = null;
      let fields: any[] = [];
      
      switch (operation) {
        case 'query':
          const queryResult = await this.executeQuery(connection, query, parameters);
          results = queryResult.results;
          fields = queryResult.fields;
          break;
          
        case 'insert':
          const insertResult = await this.executeInsert(connection, tableName, records);
          results = insertResult.results;
          affectedRows = insertResult.affectedRows;
          insertId = insertResult.insertId;
          break;
          
        case 'update':
          const updateResult = await this.executeUpdate(connection, tableName, records, query);
          results = updateResult.results;
          affectedRows = updateResult.affectedRows;
          break;
          
        case 'delete':
          const deleteResult = await this.executeDelete(connection, tableName, query, parameters);
          results = deleteResult.results;
          affectedRows = deleteResult.affectedRows;
          break;
          
        case 'procedure':
          results = await this.executeProcedure(connection, query, parameters);
          break;
          
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
      
      const queryTime = performance.now() - startTime;
      
      return {
        results,
        affectedRows,
        insertId,
        fields,
        queryTime,
        isConnected: true,
        connectionId: connection.id,
        error: null
      };
    } catch (error: unknown) {
      const queryTime = performance.now() - startTime;
      
      return {
        results: null,
        affectedRows: 0,
        insertId: null,
        fields: [],
        queryTime,
        isConnected: false,
        connectionId: null,
        error: error instanceof Error ? error.message : 'Database operation failed'
      };
    }
  }
  
  /**
   * Get or create a database connection
   */
  private async getConnection(config: any): Promise<any> {
    // Generate a connection key based on configuration
    const connectionKey = this.getConnectionKey(config);
    
    // Check if connection already exists
    if (DatabaseConnectorNode.connections.has(connectionKey)) {
      return DatabaseConnectorNode.connections.get(connectionKey);
    }
    
    // In a real implementation, this would create an actual database connection
    // Here we just create a mock connection object
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Mock connection logic
          const connection = {
            id: nanoid(),
            config: { ...config },
            isConnected: true,
            createdAt: new Date().toISOString()
          };
          
          // Store in connection pool
          DatabaseConnectorNode.connections.set(connectionKey, connection);
          
          resolve(connection);
        } catch (error: unknown) {
          reject(new Error(`Failed to establish database connection: ${getErrorMessage(error)}`));
        }
      }, 200); // Simulate connection delay
    });
  }
  
  /**
   * Generate a unique key for connection pooling
   */
  private getConnectionKey(config: any): string {
    if (config.useConnectionString && config.connectionString) {
      return `${config.type}:${config.connectionString}`;
    }
    
    return `${config.type}:${config.host}:${config.port}:${config.database}:${config.username}`;
  }
  
  /**
   * Execute query operation
   */
  private async executeQuery(connection: any, query: string, parameters?: any[]): Promise<any> {
    // Mock query execution - in a real implementation this would use a database driver
    console.log(`Executing query on connection ${connection.id} with parameters:`, parameters);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Check query for demonstration purposes
          if (!query.trim()) {
            throw new Error('Query cannot be empty');
          }
          
          // Generate mock results based on the query
          const lowerQuery = query.toLowerCase().trim();
          let results: any[] = [];
          let fields: any[] = [];
          
          if (lowerQuery.includes('select')) {
            // Mock SELECT results
            if (lowerQuery.includes('from users')) {
              fields = ['id', 'name', 'email', 'created_at'];
              results = [
                { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2025-01-15T10:30:00Z' },
                { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2025-02-20T14:45:00Z' },
                { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2025-03-25T09:15:00Z' }
              ];
            } else if (lowerQuery.includes('from products')) {
              fields = ['id', 'name', 'price', 'stock'];
              results = [
                { id: 101, name: 'Laptop', price: 999.99, stock: 45 },
                { id: 102, name: 'Smartphone', price: 699.99, stock: 120 },
                { id: 103, name: 'Headphones', price: 149.99, stock: 78 }
              ];
            } else {
              // Generic results
              fields = ['column1', 'column2', 'column3'];
              results = [
                { column1: 'value1', column2: 'value2', column3: 'value3' },
                { column1: 'value4', column2: 'value5', column3: 'value6' },
                { column1: 'value7', column2: 'value8', column3: 'value9' }
              ];
            }
          } else if (lowerQuery.includes('show tables')) {
            fields = ['Tables_in_database'];
            results = [
              { 'Tables_in_database': 'users' },
              { 'Tables_in_database': 'products' },
              { 'Tables_in_database': 'orders' },
              { 'Tables_in_database': 'customers' }
            ];
          } else if (lowerQuery.includes('describe') || lowerQuery.includes('show columns')) {
            fields = ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'];
            results = [
              { Field: 'id', Type: 'int', Null: 'NO', Key: 'PRI', Default: null, Extra: 'auto_increment' },
              { Field: 'name', Type: 'varchar(255)', Null: 'NO', Key: '', Default: null, Extra: '' },
              { Field: 'email', Type: 'varchar(255)', Null: 'YES', Key: 'UNI', Default: null, Extra: '' },
              { Field: 'created_at', Type: 'timestamp', Null: 'YES', Key: '', Default: 'CURRENT_TIMESTAMP', Extra: '' }
            ];
          }
          
          resolve({ results, fields });
        } catch (error: unknown) {
          reject(error);
        }
      }, 300); // Simulate query delay
    });
  }
  
  /**
   * Execute insert operation
   */
  private async executeInsert(connection: any, tableName: string, records: any[]): Promise<any> {
    // Mock insert execution
    console.log(`Inserting into ${tableName} on connection ${connection.id} with ${records.length} records`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!tableName) {
            throw new Error('Table name is required');
          }
          
          if (!records || !Array.isArray(records) || records.length === 0) {
            throw new Error('Records to insert are required');
          }
          
          // Mock successful insert
          const insertId = Math.floor(Math.random() * 1000) + 1;
          const affectedRows = records.length;
          
          resolve({
            results: { message: `Inserted ${affectedRows} record(s) into ${tableName}` },
            affectedRows,
            insertId
          });
        } catch (error: unknown) {
          reject(error);
        }
      }, 250); // Simulate insert delay
    });
  }
  
  /**
   * Execute update operation
   */
  private async executeUpdate(connection: any, tableName: string, records: any[], whereClause?: string): Promise<any> {
    // Mock update execution
    console.log(`Updating ${tableName} on connection ${connection.id} with ${records.length} records`);
    if (whereClause) {
      console.log(`Where clause: ${whereClause}`);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!tableName) {
            throw new Error('Table name is required');
          }
          
          // Mock successful update
          // In a real implementation, this would use the records and whereClause
          const affectedRows = Math.floor(Math.random() * 5) + 1;
          
          resolve({
            results: { message: `Updated ${affectedRows} record(s) in ${tableName}` },
            affectedRows
          });
        } catch (error: unknown) {
          reject(error);
        }
      }, 200); // Simulate update delay
    });
  }
  
  /**
   * Execute delete operation
   */
  private async executeDelete(connection: any, tableName: string, whereClause: string, parameters?: any[]): Promise<any> {
    // Mock delete execution
    console.log(`Deleting from ${tableName} on connection ${connection.id}`);
    console.log(`Where clause: ${whereClause}`);
    if (parameters && parameters.length > 0) {
      console.log(`With parameters:`, parameters);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!tableName) {
            throw new Error('Table name is required');
          }
          
          if (!whereClause) {
            throw new Error('WHERE clause is required for DELETE operations');
          }
          
          // Mock successful delete
          const affectedRows = Math.floor(Math.random() * 3) + 1;
          
          resolve({
            results: { message: `Deleted ${affectedRows} record(s) from ${tableName}` },
            affectedRows
          });
        } catch (error: unknown) {
          reject(error);
        }
      }, 150); // Simulate delete delay
    });
  }
  
  /**
   * Execute stored procedure
   */
  private async executeProcedure(connection: any, procedureName: string, parameters?: any[]): Promise<any> {
    // Mock procedure execution
    console.log(`Executing procedure ${procedureName} on connection ${connection.id}`);
    if (parameters && parameters.length > 0) {
      console.log(`With parameters:`, parameters);
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!procedureName) {
            throw new Error('Procedure name is required');
          }
          
          // Mock successful procedure call
          resolve([
            [{ result: 'Procedure executed successfully', affectedRows: 2 }],
            [{ status: 'success', message: 'Procedure complete' }]
          ]);
        } catch (error) {
          reject(error);
        }
      }, 350); // Simulate procedure delay
    });
  }
  
  /**
   * Clean up resources when node is removed
   */
  public cleanup(): void {
    // In a real implementation, this would close any open connections
  }
}

// Register the node with the NodeRegistry
NodeRegistry.getInstance().registerNodeType({
  type: 'databaseConnector',
  name: 'Database Connector',
  category: 'Integration',
  description: 'Connect to databases and execute operations',
  nodeClass: DatabaseConnectorNode,
  inputs: [
    { 
      id: 'connectionConfig',
      name: 'connectionConfig', 
      type: FieldType.OBJECT, 
      direction: FieldDirection.INPUT,
      description: 'Database connection configuration',
      default: {
        type: 'mysql',
        host: 'localhost',
        port: '3306',
        database: '',
        username: '',
        password: '',
        connectionString: '',
        useConnectionString: false,
        ssl: false,
        options: {}
      }
    },
    { 
      id: 'operation',
      name: 'operation', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'Database operation to perform',
      options: ['query', 'insert', 'update', 'delete', 'procedure'],
      default: 'query'
    },
    { 
      id: 'query',
      name: 'query', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'SQL query or procedure name' 
    },
    { 
      id: 'parameters',
      name: 'parameters', 
      type: FieldType.ARRAY, 
      direction: FieldDirection.INPUT,
      description: 'Parameters for query or procedure', 
      default: [] 
    },
    { 
      id: 'tableName',
      name: 'tableName', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'Table name for insert, update, delete operations' 
    },
    { 
      id: 'records',
      name: 'records', 
      type: FieldType.ARRAY, 
      direction: FieldDirection.INPUT,
      description: 'Records for insert or update operations', 
      default: [] 
    },
    { 
      id: 'batchSize',
      name: 'batchSize', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.INPUT,
      description: 'Batch size for bulk operations', 
      default: 100 
    },
    { 
      id: 'timeout',
      name: 'timeout', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.INPUT,
      description: 'Query timeout in milliseconds', 
      default: 30000 
    }
  ],
  outputs: [
    { 
      id: 'results',
      name: 'results', 
      type: FieldType.ANY, 
      direction: FieldDirection.OUTPUT,
      description: 'Query results or operation outcome' 
    },
    { 
      id: 'affectedRows',
      name: 'affectedRows', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.OUTPUT,
      description: 'Number of affected rows for write operations' 
    },
    { 
      id: 'insertId',
      name: 'insertId', 
      type: FieldType.ANY, 
      direction: FieldDirection.OUTPUT,
      description: 'Last insert ID for insert operations' 
    },
    { 
      id: 'fields',
      name: 'fields', 
      type: FieldType.ARRAY, 
      direction: FieldDirection.OUTPUT,
      description: 'Field metadata for queries' 
    },
    { 
      id: 'queryTime',
      name: 'queryTime', 
      type: FieldType.NUMBER, 
      direction: FieldDirection.OUTPUT,
      description: 'Query execution time in milliseconds' 
    },
    { 
      id: 'isConnected',
      name: 'isConnected', 
      type: FieldType.BOOLEAN, 
      direction: FieldDirection.OUTPUT,
      description: 'Whether database connection is established' 
    },
    { 
      id: 'connectionId',
      name: 'connectionId', 
      type: FieldType.STRING, 
      direction: FieldDirection.OUTPUT,
      description: 'Unique ID for the connection' 
    },
    { 
      id: 'error',
      name: 'error', 
      type: FieldType.STRING, 
      direction: FieldDirection.OUTPUT,
      description: 'Error message if operation fails' 
    }
  ],
  icon: 'StorageOutlined' // Material UI icon name
});
