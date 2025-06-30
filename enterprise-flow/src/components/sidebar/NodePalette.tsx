import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { nanoid } from 'nanoid';
import { NodeCategory, type NodeCategory as NodeCategoryType } from '../../core/models/types';
import { addNode } from '../../core/store/workflowSlice';
import { NodeRegistry } from '../../core/models/NodeRegistry';
import { Stack, Box, Typography, TextField, InputAdornment, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import './NodePalette.css';

// Interface for node template items in the palette
interface NodeTemplateItem {
  type: string;
  name: string;
  category: NodeCategoryType;
  description: string;
  icon?: string;
}

const NodePalette: React.FC = () => {
  const dispatch = useDispatch();
  const [nodeTemplates, setNodeTemplates] = useState<NodeTemplateItem[]>([]);

  // Load node templates from NodeRegistry on component mount
  useEffect(() => {
    const registry = NodeRegistry.getInstance();
    const registeredNodeDefs = registry.getAllNodeDefinitions();
    
    // Convert registered node definitions to template items
    const templates = registeredNodeDefs.map(nodeDef => ({
      type: nodeDef.type,
      name: nodeDef.name,
      category: nodeDef.category,
      description: nodeDef.description
    }));
    
    // Add hardcoded templates for now (these will be replaced as we implement more nodes)
    const hardcodedTemplates = [
    // Control Flow Nodes
    {
      type: 'if_else',
      name: 'If/Else',
      category: NodeCategory.CONTROL_FLOW,
      description: 'Branch workflow based on a condition',
    },
    {
      type: 'switch',
      name: 'Switch',
      category: NodeCategory.CONTROL_FLOW,
      description: 'Multi-way branching based on value',
    },
    {
      type: 'loop',
      name: 'Loop',
      category: NodeCategory.CONTROL_FLOW,
      description: 'Iterate over a collection',
    },
    
    // Data Processing Nodes
    {
      type: 'transform',
      name: 'Transform',
      category: NodeCategory.DATA_PROCESSING,
      description: 'Apply transforms to data',
    },
    {
      type: 'filter',
      name: 'Filter',
      category: NodeCategory.DATA_PROCESSING,
      description: 'Filter data based on conditions',
    },
    {
      type: 'merge',
      name: 'Merge',
      category: NodeCategory.DATA_PROCESSING,
      description: 'Combine multiple data sources',
    },
    
    // AI Agent Nodes
    {
      type: 'llm_prompt',
      name: 'LLM Prompt',
      category: NodeCategory.AI_AGENT,
      description: 'Send prompt to language model',
    },
    {
      type: 'document_analyzer',
      name: 'Document Analyzer',
      category: NodeCategory.AI_AGENT,
      description: 'Extract information from documents',
    },
    {
      type: 'agent_task',
      name: 'Agent Task',
      category: NodeCategory.AI_AGENT,
      description: 'Define task for AI agent to execute',
    },
    
    // Integration Nodes
    {
      type: 'rest_api',
      name: 'REST API',
      category: NodeCategory.INTEGRATION,
      description: 'Make HTTP requests to external APIs',
    },
    {
      type: 'database',
      name: 'Database',
      category: NodeCategory.INTEGRATION,
      description: 'Query or update a database',
    },
    {
      type: 'webhook',
      name: 'Webhook',
      category: NodeCategory.INTEGRATION,
      description: 'Create or consume webhooks',
    },
    
    // Business Process Nodes
    {
      type: 'approval',
      name: 'Approval',
      category: NodeCategory.BUSINESS_PROCESS,
      description: 'Request human approval to proceed',
    },
    {
      type: 'notification',
      name: 'Notification',
      category: NodeCategory.BUSINESS_PROCESS,
      description: 'Send notifications to users',
    },
    {
      type: 'scheduler',
      name: 'Scheduler',
      category: NodeCategory.BUSINESS_PROCESS,
      description: 'Schedule workflow execution',
    }
  ];

  // Filter out any hardcoded templates that are already registered by type
  const registeredTypes = new Set(templates.map(t => t.type));
  const filteredHardcoded = hardcodedTemplates.filter(t => !registeredTypes.has(t.type));
  
  // Combine registered nodes with non-duplicate hardcoded ones
  const allTemplates = [...templates, ...filteredHardcoded];
  setNodeTemplates(allTemplates);
  }, []);
  
  // Initialize templatesByCategory
  const [templatesByCategory, setTemplatesByCategory] = useState<Record<NodeCategoryType, NodeTemplateItem[]>>({
    [NodeCategory.CONTROL_FLOW]: [],
    [NodeCategory.DATA_PROCESSING]: [],
    [NodeCategory.AI_AGENT]: [],
    [NodeCategory.INTEGRATION]: [],
    [NodeCategory.BUSINESS_PROCESS]: [],
  });

  // Organize templates by category
  useEffect(() => {
    const categorized: Record<NodeCategoryType, NodeTemplateItem[]> = {
      [NodeCategory.CONTROL_FLOW]: [],
      [NodeCategory.DATA_PROCESSING]: [],
      [NodeCategory.AI_AGENT]: [],
      [NodeCategory.INTEGRATION]: [],
      [NodeCategory.BUSINESS_PROCESS]: [],
    };
    
    nodeTemplates.forEach(template => {
      if (categorized[template.category]) {
        categorized[template.category].push(template);
      }
    });
    
    setTemplatesByCategory(categorized);
  }, [nodeTemplates]);

  // Handler for adding a new node to the workflow
  const handleAddNode = (template: NodeTemplateItem) => {
    // Create basic inputs/outputs based on node type
    // This is a simplified version - real implementation would use NodeRegistry
    let inputs: Record<string, any> = {};
    let outputs: Record<string, any> = {};

    // Set up default fields based on node type
    switch (template.type) {
      case 'if_else':
        inputs = {
          condition: { id: nanoid(), nodeId: '', name: 'condition', type: 'boolean', value: false, connections: [] },
          'true_value': { id: nanoid(), nodeId: '', name: 'true_value', type: 'any', value: null, connections: [] },
          'false_value': { id: nanoid(), nodeId: '', name: 'false_value', type: 'any', value: null, connections: [] },
        };
        outputs = {
          result: { id: nanoid(), nodeId: '', name: 'result', type: 'any', value: null, connections: [] },
        };
        break;
        
      case 'ai_prompt':
      case 'llm_prompt':
        inputs = {
          prompt: { id: nanoid(), nodeId: '', name: 'prompt', type: 'string', value: '', connections: [] },
          systemContext: { id: nanoid(), nodeId: '', name: 'systemContext', type: 'string', value: 'You are a helpful AI assistant', connections: [] },
          temperature: { id: nanoid(), nodeId: '', name: 'temperature', type: 'number', value: 0.7, connections: [] },
        };
        outputs = {
          response: { id: nanoid(), nodeId: '', name: 'response', type: 'string', value: '', connections: [] },
          tokens: { id: nanoid(), nodeId: '', name: 'tokens', type: 'number', value: 0, connections: [] },
        };
        break;
        
      case 'rest_api':
        inputs = {
          url: { id: nanoid(), nodeId: '', name: 'url', type: 'string', value: '', connections: [] },
          method: { id: nanoid(), nodeId: '', name: 'method', type: 'string', value: 'GET', connections: [] },
          body: { id: nanoid(), nodeId: '', name: 'body', type: 'object', value: null, connections: [] },
        };
        outputs = {
          response: { id: nanoid(), nodeId: '', name: 'response', type: 'object', value: null, connections: [] },
          status: { id: nanoid(), nodeId: '', name: 'status', type: 'number', value: 0, connections: [] },
        };
        break;
        
      // Default fields for other node types
      default:
        inputs = {
          input: { id: nanoid(), nodeId: '', name: 'input', type: 'any', value: null, connections: [] },
        };
        outputs = {
          output: { id: nanoid(), nodeId: '', name: 'output', type: 'any', value: null, connections: [] },
        };
    }

    // Create the new node with position in the center of the viewport
    const newNode = {
      id: nanoid(),
      type: template.type,
      name: template.name,
      position: { x: 250, y: 200 }, // Default position
      data: {
        inputs,
        outputs,
        description: template.description,
      },
    };
    
    // In the future, we'll use the NodeRegistry to create nodes of the correct type
    // For now, we're still using generic node objects

    // Add the node to the workflow state
    dispatch(addNode(newNode));
  };

  // Get the category CSS class name
  const getCategoryClass = (category: string) => {
    // Convert category name to kebab case and lowercase
    return category.toLowerCase().replace(/_/g, '-');
  };

  return (
    <div className="node-palette">
      <Typography variant="h6" component="h3">Workflow Nodes</Typography>
      
      <Box className="search-bar">
        <TextField
          size="small"
          placeholder="Search nodes..."
          fullWidth
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          onChange={() => {
            // We could implement search functionality here
            // For now it's just a visual element
          }}
        />
      </Box>
      
      {Object.entries(templatesByCategory).map(([category, templates]) => (
        <Box key={category} className="node-category">
          <Typography variant="subtitle2" component="h4">{category}</Typography>
          <Stack spacing={1} className="node-list">
            {templates.map(template => (
              <Tooltip 
                key={`${category}-${template.type}`}
                title={template.description}
                placement="right"
                arrow
              >
                <Box 
                  className={`node-item ${getCategoryClass(category)}`}
                  onClick={() => handleAddNode(template)}
                  draggable
                  onDragStart={(event) => {
                    // Store node template data in the drag event
                    event.dataTransfer.setData('application/json', JSON.stringify(template));
                    event.dataTransfer.setData('application/reactflow', JSON.stringify(template));
                    event.dataTransfer.effectAllowed = 'move';

                    // Add a visual element to the drag operation
                    const dragPreview = document.createElement('div');
                    dragPreview.className = 'node-drag-preview';
                    dragPreview.textContent = template.name;
                    document.body.appendChild(dragPreview);
                    
                    // Clean up the preview element after the drag operation
                    setTimeout(() => {
                      document.body.removeChild(dragPreview);
                    }, 0);
                  }}
                >
                  <Typography variant="body2" className="node-title">
                    {template.name}
                  </Typography>
                  <Typography variant="caption" className="node-description">
                    {template.description.length > 60 
                      ? `${template.description.substring(0, 60)}...` 
                      : template.description}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Stack>
        </Box>
      ))}
    </div>
  );
};

export default NodePalette;
