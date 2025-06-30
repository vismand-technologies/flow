import { 
  WorkflowExecution, 
  MonitoringSummary, 
  PerformanceMetrics, 
  WorkflowAlert,
  WorkflowMonitoringFilterOptions
} from './monitoringTypes';

/**
 * Service to handle workflow monitoring data operations
 * In a real implementation, this would make API calls to backend services
 */
export class MonitoringService {
  private static instance: MonitoringService;
  
  // Mock data storage - in production, this would be handled by the backend
  private mockExecutions: WorkflowExecution[] = [];
  private mockAlerts: WorkflowAlert[] = [];
  
  private constructor() {
    // Initialize mock data
    this.generateMockData();
  }
  
  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }
  
  /**
   * Get a summary of monitoring metrics
   */
  public async getMonitoringSummary(workflowId?: string): Promise<MonitoringSummary> {
    // Simulate API call delay
    await this.delay(300);
    
    // Filter executions by workflow ID if provided
    const executions = workflowId 
      ? this.mockExecutions.filter(exec => exec.workflowId === workflowId)
      : this.mockExecutions;
    
    const activeExecs = executions.filter(exec => exec.status === 'running');
    const completedExecs = executions.filter(exec => exec.status === 'completed');
    const failedExecs = executions.filter(exec => exec.status === 'failed');
    const totalExecs = executions.length;
    
    // Calculate metrics
    const avgDuration = completedExecs.length > 0
      ? completedExecs.reduce((sum, exec) => sum + (exec.duration || 0), 0) / completedExecs.length
      : 0;
    
    const successRate = totalExecs > 0
      ? (completedExecs.length / totalExecs) * 100
      : 0;
    
    const alertCount = workflowId
      ? this.mockAlerts.filter(alert => alert.workflowId === workflowId).length
      : this.mockAlerts.length;
    
    return {
      activeExecutions: activeExecs.length,
      completedExecutions: completedExecs.length,
      failedExecutions: failedExecs.length,
      totalExecutions: totalExecs,
      avgExecutionDuration: avgDuration,
      successRate,
      alertCount
    };
  }
  
  /**
   * Get list of workflow executions with optional filtering
   */
  public async getExecutions(filters?: WorkflowMonitoringFilterOptions): Promise<WorkflowExecution[]> {
    // Simulate API call delay
    await this.delay(500);
    
    let executions = [...this.mockExecutions];
    
    // Apply filters if provided
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        executions = executions.filter(exec => filters.status?.includes(exec.status));
      }
      
      if (filters.timeRange) {
        const start = new Date(filters.timeRange.start).getTime();
        const end = new Date(filters.timeRange.end).getTime();
        executions = executions.filter(exec => {
          const execTime = new Date(exec.startTime).getTime();
          return execTime >= start && execTime <= end;
        });
      }
      
      if (filters.initiatedBy && filters.initiatedBy.length > 0) {
        executions = executions.filter(exec => filters.initiatedBy?.includes(exec.initiatedBy));
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        executions = executions.filter(exec => 
          exec.id.toLowerCase().includes(searchLower) ||
          exec.workflowName.toLowerCase().includes(searchLower) ||
          exec.initiatedBy.toLowerCase().includes(searchLower)
        );
      }
    }
    
    // Sort by start time, most recent first
    return executions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }
  
  /**
   * Get detailed execution data for a specific execution
   */
  public async getExecutionDetails(executionId: string): Promise<WorkflowExecution | null> {
    // Simulate API call delay
    await this.delay(200);
    
    const execution = this.mockExecutions.find(exec => exec.id === executionId);
    return execution || null;
  }
  
  /**
   * Get performance metrics data
   */
  public async getPerformanceMetrics(workflowId?: string, timeRange?: string): Promise<PerformanceMetrics> {
    // Simulate API call delay
    await this.delay(400);
    
    // Generate mock performance data
    const today = new Date();
    const executionCounts = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      
      return {
        date: date.toISOString().split('T')[0],
        completed: Math.floor(Math.random() * 10) + 5,
        failed: Math.floor(Math.random() * 3),
        total: Math.floor(Math.random() * 15) + 5
      };
    });
    
    const nodeTypes = [
      'documentProcessor', 
      'chainOfThought', 
      'apiRequest', 
      'transformer', 
      'loop',
      'stateMachine',
      'databaseConnector'
    ];
    
    const executionTimes = nodeTypes.map(nodeType => ({
      nodeType,
      avgDuration: Math.floor(Math.random() * 1000) + 100
    }));
    
    const errorRates = nodeTypes.map(nodeType => ({
      nodeType,
      errorRate: Math.random() * 0.1,
      count: Math.floor(Math.random() * 5)
    }));
    
    return {
      timeRange: timeRange || '7d',
      executionCounts,
      executionTimes,
      errorRates
    };
  }
  
  /**
   * Get alerts for workflows
   */
  public async getAlerts(workflowId?: string): Promise<WorkflowAlert[]> {
    // Simulate API call delay
    await this.delay(300);
    
    if (workflowId) {
      return this.mockAlerts.filter(alert => alert.workflowId === workflowId);
    }
    
    return this.mockAlerts;
  }
  
  /**
   * Update alert (e.g., acknowledge)
   */
  public async updateAlert(alertId: string, updates: Partial<WorkflowAlert>): Promise<WorkflowAlert> {
    // Simulate API call delay
    await this.delay(200);
    
    const alertIndex = this.mockAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) {
      throw new Error(`Alert not found: ${alertId}`);
    }
    
    this.mockAlerts[alertIndex] = {
      ...this.mockAlerts[alertIndex],
      ...updates
    };
    
    return this.mockAlerts[alertIndex];
  }
  
  /**
   * Utility to simulate API call delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Generate mock data for development
   */
  private generateMockData(): void {
    const workflowIds = [
      { id: 'wf-1', name: 'Customer Onboarding' },
      { id: 'wf-2', name: 'Document Processing Pipeline' },
      { id: 'wf-3', name: 'Sales Lead Qualification' }
    ];
    
    const users = ['admin', 'john.doe', 'jane.smith', 'system'];
    const now = Date.now();
    
    // Generate mock executions
    this.mockExecutions = Array.from({ length: 20 }, (_, i) => {
      const workflowChoice = workflowIds[Math.floor(Math.random() * workflowIds.length)];
      const startTime = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const status: WorkflowExecution['status'] = 
        Math.random() > 0.8 ? 'running' : 
        Math.random() > 0.2 ? 'completed' : 'failed';
      
      let endTime: Date | undefined;
      let duration: number | undefined;
      
      if (status !== 'running') {
        duration = Math.floor(Math.random() * 60000) + 5000;
        endTime = new Date(startTime.getTime() + duration);
      }
      
      const totalNodes = Math.floor(Math.random() * 10) + 5;
      const completedNodes = status === 'completed' 
        ? totalNodes 
        : Math.floor(Math.random() * totalNodes);
      const failedNodes = status === 'failed' ? 1 : 0;
      
      // Generate node executions
      const nodeExecutions = Array.from({ length: totalNodes }, (_, j) => {
        const nodeTypes = ['documentProcessor', 'chainOfThought', 'apiRequest', 'transformer', 'databaseConnector', 'loop', 'stateMachine'];
        const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
        const nodeStatus: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' =
          j < completedNodes ? 'completed' :
          j === completedNodes && failedNodes > 0 ? 'failed' :
          status === 'running' && j === completedNodes ? 'running' : 'pending';
        
        const nodeStartTime = j === 0 
          ? startTime 
          : new Date(startTime.getTime() + j * 1000 + Math.random() * 1000);
        
        let nodeEndTime: Date | undefined;
        let nodeDuration: number | undefined;
        
        if (nodeStatus === 'completed' || nodeStatus === 'failed') {
          nodeDuration = Math.floor(Math.random() * 5000) + 100;
          nodeEndTime = new Date(nodeStartTime.getTime() + nodeDuration);
        }
        
        return {
          id: `node-exec-${i}-${j}`,
          nodeId: `node-${j}`,
          nodeName: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${j + 1}`,
          nodeType,
          status: nodeStatus,
          startTime: nodeStartTime.toISOString(),
          endTime: nodeEndTime?.toISOString(),
          duration: nodeDuration,
          inputs: { /* mock inputs */ },
          outputs: nodeStatus === 'completed' ? { /* mock outputs */ } : undefined,
          error: nodeStatus === 'failed' ? {
            message: 'Operation failed',
            code: 'ERR_EXECUTION_FAILED',
            timestamp: nodeEndTime?.toISOString() || new Date().toISOString(),
            nodeId: `node-${j}`
          } : undefined
        };
      });
      
      return {
        id: `exec-${i}`,
        workflowId: workflowChoice.id,
        workflowName: workflowChoice.name,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString(),
        status,
        duration,
        initiatedBy: users[Math.floor(Math.random() * users.length)],
        nodeExecutions,
        error: status === 'failed' ? {
          message: 'Workflow execution failed',
          code: 'ERR_WORKFLOW_FAILED',
          timestamp: endTime?.toISOString() || new Date().toISOString(),
          nodeId: nodeExecutions.find(n => n.status === 'failed')?.nodeId
        } : undefined,
        metrics: {
          totalNodes,
          completedNodes,
          failedNodes,
          avgNodeDuration: Math.floor(Math.random() * 1000) + 200,
          totalDuration: duration
        }
      };
    });
    
    // Generate mock alerts
    const alertTypes = [
      { severity: 'info', message: 'Workflow execution completed successfully' },
      { severity: 'warning', message: 'Execution taking longer than expected' },
      { severity: 'error', message: 'Node execution failed' },
      { severity: 'critical', message: 'Workflow terminated unexpectedly' }
    ];
    
    this.mockAlerts = Array.from({ length: 10 }, (_, i) => {
      const workflowChoice = workflowIds[Math.floor(Math.random() * workflowIds.length)];
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const execution = this.mockExecutions[Math.floor(Math.random() * this.mockExecutions.length)];
      
      return {
        id: `alert-${i}`,
        severity: alertType.severity as WorkflowAlert['severity'],
        message: alertType.message,
        timestamp: new Date(now - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
        workflowId: workflowChoice.id,
        executionId: execution.id,
        nodeId: alertType.severity !== 'info' ? execution.nodeExecutions[0].nodeId : undefined,
        acknowledged: Math.random() > 0.5
      };
    });
  }
}
