import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../core/store/index';
import { workflowExecutionEngine } from '../../core/execution/WorkflowExecutionEngine';
import type { NodeStatus, WorkflowExecutionStatus } from '../../core/execution/WorkflowExecutionEngine';
import { ExecutionEvents } from '../../core/execution/WorkflowExecutionEngine';
import { Box, Card, CardContent, Typography, CircularProgress, LinearProgress, Button, Stack } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// Using types imported from WorkflowExecutionEngine

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
  const workflow = useSelector((state: RootState) => state.workflow);
  const nodes = useSelector((state: RootState) => state.workflow.nodes);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Subscribe to workflow execution events
  useEffect(() => {
    if (!workflow || !nodes || nodes.length === 0) return;
    
    // Get initial status from engine or create a default one if not available
    const initialStatus = workflowExecutionEngine.getExecutionStatus() || {
      status: 'idle',
      nodeStatuses: {},
      progress: 0
    };
    setExecutionStatus(initialStatus);
    
    // Set up event listeners for real-time updates
    const handleStatusUpdate = (status: WorkflowExecutionStatus) => {
      setExecutionStatus({...status});
    };
    
    const handleWorkflowStart = (status: WorkflowExecutionStatus) => {
      setIsExecuting(true);
      setExecutionStatus({...status});
    };
    
    const handleWorkflowComplete = (status: WorkflowExecutionStatus) => {
      setIsExecuting(false);
      setExecutionStatus({...status});
    };
    
    const handleWorkflowError = (status: WorkflowExecutionStatus) => {
      setIsExecuting(false);
      setExecutionStatus({...status});
    };
    
    // Register event listeners
    workflowExecutionEngine.on(ExecutionEvents.EXECUTION_STATUS, handleStatusUpdate);
    workflowExecutionEngine.on(ExecutionEvents.WORKFLOW_START, handleWorkflowStart);
    workflowExecutionEngine.on(ExecutionEvents.WORKFLOW_COMPLETE, handleWorkflowComplete);
    workflowExecutionEngine.on(ExecutionEvents.WORKFLOW_ERROR, handleWorkflowError);
    
    // Clean up event listeners on unmount
    return () => {
      workflowExecutionEngine.off(ExecutionEvents.EXECUTION_STATUS, handleStatusUpdate);
      workflowExecutionEngine.off(ExecutionEvents.WORKFLOW_START, handleWorkflowStart);
      workflowExecutionEngine.off(ExecutionEvents.WORKFLOW_COMPLETE, handleWorkflowComplete);
      workflowExecutionEngine.off(ExecutionEvents.WORKFLOW_ERROR, handleWorkflowError);
    };
  }, [workflow, nodes]);
  
  // Handle execution button click
  const handleExecuteWorkflow = async () => {
    if (!workflow || isExecuting) return;
    
    try {
      // Load the current workflow into the execution engine
      // Add required metadata for Workflow type compatibility
      const workflowWithMetadata = {
        ...workflow,
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: 'Current User',
          version: '1.0'
        }
      };
      
      workflowExecutionEngine.loadWorkflow(workflowWithMetadata);
      
      // Execute the workflow
      await workflowExecutionEngine.executeWorkflow();
    } catch (error) {
      console.error('Error executing workflow:', error);
    }
  };
  
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Workflow Monitor: {workflow.name}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={handleExecuteWorkflow}
          disabled={isExecuting}
        >
          Execute Workflow
        </Button>
      </Box>
      
      {/* Overall workflow status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }} alignItems="center">
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Typography variant="h6">
                Status: {executionStatus.status.charAt(0).toUpperCase() + executionStatus.status.slice(1)}
              </Typography>
              {executionStatus.error && (
                <Typography color="error">{executionStatus.error}</Typography>
              )}
            </Box>
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
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
            </Box>
          </Stack>
        </CardContent>
      </Card>
      
      {/* Node execution statuses */}
      <Typography variant="h6" gutterBottom>Node Execution Status</Typography>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        {Object.values(executionStatus.nodeStatuses).map((nodeStatus) => (
          <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }} key={nodeStatus.id}>
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
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default WorkflowMonitor;
