import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../core/store';
// Removing WorkflowSerializer as it's not used
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  // Removing ListItemSecondaryAction as it's not used
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Paper,
  Chip,
  // Removing Grid as it's not used
  Alert,
  Tooltip,
  Stack
} from '@mui/material';
// Adding Material UI icon imports - install these packages if needed
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SaveIcon from '@mui/icons-material/Save';
import type { Workflow } from '../../core/models/types';

interface WorkflowVersion {
  id: string;
  name: string;
  timestamp: string;
  workflowData: string; // Serialized workflow JSON
  notes: string;
  author: string;
  isCurrent: boolean;
  tags: string[];
}

/**
 * WorkflowVersioning component
 * Allows users to manage, compare, and restore workflow versions
 */
const WorkflowVersioning: React.FC = () => {
  // Keep dispatch for future use - uncomment when needed
  // const dispatch = useDispatch();
  // Mock currentWorkflow since it might not exist in store yet
  const currentWorkflow = useSelector((state: RootState) => {
    // Access a workflow property that we know exists or use a mock default
    return state.workflow.nodes?.length > 0 ? {
      name: "My Workflow",
      id: "mock-workflow"
    } : null;
  });
  
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [openCompareDialog, setOpenCompareDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<WorkflowVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<WorkflowVersion | null>(null);
  const [versionDescription, setVersionDescription] = useState('');
  const [versionTags, setVersionTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Mock function to load workflow versions
  // In a real app, this would call an API endpoint or use the WorkflowStorage
  useEffect(() => {
    if (!currentWorkflow) return;
    
    // Mock data for demonstration
    const mockVersions: WorkflowVersion[] = [
      {
        id: 'v1',
        name: `${currentWorkflow.name} - Initial Version`,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        workflowData: JSON.stringify(currentWorkflow),
        notes: 'Initial workflow setup with basic nodes',
        author: 'John Doe',
        isCurrent: false,
        tags: ['initial', 'setup']
      },
      {
        id: 'v2',
        name: `${currentWorkflow.name} - Added API Integration`,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        workflowData: JSON.stringify(currentWorkflow),
        notes: 'Added REST API integration and error handling',
        author: 'Jane Smith',
        isCurrent: false,
        tags: ['api', 'integration']
      },
      {
        id: 'v3',
        name: `${currentWorkflow.name} - Current`,
        timestamp: new Date().toISOString(),
        workflowData: JSON.stringify(currentWorkflow),
        notes: 'Latest version with all features implemented',
        author: 'Current User',
        isCurrent: true,
        tags: ['latest', 'production-ready']
      }
    ];
    
    setVersions(mockVersions);
  }, [currentWorkflow]);
  
  // Format timestamp to readable date
  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Handle version save
  const handleSaveVersion = () => {
    if (!currentWorkflow) return;
    
    // In a real app, this would save the version to backend storage
    const newVersion: WorkflowVersion = {
      id: `v${versions.length + 1}`,
      name: `${currentWorkflow.name} - ${versionDescription || 'Untitled Version'}`,
      timestamp: new Date().toISOString(),
      workflowData: JSON.stringify(currentWorkflow),
      notes: versionDescription,
      author: 'Current User',
      isCurrent: true,
      tags: [...versionTags]
    };
    
    // Mark previous current version as non-current
    const updatedVersions = versions.map(v => ({
      ...v,
      isCurrent: false
    }));
    
    // Add new version
    setVersions([...updatedVersions, newVersion]);
    setOpenSaveDialog(false);
    setVersionDescription('');
    setVersionTags([]);
  };
  
  // Handle version restore
  const handleRestoreVersion = (version: WorkflowVersion) => {
    try {
      // Parse the serialized workflow data
      const workflow = JSON.parse(version.workflowData) as Workflow;
      
      // In a real app, this would dispatch an action to update the current workflow
      console.log('Restoring workflow:', workflow);
      
      // Update current version indicator
      const updatedVersions = versions.map(v => ({
        ...v,
        isCurrent: v.id === version.id
      }));
      
      setVersions(updatedVersions);
      
      // Show success message
      alert(`Restored workflow version: ${version.name}`);
    } catch (error) {
      console.error('Failed to restore workflow version:', error);
      alert('Failed to restore workflow version');
    }
  };
  
  // Handle version deletion
  const handleDeleteVersion = (version: WorkflowVersion) => {
    // Don't allow deleting the current version
    if (version.isCurrent) {
      alert('Cannot delete the current version');
      return;
    }
    
    // Remove version from list
    const updatedVersions = versions.filter(v => v.id !== version.id);
    setVersions(updatedVersions);
  };
  
  // Handle comparing versions
  const handleCompareVersions = () => {
    if (!selectedVersion || !compareVersion) return;
    
    // In a real app, this would show a diff view of the two versions
    setOpenCompareDialog(false);
    
    // Mock implementation - just show what's being compared
    alert(`Comparing versions:\n- ${selectedVersion.name}\n- ${compareVersion.name}`);
  };
  
  // Add a new tag
  const handleAddTag = () => {
    if (!newTag.trim() || versionTags.includes(newTag.trim())) return;
    
    setVersionTags([...versionTags, newTag.trim()]);
    setNewTag('');
  };
  
  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setVersionTags(versionTags.filter(tag => tag !== tagToRemove));
  };

  if (!currentWorkflow) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">No active workflow</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          Workflow Version History
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => setOpenSaveDialog(true)}
        >
          Save Version
        </Button>
      </Stack>
      
      {versions.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          No versions saved for this workflow yet. Create your first version to enable version control.
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ mt: 2 }}>
          <List>
            {versions.map((version, index) => (
              <React.Fragment key={version.id}>
                {index > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <Box>
                      <Tooltip title="Compare with another version">
                        <IconButton
                          edge="end"
                          aria-label="compare"
                          onClick={() => {
                            setSelectedVersion(version);
                            setOpenCompareDialog(true);
                          }}
                        >
                          <CompareArrowsIcon />
                        </IconButton>
                      </Tooltip>
                      {!version.isCurrent && (
                        <>
                          <Tooltip title="Restore this version">
                            <IconButton
                              edge="end"
                              aria-label="restore"
                              onClick={() => handleRestoreVersion(version)}
                            >
                              <RestoreIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete this version">
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteVersion(version)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {version.name}
                        {version.isCurrent && (
                          <Chip
                            label="Current"
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" component="span">
                          Created: {formatDate(version.timestamp)} by {version.author}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {version.notes}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {version.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Save Version Dialog */}
      <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)}>
        <DialogTitle>Save Workflow Version</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="version-description"
            label="Version Description"
            fullWidth
            variant="outlined"
            value={versionDescription}
            onChange={(e) => setVersionDescription(e.target.value)}
            placeholder="Describe the changes in this version"
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Version Tags
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                size="small"
                label="Add Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button sx={{ ml: 1 }} onClick={handleAddTag}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1 }}>
              {versionTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSaveDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveVersion}
            variant="contained"
            startIcon={<BookmarkIcon />}
          >
            Save Version
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Compare Versions Dialog */}
      <Dialog open={openCompareDialog} onClose={() => setOpenCompareDialog(false)}>
        <DialogTitle>Compare Workflow Versions</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Selected Version:
          </Typography>
          <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
            <Typography>{selectedVersion?.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedVersion ? formatDate(selectedVersion.timestamp) : ''}
            </Typography>
          </Paper>
          
          <Typography variant="subtitle1" gutterBottom>
            Compare With:
          </Typography>
          <List sx={{ maxHeight: '250px', overflow: 'auto' }}>
            {versions
              .filter(v => v.id !== selectedVersion?.id)
              .map((version) => (
                <ListItem
                  key={version.id}
                  component="div"
                  onClick={() => setCompareVersion(version)}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: compareVersion?.id === version.id ? 'action.selected' : 'inherit'
                  }}
                >
                  <ListItemText
                    primary={version.name}
                    secondary={formatDate(version.timestamp)}
                  />
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompareDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCompareVersions}
            variant="contained"
            color="primary"
            disabled={!compareVersion}
            startIcon={<CompareArrowsIcon />}
          >
            Compare
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowVersioning;
