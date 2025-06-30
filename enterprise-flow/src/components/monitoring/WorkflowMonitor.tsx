import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../core/store';
import { workflowExecutionEngine } from '../../core/execution/WorkflowExecutionEngine';
import { Box, Card, CardContent, Typography, Grid, Badge, CircularProgress, LinearProgress } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';

// Types for node execution status
type NodeStatus = 'idle' | 'running' | 'completed' | 'failed';

interface NodeExecutionStatus {
  id: string;
  name: string;
  type: string;
  status: NodeStatus;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface WorkflowExecutionStatus {
  status: 'idle' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  nodeStatuses: Record<string, NodeExecutionStatus>;
  progress: number; // Percentage complete (0-100)
  error?: string;
}

/**
 * WorkflowMonitor component
 * Displays real-time execution status of workflow nodes
 */
const WorkflowMonitor: React.FC = () => {
  // Initial mock data for demonstration
  const [executionStatus, setExecutionStatus] = useState<WorkflowExecutionStatus>({
    status: 'idle',
    nodeStatuses: {},
    progress: 0,
  });

  // Get current workflow from Redux store
  const workflow = useSelector((state: RootState) => state.workflow.currentWorkflow);
  const nodes = useSelector((state: RootState) => state.workflow.nodes);
  
  // Mock function to simulate workflow execution updates for demo purposes
  // In a real implementation, this would subscribe to events from the WorkflowExecutionEngine
  useEffect(() => {
    if (!workflow || !nodes || nodes.length === 0) return;
    
    // Initialize execution status
    const initialStatus: WorkflowExecutionStatus = {
      status: 'idle',
      nodeStatuses: {},
      progress: 0
    };
    
    // Create initial node statuses
    nodes.forEach(node => {
      initialStatus.nodeStatuses[node.id] = {
        id: node.id,
        name: node.data.label || 'Unnamed Node',
        type: node.type || 'unknown',
        status: 'idle'
      };
    });
    
    setExecutionStatus(initialStatus);
    
    // This is just for demonstration, would be replaced with real execution tracking
    const simulateExecution = () => {
      // Set workflow to running
      setExecutionStatus(prev => ({
        ...prev,
        status: 'running',
        startTime: new Date()
      }));
      
      // Process nodes in sequence with delays to simulate execution
      const nodeIds = Object.keys(initialStatus.nodeStatuses);
      let completedNodes = 0;
      
      // Process each node with a delay
      nodeIds.forEach((nodeId, index) => {
        setTimeout(() => {
          setExecutionStatus(prev => {
            const updatedStatuses = {...prev.nodeStatuses};
            updatedStatuses[nodeId] = {
              ...updatedStatuses[nodeId],
              status: 'running',
              startTime: new Date()
            };
            
            return {
              ...prev,
              nodeStatuses: updatedStatuses,
              progress: Math.round((completedNodes / nodeIds.length) * 100)
            };
          });
          
          // After a delay, mark as completed or failed (randomly for demo)
          setTimeout(() => {
            completedNodes++;
            const success = Math.random() > 0.2; // 80% success rate for demo
            
            setExecutionStatus(prev => {
              const updatedStatuses = {...prev.nodeStatuses};
              updatedStatuses[nodeId] = {
                ...updatedStatuses[nodeId],
                status: success ? 'completed' : 'failed',
                endTime: new Date(),
                error: success ? undefined : 'Mock error for demonstration'
              };
              
              const allCompleted = completedNodes >= nodeIds.length;
              const anyFailed = Object.values(updatedStatuses).some(n => n.status === 'failed');
              
              return {
                ...prev,
                nodeStatuses: updatedStatuses,
                progress: Math.round((completedNodes / nodeIds.length) * 100),
                status: allCompleted ? (anyFailed ? 'failed' : 'completed') : 'running',
                endTime: allCompleted ? new Date() : undefined,
                error: anyFailed ? 'One or more nodes failed execution' : undefined
              };
            });
          }, 1500);
        }, index * 800); // Stagger node execution
      });
    };
    
    // Simulate button click to start execution
    const timer = setTimeout(simulateExecution, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [workflow, nodes]);
  
  // Helper to get status color
  const getStatusColor = (status: NodeStatus): string => {
    switch (status) {
      case 'completed': return 'success.main';
      case 'failed': return 'error.main';
      case 'running': return 'info.main';
      default: return 'text.secondary';
    }
  };
  
  // Helper to get status icon
  const getStatusIcon = (status: NodeStatus) => {
    switch (status) {
      case 'completed': return <DoneIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'running': return <CircularProgress size={16} />;
      default: return <PendingIcon color="disabled" />;
    }
  };
  
  // Format execution time
  const formatExecutionTime = (start?: Date, end?: Date): string => {
    if (!start) return 'Not started';
    if (!end) return 'Running...';
    
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 1000) return `${diffMs}ms`;
    return `${(diffMs / 1000).toFixed(2)}s`;
  };

  if (!workflow) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">No active workflow</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Workflow Monitor: {workflow.name}
      </Typography>
      
      {/* Overall workflow status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6">
                Status: {executionStatus.status.charAt(0).toUpperCase() + executionStatus.status.slice(1)}
              </Typography>
              {executionStatus.error && (
                <Typography color="error">{executionStatus.error}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={executionStatus.progress} 
                    color={executionStatus.status === 'failed' ? 'error' : 'primary'}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {`${Math.round(executionStatus.progress)}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2">
                Execution time: {formatExecutionTime(executionStatus.startTime, executionStatus.endTime)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Node execution statuses */}
      <Typography variant="h6" gutterBottom>Node Execution Status</Typography>
      <Grid container spacing={2}>
        {Object.values(executionStatus.nodeStatuses).map((nodeStatus) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={nodeStatus.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {nodeStatus.name}
                  </Typography>
                  {getStatusIcon(nodeStatus.status)}
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Type: {nodeStatus.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: <span style={{ color: getStatusColor(nodeStatus.status) }}>
                    {nodeStatus.status.charAt(0).toUpperCase() + nodeStatus.status.slice(1)}
                  </span>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Execution: {formatExecutionTime(nodeStatus.startTime, nodeStatus.endTime)}
                </Typography>
                {nodeStatus.error && (
                  <Typography variant="body2" color="error">
                    Error: {nodeStatus.error}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default WorkflowMonitor;
