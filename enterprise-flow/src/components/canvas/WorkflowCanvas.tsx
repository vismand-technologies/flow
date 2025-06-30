import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider, 
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import type {
  Connection,
  Edge,
  Node as ReactFlowNode,
  ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../core/store';
import { 
  addConnection, 
  updateNodePosition,
  selectNode,
  clearAllSelections,
  addNode,
  removeNode
} from '../../core/store/workflowSlice';
import { nanoid } from 'nanoid';

// Import our custom node component
import BaseNode from '../nodes/BaseNode';

// Custom node components (defined outside component to avoid recreation)

const WorkflowCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const workflow = useSelector((state: RootState) => state.workflow);
  
  // Memoize nodeTypes to prevent recreation on each render
  const nodeTypes = useMemo(() => ({
    default: BaseNode,
    // Additional custom node types can be added here as we develop them
  }), []);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Store a counter for unique positioning (without depending on nodes before declaration)
  const nodeCountRef = useRef(0);

  // Convert our nodes and connections to ReactFlow format
  const initialNodes: ReactFlowNode[] = workflow.nodes.map(node => ({
    id: node.id,
    type: node.type, // This maps to our custom node types
    position: node.position,
    data: { ...node.data },
  }));

  const initialEdges: Edge[] = workflow.connections.map(connection => ({
    id: connection.id,
    source: connection.sourceNodeId,
    target: connection.targetNodeId,
    sourceHandle: connection.sourceFieldId,
    targetHandle: connection.targetFieldId,
  }));

  // State for ReactFlow nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Sync Redux state changes to ReactFlow
  useEffect(() => {
    const updatedNodes = workflow.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: { ...node.data },
    }));
    setNodes(updatedNodes);
  }, [workflow.nodes, setNodes]);

  // Handle node position changes
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: ReactFlowNode) => {
      dispatch(updateNodePosition({
        id: node.id,
        position: node.position
      }));
    },
    [dispatch]
  );

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      if (
        connection.source &&
        connection.target &&
        connection.sourceHandle &&
        connection.targetHandle
      ) {
        const newConnection = {
          id: nanoid(),
          sourceNodeId: connection.source,
          sourceFieldId: connection.sourceHandle,
          targetNodeId: connection.target,
          targetFieldId: connection.targetHandle,
        };

        dispatch(addConnection(newConnection));
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              id: newConnection.id,
            },
            eds
          )
        );
      }
    },
    [dispatch, setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: ReactFlowNode) => {
      dispatch(selectNode(node.id));
    },
    [dispatch]
  );

  // Handle canvas click (deselect all)
  const onPaneClick = useCallback(() => {
    dispatch(clearAllSelections());
  }, [dispatch]);

  // Handle node deletion
  const onNodesDelete = useCallback((nodesToDelete: ReactFlowNode[]) => {
    nodesToDelete.forEach(node => {
      dispatch(removeNode(node.id));
    });
  }, [dispatch]);

  // Handle dropping nodes from palette onto canvas
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        console.error('React Flow instance or wrapper not initialized');
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      // Try multiple MIME types in case browser compatibility issues
      let dataStr = event.dataTransfer.getData('application/reactflow');
      
      if (!dataStr) {
        console.log('Trying alternative MIME type...');
        dataStr = event.dataTransfer.getData('application/json');
      }
      
      if (!dataStr) {
        // For debugging purposes
        console.error('No data found in drag event');
        const types = event.dataTransfer.types;
        console.log('Available types:', types);
        return;
      }
      
      try {
        const templateData = JSON.parse(dataStr);
        
        // Get position within the canvas where the node was dropped
        // Convert screen coordinates to flow coordinates
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // Set up default fields based on node type (similar to handleAddNode)
        let inputs: Record<string, any> = {};
        let outputs: Record<string, any> = {};

        // Simplified for brevity, reusing logic from NodePalette
        switch (templateData.type) {
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
            
          case 'llm_prompt':
          case 'ai_prompt':
            inputs = {
              prompt: { id: nanoid(), nodeId: '', name: 'prompt', type: 'string', value: '', connections: [] },
              systemContext: { id: nanoid(), nodeId: '', name: 'systemContext', type: 'string', value: 'You are a helpful AI assistant', connections: [] },
            };
            outputs = {
              response: { id: nanoid(), nodeId: '', name: 'response', type: 'string', value: '', connections: [] },
            };
            break;
            
          case 'rest_api':
            inputs = {
              url: { id: nanoid(), nodeId: '', name: 'url', type: 'string', value: '', connections: [] },
              method: { id: nanoid(), nodeId: '', name: 'method', type: 'string', value: 'GET', connections: [] },
            };
            outputs = {
              response: { id: nanoid(), nodeId: '', name: 'response', type: 'object', value: null, connections: [] },
            };
            break;
            
          default:
            inputs = {
              input: { id: nanoid(), nodeId: '', name: 'input', type: 'any', value: null, connections: [] },
            };
            outputs = {
              output: { id: nanoid(), nodeId: '', name: 'output', type: 'any', value: null, connections: [] },
            };
        }

        // Create a new node with a slight offset based on existing nodes
        const newNodeId = nanoid();
        // Construct node according to ReactFlow Node type requirements
        const newNode: ReactFlowNode = {
          id: newNodeId,
          type: templateData.type,
          data: {
            label: templateData.name,
            inputs,
            outputs,
            type: templateData.type,
            expanded: true,
          },
          position,
          // Additional properties required by the Node type
          selected: true,
          dragging: false,
          positionAbsolute: position,
        };

        console.log('Adding new node:', newNode);
        // Create a properly structured node according to our Node interface
        const appNode = {
          id: newNode.id,
          type: newNode.type || 'default', // Ensure type is never undefined
          name: templateData.name || 'Untitled Node', // Required by our Node type
          position: newNode.position,
          // Include both x and y for backward compatibility with legacy code
          x: newNode.position.x,
          y: newNode.position.y,
          data: {
            inputs: inputs,
            outputs: outputs,
            description: templateData.description || '',
          },
          // Include these fields directly as they might be accessed directly
          inputs: inputs,
          outputs: outputs
        };
        
        // Add the node to the Redux store
        dispatch(addNode(appNode));
        
        // Increment node count for future positioning
        nodeCountRef.current += 1;
        
        // Auto-select the new node
        setTimeout(() => {
          const nodeElement = document.getElementById(`node-${newNodeId}`);
          if (nodeElement) {
            nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } catch (error) {
        console.error('Error parsing node template data:', error);
      }
    },
    [dispatch, reactFlowInstance]
  );

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
      }} 
      className="dndflow"
      ref={reactFlowWrapper}
    >
      <ReactFlowProvider>
        <div className="reactflow-wrapper" style={{ width: '100%', height: '100%' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodesDelete={onNodesDelete}
            nodeTypes={nodeTypes}
            fitView
            defaultViewport={{ x: 0, y: 0, zoom: 1.0 }}
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={['Backspace', 'Delete']}
            minZoom={0.2}
            maxZoom={4}
            connectOnClick={false}
            style={{ width: '100%', height: '100%' }}
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-right">
            <div className="workflow-info">
              <h3>{workflow.name}</h3>
              <p>{workflow.description}</p>
            </div>
          </Panel>
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default WorkflowCanvas;
