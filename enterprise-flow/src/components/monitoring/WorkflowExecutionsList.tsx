import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Collapse,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Button,
  CircularProgress,
  Stack
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import { MonitoringService } from './monitoringService';
import { WorkflowExecution, NodeExecution, WorkflowMonitoringFilterOptions } from './monitoringTypes';

// Status chip color mapping
const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  running: 'primary',
  completed: 'success',
  failed: 'error',
  canceled: 'warning',
  paused: 'info',
  pending: 'default',
  skipped: 'default'
};

// Row component for execution tables with expandable details
const ExecutionRow = ({ execution }: { execution: WorkflowExecution }) => {
  const [open, setOpen] = useState(false);
  
  // Format duration in a readable format
  const formatDuration = (durationMs?: number): string => {
    if (!durationMs) return 'N/A';
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = ((durationMs % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  };
  
  // Format date in a readable format
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'N/A';
    
    const date = new Date(dateStr);
    return date.toLocaleString();
  };
  
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            aria-label="expand row"
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {execution.id}
        </TableCell>
        <TableCell>{execution.workflowName}</TableCell>
        <TableCell>{formatDate(execution.startTime)}</TableCell>
        <TableCell>
          <Chip 
            label={execution.status} 
            color={statusColors[execution.status]} 
            size="small" 
            variant="outlined" 
          />
        </TableCell>
        <TableCell>{formatDuration(execution.duration)}</TableCell>
        <TableCell>{execution.initiatedBy}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Node Executions
              </Typography>
              <Table size="small" aria-label="node executions">
                <TableHead>
                  <TableRow>
                    <TableCell>Node Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {execution.nodeExecutions.map((nodeExec) => (
                    <TableRow key={nodeExec.id}>
                      <TableCell>{nodeExec.nodeName}</TableCell>
                      <TableCell>{nodeExec.nodeType}</TableCell>
                      <TableCell>
                        <Chip 
                          label={nodeExec.status} 
                          color={statusColors[nodeExec.status]} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDate(nodeExec.startTime)}</TableCell>
                      <TableCell>{formatDuration(nodeExec.duration)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {execution.error && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#FFF4F4', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="error">Error</Typography>
                  <Typography variant="body2">{execution.error.message}</Typography>
                  {execution.error.nodeId && (
                    <Typography variant="caption">
                      Node: {execution.error.nodeId}
                    </Typography>
                  )}
                </Box>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Execution Metrics
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Typography variant="body2">
                    Nodes: {execution.metrics.completedNodes}/{execution.metrics.totalNodes}
                  </Typography>
                  <Typography variant="body2">
                    Avg Node Time: {formatDuration(execution.metrics.avgNodeDuration)}
                  </Typography>
                  <Typography variant="body2">
                    Failed Nodes: {execution.metrics.failedNodes}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

interface WorkflowExecutionsListProps {
  workflowId?: string;
}

/**
 * WorkflowExecutionsList
 * Displays historical workflow executions with filtering and pagination
 */
const WorkflowExecutionsList: React.FC<WorkflowExecutionsListProps> = ({ workflowId }) => {
  // State for executions data and pagination
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<WorkflowMonitoringFilterOptions>({
    status: [],
    initiatedBy: [],
    search: ''
  });
  
  // Load execution data
  const loadExecutions = async () => {
    setIsLoading(true);
    try {
      const monitoringService = MonitoringService.getInstance();
      const executionData = await monitoringService.getExecutions({
        ...filters,
        ...(workflowId ? { workflowId } : {})
      });
      setExecutions(executionData);
    } catch (error) {
      console.error('Error loading execution data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on initial render and when filters change
  useEffect(() => {
    loadExecutions();
  }, [workflowId, filters]);
  
  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle filter changes
  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFilters(prev => ({ 
      ...prev, 
      status: typeof value === 'string' ? [value as any] : value as any[]
    }));
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: event.target.value }));
  };
  
  const clearFilters = () => {
    setFilters({
      status: [],
      initiatedBy: [],
      search: ''
    });
  };
  
  return (
    <Paper sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Workflow Execution History</Typography>
        <Box>
          <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
            <FilterListIcon />
          </IconButton>
          <IconButton onClick={loadExecutions}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      <Collapse in={showFilters}>
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField 
              label="Search" 
              variant="outlined"
              size="small"
              value={filters.search}
              onChange={handleSearchChange}
              sx={{ flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                multiple
                value={filters.status || []}
                onChange={handleStatusChange}
                label="Status"
              >
                <MenuItem value="running">Running</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="canceled">Canceled</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Stack>
        </Box>
      </Collapse>
      
      <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table stickyHeader aria-label="workflow executions table">
            <TableHead>
              <TableRow>
                <TableCell style={{ width: 50 }} />
                <TableCell>Execution ID</TableCell>
                <TableCell>Workflow</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Initiated By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {executions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((execution) => (
                  <ExecutionRow key={execution.id} execution={execution} />
                ))}
              {executions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No execution data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={executions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default WorkflowExecutionsList;
