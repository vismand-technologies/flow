/**
 * Type definitions for workflow monitoring components
 */

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'canceled' | 'paused';
  duration?: number;
  initiatedBy: string;
  nodeExecutions: NodeExecution[];
  error?: ErrorInfo;
  metrics: ExecutionMetrics;
}

export interface NodeExecution {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: ErrorInfo;
}

export interface ErrorInfo {
  message: string;
  code?: string;
  stack?: string;
  timestamp: string;
  nodeId?: string;
}

export interface ExecutionMetrics {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  avgNodeDuration: number;
  memoryUsage?: number;
  cpuUsage?: number;
  totalDuration?: number;
}

export interface WorkflowAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  workflowId: string;
  executionId?: string;
  nodeId?: string;
  acknowledged: boolean;
}

export interface MonitoringSummary {
  activeExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  totalExecutions: number;
  avgExecutionDuration: number;
  successRate: number;
  alertCount: number;
}

export interface PerformanceMetrics {
  timeRange: string;
  executionCounts: {
    date: string;
    completed: number;
    failed: number;
    total: number;
  }[];
  executionTimes: {
    nodeType: string;
    avgDuration: number;
  }[];
  errorRates: {
    nodeType: string;
    errorRate: number;
    count: number;
  }[];
  resourceUtilization?: {
    timestamp: string;
    cpuUsage: number;
    memoryUsage: number;
  }[];
}

export interface WorkflowMonitoringFilterOptions {
  status?: ('running' | 'completed' | 'failed' | 'canceled' | 'paused')[];
  timeRange?: {
    start: string;
    end: string;
  };
  initiatedBy?: string[];
  search?: string;
}
