import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../core/store/index';
import { updateNode, removeNode } from '../../core/store/workflowSlice';
import { NodeRegistry } from '../../core/models/NodeRegistry';
import { FieldType } from '../../core/models/types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Tooltip,
  IconButton,
  Stack,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import SettingsIcon from '@mui/icons-material/Settings';
import PublishIcon from '@mui/icons-material/Publish';

interface NodeConfigPanelProps {
  nodeId: string | null;
  onClose?: () => void;
}

/**
 * NodeConfigPanel component
 * Advanced UI for customizing node properties and configuration
 */
const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ nodeId, onClose }) => {
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.workflow.nodes);
  const selectedNode = nodes.find(node => node.id === nodeId);
  
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);
  
  // Get node definition from registry if available
  const registry = NodeRegistry.getInstance();
  const nodeDefinition = selectedNode ? registry.getNodeDefinition(selectedNode.type) : null;
  
  // Initialize local values from node data
  useEffect(() => {
    if (selectedNode && selectedNode.data) {
      const initialValues: Record<string, any> = {};
      
      // Extract values from inputs
      if (selectedNode.data.inputs) {
        Object.entries(selectedNode.data.inputs).forEach(([key, field]) => {
          initialValues[key] = (field as any)?.value;
        });
      }
      
      setLocalValues(initialValues);
    }
  }, [selectedNode]);
  
  // Handle field value change
  const handleValueChange = (fieldId: string, value: any) => {
    setLocalValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  // Apply changes to the node
  const applyChanges = () => {
    if (!selectedNode) return;
    
    // Create updated node data
    const updatedData = {
      ...selectedNode.data,
      inputs: { ...selectedNode.data.inputs }
    };
    
    // Update input values
    Object.entries(localValues).forEach(([key, value]) => {
      if (updatedData.inputs[key]) {
        // Update just the value in the existing field object
        const existingField = updatedData.inputs[key] as any;
        if (existingField) {
          existingField.value = value;
        }
      }
    });
    
    // Dispatch the update action
    dispatch(updateNode({
      id: selectedNode.id,
      type: selectedNode.type,
      name: selectedNode.name,
      position: selectedNode.position,
      data: updatedData
    }));
  };
  
  // Render field editor based on field type
  const renderFieldEditor = (fieldId: string, fieldDef: any, value: any) => {
    const fieldType = fieldDef.type;
    
    switch (fieldType) {
      case FieldType.STRING:
        return (
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={value || ''}
            onChange={(e) => handleValueChange(fieldId, e.target.value)}
            margin="dense"
          />
        );
      
      case FieldType.NUMBER:
        return (
          <TextField
            fullWidth
            type="number"
            variant="outlined"
            size="small"
            value={value || 0}
            onChange={(e) => handleValueChange(fieldId, parseFloat(e.target.value) || 0)}
            margin="dense"
          />
        );
      
      case FieldType.BOOLEAN:
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => handleValueChange(fieldId, e.target.checked)}
                color="primary"
              />
            }
            label={value ? "True" : "False"}
          />
        );
      
      case FieldType.OBJECT:
        return (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              size="small"
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : '{}'}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleValueChange(fieldId, parsed);
                } catch (err) {
                  // Don't update on invalid JSON
                }
              }}
              margin="dense"
            />
            <Button 
              size="small" 
              startIcon={<CodeIcon />}
              onClick={() => {
                // Open JSON editor modal in real implementation
                alert('Advanced JSON editor would open here');
              }}
            >
              Edit as JSON
            </Button>
          </Box>
        );
      
      case FieldType.ARRAY:
        return (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              size="small"
              value={Array.isArray(value) ? JSON.stringify(value, null, 2) : '[]'}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  if (Array.isArray(parsed)) {
                    handleValueChange(fieldId, parsed);
                  }
                } catch (err) {
                  // Don't update on invalid JSON
                }
              }}
              margin="dense"
            />
          </Box>
        );
      
      default:
        return (
          <Typography color="error">
            Unsupported field type: {fieldType}
          </Typography>
        );
    }
  };
  
  // Render advanced configuration options
  const renderAdvancedConfig = () => {
    if (!selectedNode) return null;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Advanced Configuration</Typography>
        
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Typography variant="subtitle2">Node Execution</Typography>
          <FormControlLabel
            control={<Switch size="small" />}
            label="Cache Results"
          />
          <FormControlLabel
            control={<Switch size="small" />}
            label="Auto Execute"
          />
        </Paper>
        
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2">Error Handling</Typography>
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>On Error</InputLabel>
            <Select
              value="continue"
              label="On Error"
            >
              <MenuItem value="continue">Continue Workflow</MenuItem>
              <MenuItem value="stop">Stop Workflow</MenuItem>
              <MenuItem value="retry">Retry (3 attempts)</MenuItem>
            </Select>
          </FormControl>
        </Paper>
      </Box>
    );
  };

  // If no node is selected, render empty state
  if (!selectedNode || !nodeDefinition) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle1" color="text.secondary">
            No node selected
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Render the main node configuration panel
  return (
    <Card>
      <CardContent>
        {/* Header with node type and close button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {selectedNode.name || nodeDefinition.name}
          </Typography>
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {nodeDefinition.category} - {nodeDefinition.type}
        </Typography>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Input Parameters
        </Typography>
        
        {/* Input fields based on node definition */}
        {nodeDefinition.inputs.map((input) => (
          <Box key={input.id} sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2">
                {input.name || input.id}
                {input.required && <span style={{ color: 'red' }}>*</span>}
              </Typography>
              {input.description && (
                <Tooltip title={input.description}>
                  <HelpOutlineIcon fontSize="small" color="action" />
                </Tooltip>
              )}
            </Stack>
            
            {renderFieldEditor(
              input.id,
              input,
              localValues[input.id]
            )}
          </Box>
        ))}
        
        {/* Toggle for advanced configuration */}
        <FormControlLabel
          control={
            <Switch
              checked={advancedMode}
              onChange={(e) => setAdvancedMode(e.target.checked)}
            />
          }
          label="Advanced Configuration"
          sx={{ mt: 1 }}
        />
        
        {/* Advanced configuration options */}
        {advancedMode && renderAdvancedConfig()}
        
        {/* Action buttons */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              if (selectedNode) {
                console.log('Deleting node from panel:', selectedNode.id);
                dispatch(removeNode(selectedNode.id));
                // Close the panel after deletion
                if (onClose) onClose();
              }
            }}
          >
            Remove
          </Button>
          <Box>
            <Button
              variant="outlined"
              sx={{ mr: 1 }}
              startIcon={<SettingsIcon />}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={applyChanges}
              startIcon={<PublishIcon />}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NodeConfigPanel;
