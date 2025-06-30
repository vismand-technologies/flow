import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  FormControlLabel,
  FormGroup,
  Switch,
  Slider,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  Stack,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
// import RefreshIcon from '@mui/icons-material/Refresh'; // Unused import
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';

// Mock settings interface - in a real app, this would be more extensive
interface DashboardSettings {
  refreshInterval: number; // in seconds
  enableRealTimeUpdates: boolean;
  enableAlertNotifications: boolean;
  enableAutoScrolling: boolean;
  maxExecutionsToShow: number;
  defaultTimeRange: string;
  theme: 'light' | 'dark' | 'system';
  alertSeverityLevels: string[];
  preferredVisualizationType: 'bars' | 'lines' | 'pie';
  compactView: boolean;
}

// Default settings 
const defaultSettings: DashboardSettings = {
  refreshInterval: 30,
  enableRealTimeUpdates: true,
  enableAlertNotifications: true,
  enableAutoScrolling: false,
  maxExecutionsToShow: 50,
  defaultTimeRange: '7d',
  theme: 'system',
  alertSeverityLevels: ['error', 'critical'],
  preferredVisualizationType: 'bars',
  compactView: false,
};

interface WorkflowDashboardSettingsProps {
  workflowId?: string;
  onSettingsChange?: (settings: DashboardSettings) => void;
}

/**
 * WorkflowDashboardSettings
 * Allows configuration of monitoring dashboard preferences
 */
const WorkflowDashboardSettings: React.FC<WorkflowDashboardSettingsProps> = ({ 
  workflowId,
  onSettingsChange
}) => {
  // Settings state
  const [settings, setSettings] = useState<DashboardSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would load from API or localStorage
        // For now, we'll use a mock load with slight delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check localStorage for saved settings
        const savedSettings = localStorage.getItem('workflowDashboardSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
        // Reset the changes flag after loading
        setHasChanges(false);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [workflowId]);
  
  // Handle setting changes
  const handleSettingChange = (key: keyof DashboardSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      setHasChanges(true);
      return newSettings;
    });
  };
  
  // Handle multiple severity selection
  const handleSeverityChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    handleSettingChange('alertSeverityLevels', 
      typeof value === 'string' ? value.split(',') : value
    );
  };
  
  // Save settings
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would save to API
      // For now, we'll save to localStorage with a mock delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Save to localStorage
      localStorage.setItem('workflowDashboardSettings', JSON.stringify(settings));
      
      // Notify parent component if callback provided
      if (onSettingsChange) {
        onSettingsChange(settings);
      }
      
      // Show success message and reset changes flag
      setSaveSuccess(true);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset settings to default
  const handleResetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };
  
  // Close success message
  const handleCloseSuccess = () => {
    setSaveSuccess(false);
  };
  
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Dashboard Settings</Typography>
          <Box>
            <Button 
              startIcon={<SaveIcon />}
              variant="contained"
              disabled={!hasChanges || isLoading}
              onClick={handleSaveSettings}
              sx={{ mr: 1 }}
            >
              Save Settings
            </Button>
            <IconButton 
              onClick={handleResetSettings} 
              disabled={isLoading}
              title="Reset to defaults"
            >
              <SettingsBackupRestoreIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Grid container spacing={4}>
          {/* General Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  General Settings
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.enableRealTimeUpdates}
                        onChange={(e) => handleSettingChange('enableRealTimeUpdates', e.target.checked)}
                        disabled={isLoading}
                      />
                    }
                    label="Enable real-time updates"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.enableAlertNotifications}
                        onChange={(e) => handleSettingChange('enableAlertNotifications', e.target.checked)}
                        disabled={isLoading}
                      />
                    }
                    label="Enable alert notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.enableAutoScrolling}
                        onChange={(e) => handleSettingChange('enableAutoScrolling', e.target.checked)}
                        disabled={isLoading}
                      />
                    }
                    label="Auto-scroll to new executions"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.compactView}
                        onChange={(e) => handleSettingChange('compactView', e.target.checked)}
                        disabled={isLoading}
                      />
                    }
                    label="Use compact view"
                  />
                </FormGroup>
                
                <Box sx={{ mt: 3 }}>
                  <Typography id="refresh-interval-slider" gutterBottom>
                    Refresh Interval: {settings.refreshInterval} seconds
                  </Typography>
                  <Slider
                    aria-labelledby="refresh-interval-slider"
                    value={settings.refreshInterval}
                    onChange={(_, value) => handleSettingChange('refreshInterval', value as number)}
                    step={5}
                    marks={[
                      { value: 0, label: 'Off' },
                      { value: 30, label: '30s' },
                      { value: 60, label: '1m' },
                      { value: 300, label: '5m' },
                    ]}
                    min={0}
                    max={300}
                    valueLabelDisplay="auto"
                    disabled={isLoading}
                  />
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Typography id="max-executions-slider" gutterBottom>
                    Max Executions to Display: {settings.maxExecutionsToShow}
                  </Typography>
                  <Slider
                    aria-labelledby="max-executions-slider"
                    value={settings.maxExecutionsToShow}
                    onChange={(_, value) => handleSettingChange('maxExecutionsToShow', value as number)}
                    step={10}
                    marks={[
                      { value: 10, label: '10' },
                      { value: 50, label: '50' },
                      { value: 100, label: '100' },
                      { value: 200, label: '200' },
                    ]}
                    min={10}
                    max={200}
                    valueLabelDisplay="auto"
                    disabled={isLoading}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Display Settings */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Display Settings
                </Typography>
                
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel id="theme-select-label">Theme</InputLabel>
                    <Select
                      labelId="theme-select-label"
                      id="theme-select"
                      value={settings.theme}
                      label="Theme"
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                      disabled={isLoading}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="system">System Default</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel id="time-range-select-label">Default Time Range</InputLabel>
                    <Select
                      labelId="time-range-select-label"
                      id="time-range-select"
                      value={settings.defaultTimeRange}
                      label="Default Time Range"
                      onChange={(e) => handleSettingChange('defaultTimeRange', e.target.value)}
                      disabled={isLoading}
                    >
                      <MenuItem value="1d">Last 24 Hours</MenuItem>
                      <MenuItem value="7d">Last 7 Days</MenuItem>
                      <MenuItem value="30d">Last 30 Days</MenuItem>
                      <MenuItem value="90d">Last 90 Days</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel id="visualization-select-label">Preferred Visualization</InputLabel>
                    <Select
                      labelId="visualization-select-label"
                      id="visualization-select"
                      value={settings.preferredVisualizationType}
                      label="Preferred Visualization"
                      onChange={(e) => handleSettingChange('preferredVisualizationType', e.target.value)}
                      disabled={isLoading}
                    >
                      <MenuItem value="bars">Bar Charts</MenuItem>
                      <MenuItem value="lines">Line Charts</MenuItem>
                      <MenuItem value="pie">Pie Charts</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel id="severity-select-label">Alert Severity Levels</InputLabel>
                    <Select
                      labelId="severity-select-label"
                      id="severity-select"
                      multiple
                      value={settings.alertSeverityLevels}
                      label="Alert Severity Levels"
                      onChange={handleSeverityChange}
                      disabled={isLoading}
                    >
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="warning">Warning</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Custom Settings (for future extension) */}
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Advanced Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  These settings allow for customization of workflow-specific monitoring parameters.
                </Typography>
                
                <TextField
                  label="Custom Metadata Fields"
                  helperText="Comma-separated list of metadata fields to display in execution details"
                  fullWidth
                  variant="outlined"
                  placeholder="e.g., requestId,userId,source"
                  sx={{ mb: 3 }}
                  disabled={isLoading}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 2 }}>
                    Contact administrator for additional custom settings
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Success notification */}
      <Snackbar 
        open={saveSuccess} 
        autoHideDuration={4000} 
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkflowDashboardSettings;
