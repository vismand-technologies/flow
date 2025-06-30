import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { MonitoringService } from './monitoringService';
import type { PerformanceMetrics } from './monitoringTypes';
import TimerIcon from '@mui/icons-material/Timer';
import SpeedIcon from '@mui/icons-material/Speed';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Simple placeholder chart component
const MetricsChart = ({ title, height = 200 }: { title: string, height?: number }) => {
  return (
    <Box sx={{ height, width: '100%', position: 'relative' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{title}</Typography>
      <Box 
        sx={{ 
          height: 'calc(100% - 30px)', 
          width: '100%', 
          background: 'linear-gradient(180deg, rgba(25,118,210,0.2) 0%, rgba(25,118,210,0.05) 100%)',
          borderRadius: 1,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* This is a placeholder for a real chart component */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          width: '100%', 
          height: '40%', 
          background: 'linear-gradient(180deg, rgba(25,118,210,0) 0%, rgba(25,118,210,0.1) 100%)'
        }} />
      </Box>
    </Box>
  );
};

// Format time display for metrics
const formatTimeDisplay = (ms: number | undefined): string => {
  if (ms === undefined) return 'N/A';
  
  if (ms < 1000) {
    return `${ms.toFixed(1)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
};

// Risk level calculation for error rates
const getRiskLevel = (errorRate: number): { level: string; color: string } => {
  if (errorRate >= 0.1) {
    return { level: 'High', color: 'error' };
  } else if (errorRate >= 0.05) {
    return { level: 'Medium', color: 'warning' };
  } else {
    return { level: 'Low', color: 'success' };
  }
};

interface WorkflowPerformanceMetricsProps {
  workflowId?: string;
}

export const WorkflowPerformanceMetrics: React.FC<WorkflowPerformanceMetricsProps> = ({ workflowId }) => {
  // If workflowId is not provided, show a message
  if (!workflowId) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Workflow Performance Metrics</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography color="text.secondary">Please select a workflow to view performance metrics.</Typography>
        </Box>
      </Paper>
    );
  }
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [loading, setLoading] = useState<boolean>(true);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      try {
        const data = await MonitoringService.getInstance().getPerformanceMetrics(workflowId, timeRange);
        setPerformanceData(data);
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
    
    // Set up refresh interval
    const intervalId = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [workflowId, timeRange]);

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  if (loading && !performanceData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Workflow Performance Metrics</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="time-range-select-label">Time Range</InputLabel>
          <Select
            labelId="time-range-select-label"
            id="time-range-select"
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
          >
            <MenuItem value="1h">Last Hour</MenuItem>
            <MenuItem value="6h">Last 6 Hours</MenuItem>
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Stack spacing={3} width="100%">
        {/* Summary Cards */}
        <Box width="100%">
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Box sx={{ width: { xs: '100%', md: '33%' } }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Total Executions
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TimerIcon color="primary" />
                    <Typography variant="h4">
                      {performanceData?.executionCounts ? 
                        performanceData.executionCounts.reduce((sum, item) => sum + item.total, 0) : 0}
                    </Typography>
                  </Stack>
                  <MetricsChart title="Execution Count Over Time" height={120} />
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ width: { xs: '100%', md: '33%' } }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Average Execution Time
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SpeedIcon color="primary" />
                    <Typography variant="h4">
                      {formatTimeDisplay(performanceData?.executionTimes ? 
                        performanceData.executionTimes.reduce((sum, item) => sum + item.avgDuration, 0) / 
                        (performanceData.executionTimes.length || 1) : undefined)}
                    </Typography>
                  </Stack>
                  <MetricsChart title="Execution Time Trend" height={120} />
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ width: { xs: '100%', md: '33%' } }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Error Rate
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ErrorOutlineIcon color="primary" />
                    <Typography variant="h4">
                      {performanceData?.errorRates ? 
                        `${(performanceData.errorRates.reduce((sum, item) => sum + item.errorRate, 0) / 
                        (performanceData.errorRates.length || 1) * 100).toFixed(1)}%` : 
                        'N/A'}
                    </Typography>
                  </Stack>
                  <MetricsChart title="Error Rate Trend" height={120} />
                </CardContent>
              </Card>
            </Box>
          </Stack>
        </Box>

        {/* Node Performance Table */}
        <Box width="100%">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Node Performance</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Node Type</TableCell>
                      <TableCell align="right">Avg. Execution Time</TableCell>
                      <TableCell align="right">Error Rate</TableCell>
                      <TableCell align="right">Risk Level</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performanceData?.errorRates?.map((node, index) => {
                      const { level, color } = getRiskLevel(node.errorRate);
                      // Find matching execution time data
                      const timeData = performanceData.executionTimes.find(t => t.nodeType === node.nodeType);
                      return (
                        <TableRow key={index}>
                          <TableCell>{node.nodeType}</TableCell>
                          <TableCell align="right">{formatTimeDisplay(timeData?.avgDuration)}</TableCell>
                          <TableCell align="right">{(node.errorRate * 100).toFixed(1)}%</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={level} 
                              color={color as "error" | "warning" | "success"} 
                              size="small" 
                              variant="outlined" 
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
          </Box>
          </Stack>
        
    </Paper>
  );
};

export default WorkflowPerformanceMetrics;