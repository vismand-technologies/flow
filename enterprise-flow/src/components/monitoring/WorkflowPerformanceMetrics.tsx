import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
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
  SelectChangeEvent
} from '@mui/material';
import { MonitoringService } from './monitoringService';
import { PerformanceMetrics } from './monitoringTypes';

// Mock charts - in a real implementation, you would use a library like recharts, visx, or nivo
const MockBarChart = ({ data, title, height = 200 }: { data: any[], title: string, height?: number }) => {
  // Find max value for scaling
  const maxValue = Math.max(...data.map(item => typeof item.value === 'number' ? item.value : 0));
  
  return (
    <Box sx={{ height, width: '100%', position: 'relative', mt: 1 }}>
      <Typography variant="subtitle2" gutterBottom>{title}</Typography>
      <Box sx={{ display: 'flex', height: 'calc(100% - 24px)', alignItems: 'flex-end' }}>
        {data.map((item, index) => (
          <Box
            key={index}
            sx={{
              height: `${(item.value / maxValue) * 100}%`,
              width: `${100 / data.length - 2}%`,
              mx: '1%',
              bgcolor: item.color || 'primary.main',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              position: 'relative',
              minHeight: 1
            }}
          >
            <Typography variant="caption" sx={{ position: 'absolute', top: -20 }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', mt: 1, justifyContent: 'space-around' }}>
        {data.map((item, index) => (
          <Typography key={index} variant="caption" sx={{ width: `${100 / data.length}%`, textAlign: 'center' }}>
            {item.label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

const MockLineChart = ({ data, title, height = 200 }: { data: any[], title: string, height?: number }) => {
  return (
    <Box sx={{ height, width: '100%', position: 'relative', mt: 1 }}>
      <Typography variant="subtitle2" gutterBottom>{title}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 'calc(100% - 24px)' }}>
        <Typography variant="body2" color="text.secondary">
          Line chart visualization would be implemented using a charting library
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Data points: {data.length}
        </Typography>
      </Box>
    </Box>
  );
};

interface WorkflowPerformanceMetricsProps {
  workflowId?: string;
}

/**
 * WorkflowPerformanceMetrics
 * Displays performance analytics for workflow executions
 */
const WorkflowPerformanceMetrics: React.FC<WorkflowPerformanceMetricsProps> = ({ workflowId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7d');
  
  // Load performance data
  useEffect(() => {
    const loadPerformanceData = async () => {
      setIsLoading(true);
      try {
        const monitoringService = MonitoringService.getInstance();
        const data = await monitoringService.getPerformanceMetrics(workflowId, timeRange);
        setPerformanceData(data);
      } catch (error) {
        console.error('Error loading performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPerformanceData();
  }, [workflowId, timeRange]);
  
  // Handle time range change
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as string);
  };
  
  // Format duration in a readable way
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // Prepare execution count data for chart
  const prepareExecutionCountData = () => {
    if (!performanceData) return [];
    
    return performanceData.executionCounts.map(item => [
      { 
        label: item.date.split('-').slice(1).join('/'),
        value: item.completed,
        color: '#4CAF50' // green
      },
      { 
        label: item.date.split('-').slice(1).join('/'),
        value: item.failed,
        color: '#F44336' // red
      }
    ]).flat();
  };
  
  // Prepare node execution time data for chart
  const prepareNodeExecutionTimeData = () => {
    if (!performanceData) return [];
    
    return performanceData.executionTimes.map(item => ({
      label: item.nodeType,
      value: item.avgDuration,
      color: '#2196F3' // blue
    }));
  };
  
  // Render time selector
  const renderTimeSelector = () => (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel id="time-range-select-label">Time Range</InputLabel>
      <Select
        labelId="time-range-select-label"
        id="time-range-select"
        value={timeRange}
        label="Time Range"
        onChange={handleTimeRangeChange}
      >
        <MenuItem value="1d">Last 24 Hours</MenuItem>
        <MenuItem value="7d">Last 7 Days</MenuItem>
        <MenuItem value="30d">Last 30 Days</MenuItem>
        <MenuItem value="90d">Last 90 Days</MenuItem>
      </Select>
    </FormControl>
  );
  
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Performance Analytics</Typography>
        {renderTimeSelector()}
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ p: 2 }}>
          {/* Execution Count Over Time */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Execution Volume
                </Typography>
                <MockBarChart 
                  data={prepareExecutionCountData()}
                  title="Daily Executions" 
                  height={250}
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Node Execution Times */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Node Performance
                </Typography>
                <MockBarChart
                  data={prepareNodeExecutionTimeData()}
                  title="Average Execution Time by Node Type"
                  height={250}
                />
              </CardContent>
            </Card>
          </Grid>
          
          {/* Error Rates Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Error Analysis
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Node Type</TableCell>
                        <TableCell align="right">Error Rate</TableCell>
                        <TableCell align="right">Error Count</TableCell>
                        <TableCell align="right">Risk Level</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceData?.errorRates.map((item, index) => {
                        // Determine risk level
                        let riskLevel: 'low' | 'medium' | 'high' = 'low';
                        let chipColor: 'success' | 'warning' | 'error' = 'success';
                        
                        if (item.errorRate > 0.05) {
                          riskLevel = 'high';
                          chipColor = 'error';
                        } else if (item.errorRate > 0.01) {
                          riskLevel = 'medium';
                          chipColor = 'warning';
                        }
                        
                        return (
                          <TableRow key={index}>
                            <TableCell component="th" scope="row">
                              {item.nodeType}
                            </TableCell>
                            <TableCell align="right">
                              {(item.errorRate * 100).toFixed(2)}%
                            </TableCell>
                            <TableCell align="right">{item.count}</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={riskLevel} 
                                color={chipColor} 
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
          </Grid>
          
          {/* Performance Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Insights
                </Typography>
                <Stack spacing={2}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Node Performance</Typography>
                    <Typography variant="body2" gutterBottom>
                      AI nodes (DocumentProcessor, ChainOfThought) have the highest average execution times,
                      while control flow nodes (Loop, StateMachine) are more efficient.
                    </Typography>
                    <Typography variant="body2">
                      Consider optimizing AI prompt templates or using cached results where appropriate.
                    </Typography>
                  </Paper>
                  
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Error Hotspots</Typography>
                    <Typography variant="body2">
                      {performanceData?.errorRates.some(item => item.errorRate > 0.05)
                        ? 'Some nodes have high error rates that should be addressed.'
                        : 'No critical error hotspots detected in the current time period.'}
                    </Typography>
                  </Paper>
                  
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Usage Trends</Typography>
                    <Typography variant="body2">
                      {performanceData?.executionCounts && 
                        `Average of ${
                          Math.round(
                            performanceData.executionCounts.reduce(
                              (acc, item) => acc + item.total, 0
                            ) / performanceData.executionCounts.length
                          )
                        } workflow executions per day.`}
                    </Typography>
                  </Paper>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default WorkflowPerformanceMetrics;
