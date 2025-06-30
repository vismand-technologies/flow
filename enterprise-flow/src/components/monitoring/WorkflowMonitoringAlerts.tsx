import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
// Alert severity icons
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import { MonitoringService } from './monitoringService';
import type { WorkflowAlert } from './monitoringTypes';

// Map severity to icon and color
const severityMap = {
  info: {
    icon: <InfoIcon />,
    color: 'info'
  },
  warning: {
    icon: <WarningIcon />,
    color: 'warning'
  },
  error: {
    icon: <ErrorIcon />,
    color: 'error'
  },
  critical: {
    icon: <NotificationsActiveIcon />,
    color: 'error'
  }
};

interface AlertItemProps {
  alert: WorkflowAlert;
  onAcknowledge: (alertId: string) => void;
}

/**
 * Individual alert list item component
 */
const AlertItem: React.FC<AlertItemProps> = ({ alert, onAcknowledge }) => {
  // Get color based on severity
  const { color } = severityMap[alert.severity];
  const formattedTime = new Date(alert.timestamp).toLocaleString();
  
  return (
    <ListItem 
      alignItems="flex-start"
      sx={{ 
        mb: 1, 
        bgcolor: alert.acknowledged ? 'transparent' : `${color}.50`,
        borderLeft: 2,
        borderColor: `${color}.main`
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" component="span">
              {alert.message}
            </Typography>
            <Typography 
              variant="body2" 
              component="span" 
              sx={{ ml: 1 }}
            >
              {alert.severity}
            </Typography>
          </Box>
        }
        secondary={
          <>
            <Typography
              component="span"
              variant="body2"
              color="text.primary"
            >
              {formattedTime}
            </Typography>
            {alert.executionId && (
              <>
                {" — "}
                <Typography
                  component="span"
                  variant="body2"
                >
                  Execution: {alert.executionId}
                </Typography>
              </>
            )}
            {alert.nodeId && (
              <>
                {" — "}
                <Typography
                  component="span"
                  variant="body2"
                >
                  Node: {alert.nodeId}
                </Typography>
              </>
            )}
          </>
        }
      />
      <ListItemSecondaryAction>
        {alert.acknowledged ? (
          <Typography 
            variant="body2" 
            component="span" 
            sx={{ ml: 1 }}
          >
            Acknowledged
          </Typography>
        ) : (
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => onAcknowledge(alert.id)}
          >
            Acknowledge
          </Button>
        )}
      </ListItemSecondaryAction>
    </ListItem>
  );
};

interface WorkflowMonitoringAlertsProps {
  workflowId?: string;
}

/**
 * WorkflowMonitoringAlerts
 * Displays workflow alerts and notifications with filtering and acknowledgment capabilities
 */
const WorkflowMonitoringAlerts: React.FC<WorkflowMonitoringAlertsProps> = ({ workflowId }) => {
  const [alerts, setAlerts] = useState<WorkflowAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<WorkflowAlert | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [acknowledgmentFilter, setAcknowledgmentFilter] = useState<string>('all');
  
  // Load alerts
  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const monitoringService = MonitoringService.getInstance();
      let alertsData = await monitoringService.getAlerts(workflowId);
      
      // Apply filters
      if (severityFilter.length > 0) {
        alertsData = alertsData.filter(alert => 
          severityFilter.includes(alert.severity)
        );
      }
      
      if (acknowledgmentFilter !== 'all') {
        const isAcknowledged = acknowledgmentFilter === 'acknowledged';
        alertsData = alertsData.filter(alert => alert.acknowledged === isAcknowledged);
      }
      
      // Sort by timestamp (newest first) and severity
      alertsData.sort((a, b) => {
        // First by severity (critical first)
        const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        
        if (severityDiff !== 0) return severityDiff;
        
        // Then by time (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load alerts on mount and when filters change
  useEffect(() => {
    loadAlerts();
  }, [workflowId, severityFilter, acknowledgmentFilter]);
  
  // Handle alert acknowledgment
  const handleAcknowledge = async (alertId: string) => {
    try {
      const monitoringService = MonitoringService.getInstance();
      await monitoringService.updateAlert(alertId, { acknowledged: true });
      
      // Update local state
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      );
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };
  
  // Handle filter changes
  const handleSeverityFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSeverityFilter(typeof value === 'string' ? [value] : value);
  };
  
  const handleAcknowledgmentFilterChange = (event: SelectChangeEvent<string>) => {
    setAcknowledgmentFilter(event.target.value);
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Alerts & Notifications</Typography>
        <Box>
          <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}>
            <FilterListIcon />
          </IconButton>
          <IconButton onClick={loadAlerts}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      {showFilters && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="severity-filter-label">Severity</InputLabel>
              <Select
                labelId="severity-filter-label"
                id="severity-filter"
                multiple
                value={severityFilter}
                onChange={handleSeverityFilterChange}
                label="Severity"
              >
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="acknowledgment-filter-label">Status</InputLabel>
              <Select
                labelId="acknowledgment-filter-label"
                id="acknowledgment-filter"
                value={acknowledgmentFilter}
                onChange={handleAcknowledgmentFilterChange}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="acknowledged">Acknowledged</MenuItem>
                <MenuItem value="unacknowledged">Unacknowledged</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ flexGrow: 1, overflow: 'auto', mx: 2, mb: 2 }} variant="outlined">
          {alerts.length > 0 ? (
            <List>
              {alerts.map((alert) => (
                <React.Fragment key={alert.id}>
                  <AlertItem alert={alert} onAcknowledge={handleAcknowledge} />
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No alerts found matching the current filters
              </Typography>
            </Box>
          )}
        </Paper>
      )}
      
      {/* Alert Detail Dialog */}
      <Dialog
        open={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        aria-labelledby="alert-dialog-title"
      >
        {selectedAlert && (
          <>
            <DialogTitle id="alert-dialog-title">
              Alert Details
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Message</Typography>
                <Typography variant="body1">{selectedAlert.message}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Severity</Typography>
                <Chip 
                  label={selectedAlert.severity} 
                  color={severityMap[selectedAlert.severity].color as any} 
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Time</Typography>
                <Typography variant="body1">
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </Typography>
              </Box>
              
              {selectedAlert.executionId && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">Execution ID</Typography>
                  <Typography variant="body1">{selectedAlert.executionId}</Typography>
                </Box>
              )}
              
              {selectedAlert.nodeId && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">Node ID</Typography>
                  <Typography variant="body1">{selectedAlert.nodeId}</Typography>
                </Box>
              )}
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Status</Typography>
                <Typography variant="body1">
                  {selectedAlert.acknowledged ? 'Acknowledged' : 'Unacknowledged'}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              {!selectedAlert.acknowledged && (
                <Button
                  onClick={() => {
                    handleAcknowledge(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  color="primary"
                >
                  Acknowledge
                </Button>
              )}
              <Button onClick={() => setSelectedAlert(null)} autoFocus>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default WorkflowMonitoringAlerts;
