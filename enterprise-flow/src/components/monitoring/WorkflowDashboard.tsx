import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../core/store';
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Badge
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SettingsIcon from '@mui/icons-material/Settings';

// Import existing workflow monitor
import WorkflowMonitor from './WorkflowMonitor';

// Import monitoring service
import { MonitoringService } from './monitoringService';
import type { MonitoringSummary } from './monitoringTypes';

// Import subcomponents for different dashboard sections
import WorkflowPerformanceMetrics from './WorkflowPerformanceMetrics';
import WorkflowExecutionsList from './WorkflowExecutionsList';
import WorkflowMonitoringAlerts from './WorkflowMonitoringAlerts';
import WorkflowDashboardSettings from './WorkflowDashboardSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workflow-tabpanel-${index}`}
      aria-labelledby={`workflow-tab-${index}`}
      style={{ height: '100%', overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `workflow-tab-${index}`,
    'aria-controls': `workflow-tabpanel-${index}`,
  };
}

interface WorkflowDashboardProps {
  workflowId?: string;
}

/**
 * WorkflowDashboard - Comprehensive monitoring dashboard
 * Combines real-time monitoring with historical analytics
 */
const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({ workflowId }) => {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<MonitoringSummary | null>(null);
  const [previousState, setPreviousState] = useState<{
    summaryData: MonitoringSummary | null;
    originalInterval: number | undefined;
  }>({ summaryData: null, originalInterval: undefined });
  const [refreshInterval, setRefreshInterval] = useState<number | undefined>(30000);
  const workflowName = useSelector((state: RootState) => state.workflow?.name || 'Current Workflow');

  // Update the tab value when it changes
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Reset the refresh interval when switching to settings tab
    // to avoid background refreshes during settings changes
    if (newValue === 4) { // Settings tab
      const originalInterval = refreshInterval;
      setRefreshInterval(undefined);
      
      // Store the original interval to restore when leaving settings
      setPreviousState(prev => ({ ...prev, originalInterval }));
    } else if (previousState.originalInterval && refreshInterval === undefined) {
      // Restore the interval when leaving settings
      setRefreshInterval(previousState.originalInterval);
    }
  };

  // Load summary data
  useEffect(() => {
    const loadSummaryData = async () => {
      setIsLoading(true);
      try {
        const monitoringService = MonitoringService.getInstance();
        const summary = await monitoringService.getMonitoringSummary(workflowId);
        setSummaryData(summary);
      } catch (error) {
        console.error('Error loading monitoring summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSummaryData();
    
    // Refresh data periodically if interval is set
    let intervalId: number | undefined;
    if (refreshInterval) {
      intervalId = window.setInterval(loadSummaryData, refreshInterval);
    }
    
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [workflowId, refreshInterval]);

  // Dashboard Summary Cards
  const renderSummaryCards = () => {
    if (!summaryData) return null;
    
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 3, sm: 3, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {summaryData?.totalExecutions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Executions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" component="div">
                {summaryData.completedExecutions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h4" component="div" color="error">
                {summaryData.failedExecutions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h4" component="div">
                {summaryData.successRate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render Executions List component
  const renderExecutionsList = () => {
    return (
      <WorkflowExecutionsList workflowId={workflowId} />
    );
  };

  // Render Performance Metrics component
  const renderPerformanceMetrics = () => {
    return (
      <WorkflowPerformanceMetrics workflowId={workflowId} />
    );
  };

  // Render Alerts Panel component
  const renderAlertsPanel = () => {
    return (
      <WorkflowMonitoringAlerts workflowId={workflowId} />
    );
  };

  // Render settings/configuration options
  const renderDashboardSettings = () => {
    return (
      <WorkflowDashboardSettings 
        workflowId={workflowId}
        onSettingsChange={(settings) => {
          // Apply settings to the dashboard
          // In a real implementation, this would update global dashboard state
          console.log('Dashboard settings updated:', settings);
          
          // Example: update refresh interval
          if (settings.refreshInterval > 0) {
            setRefreshInterval(settings.refreshInterval * 1000); // Convert to ms
          } else {
            setRefreshInterval(undefined); // Disable auto-refresh
          }
        }}
      />
    );
  };

  // Render Real-time monitoring component
  const renderRealTimeMonitoring = () => {
    return (
      <WorkflowMonitor />
    );
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        boxShadow: 1
      }}>
        <Typography variant="h5" component="h1">
          {workflowName} Dashboard
        </Typography>
      </Box>
      
      {isLoading && !summaryData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {renderSummaryCards()}
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<DashboardIcon />} label="Real-Time" {...a11yProps(0)} />
              <Tab icon={<HistoryIcon />} label="Execution History" {...a11yProps(1)} />
              <Tab icon={<AssessmentIcon />} label="Performance" {...a11yProps(2)} />
              <Tab 
                icon={
                  <Badge badgeContent={summaryData?.alertCount || 0} color="error">
                    <NotificationsActiveIcon />
                  </Badge>
                } 
                label="Alerts" 
                {...a11yProps(3)} 
              />
              <Tab icon={<SettingsIcon />} label="Settings" {...a11yProps(4)} />
            </Tabs>
          </Box>
          
          <Box sx={{ flexGrow: 1, height: 'calc(100% - 100px)', display: 'flex', flexDirection: 'column' }}>
            <TabPanel value={tabValue} index={0}>
              {renderRealTimeMonitoring()}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {renderExecutionsList()}
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              {renderPerformanceMetrics()}
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              {renderAlertsPanel()}
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              {renderDashboardSettings()}
            </TabPanel>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Export the dashboard component
export default WorkflowDashboard;
