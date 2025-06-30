import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import type { Node as ReactFlowNode, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../core/store';
import { 
  addConnection, 
  updateNodePosition,
  selectNode,
  clearAllSelections 
} from '../../core/store/workflowSlice';
import { nanoid } from 'nanoid';

// Import our custom node component
import BaseNode from '../nodes/BaseNode';

// Define node types for ReactFlow
const nodeTypes = {
  default: BaseNode,
  // Additional custom node types can be added here as we develop them
};

const WorkflowCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const workflow = useSelector((state: RootState) => state.workflow);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

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
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  return (
    <div style={{ width: '100%', height: '100vh' }} ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
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
      </ReactFlowProvider>
    </div>
  );
};

export default WorkflowCanvas;
