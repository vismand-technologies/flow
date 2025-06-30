import React, { useState } from 'react';
import './App.css';
import WorkflowCanvas from './components/canvas/WorkflowCanvas';
import NodePalette from './components/sidebar/NodePalette';
import NodeConfigPanel from './components/nodes/NodeConfigPanel';
import WorkflowMonitor from './components/monitoring/WorkflowMonitor';
import WorkflowVersioning from './components/versioning/WorkflowVersioning';
import { useSelector } from 'react-redux';
import type { RootState } from './core/store/index';
import { Box, Tabs, Tab, Typography, Button, IconButton } from '@mui/material';

// Material UI icon imports - Install @mui/icons-material if needed
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import CodeIcon from '@mui/icons-material/Code';
import HistoryIcon from '@mui/icons-material/History';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SettingsIcon from '@mui/icons-material/Settings';

// Interface for sidebar tabs
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel component for sidebar content
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sidebar-tabpanel-${index}`}
      aria-labelledby={`sidebar-tab-${index}`}
      style={{ height: '100%', overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Enhanced toolbar with modern UI
const Toolbar: React.FC = () => {
  return (
    <Box
      sx={{
        height: '60px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        backgroundColor: '#f8f9fa',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography
          variant="h6"
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '20px', 
            marginRight: '24px',
            color: '#3f51b5',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <CodeIcon sx={{ mr: 1 }} />
          Enterprise AI Workflow Designer
        </Typography>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          sx={{ mr: 1 }}
        >
          New
        </Button>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<SaveIcon />}
          sx={{ mr: 1 }}
        >
          Save
        </Button>
        
        <Button
          variant="contained"
          size="small"
          color="primary"
          startIcon={<PlayArrowIcon />}
        >
          Run Workflow
        </Button>
      </Box>
      
      <Box>
        <IconButton size="small" sx={{ ml: 1 }}>
          <HistoryIcon />
        </IconButton>
        <IconButton size="small" sx={{ ml: 1 }}>
          <SettingsIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  // State for sidebar tabs
  const [sidebarTab, setSidebarTab] = useState(0);
  // State for right panel tabs
  const [rightPanelTab, setRightPanelTab] = useState(0);
  // Get selected node ID from store (using selectedNodeIds if it's an array)
  const selectedNodeId = useSelector((state: RootState) => {
    // If selectedNodeIds is an array, get the first one, otherwise return null
    const selectedNodes = state.workflow.selectedNodeIds;
    return selectedNodes && selectedNodes.length > 0 ? selectedNodes[0] : null;
  });

  const handleSidebarTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSidebarTab(newValue);
  };

  const handleRightPanelTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setRightPanelTab(newValue);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: '#f5f5f7'
      }}
    >
      <Toolbar />
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden'
        }}
      >
        {/* Left sidebar with tabs */}
        <Box
          sx={{
            width: '280px',
            height: '100%',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#ffffff',
          }}
        >
          <Tabs
            value={sidebarTab}
            onChange={handleSidebarTabChange}
            aria-label="sidebar tabs"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              minHeight: '48px',
              '& .MuiTab-root': { minHeight: '48px' }
            }}
          >
            <Tab icon={<AddIcon />} iconPosition="start" label="Nodes" />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="Versions" />
          </Tabs>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <TabPanel value={sidebarTab} index={0}>
              <NodePalette />
            </TabPanel>
            <TabPanel value={sidebarTab} index={1}>
              <WorkflowVersioning />
            </TabPanel>
          </Box>
        </Box>
        
        {/* Main canvas area */}
        <Box
          sx={{
            flex: 1,
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              flex: 1,
              position: 'relative',
              bgcolor: '#fafafa'
            }}
          >
            <WorkflowCanvas />
          </Box>
        </Box>
        
        {/* Right panel with tabs */}
        <Box
          sx={{
            width: '320px',
            height: '100%',
            borderLeft: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#ffffff'
          }}
        >
          <Tabs
            value={rightPanelTab}
            onChange={handleRightPanelTabChange}
            aria-label="right panel tabs"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              minHeight: '48px',
              '& .MuiTab-root': { minHeight: '48px' }
            }}
          >
            <Tab 
              icon={<SettingsIcon />} 
              iconPosition="start" 
              label="Properties" 
              disabled={!selectedNodeId}
            />
            <Tab icon={<MonitorHeartIcon />} iconPosition="start" label="Monitor" />
          </Tabs>
          
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <TabPanel value={rightPanelTab} index={0}>
              <NodeConfigPanel nodeId={selectedNodeId || null} />
            </TabPanel>
            <TabPanel value={rightPanelTab} index={1}>
              <WorkflowMonitor />
            </TabPanel>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
