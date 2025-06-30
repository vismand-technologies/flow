import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type { Node, Connection, Workflow, NodeUpdate } from '../models/types';

interface WorkflowState {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  connections: Connection[];
  selectedNodeIds: string[];
  selectedConnectionIds: string[];
  isDirty: boolean;
  lastSaved: string | null;
}

const initialState: WorkflowState = {
  id: nanoid(),
  name: 'New Workflow',
  description: '',
  nodes: [],
  connections: [],
  selectedNodeIds: [],
  selectedConnectionIds: [],
  isDirty: false,
  lastSaved: null,
};

export const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    // Workflow metadata actions
    setWorkflowName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
      state.isDirty = true;
    },
    setWorkflowDescription: (state, action: PayloadAction<string>) => {
      state.description = action.payload;
      state.isDirty = true;
    },
    
    // Node actions
    addNode: (state, action: PayloadAction<Node>) => {
      state.nodes.push(action.payload);
      state.isDirty = true;
    },
    updateNode: (state, action: PayloadAction<Node | NodeUpdate>) => {
      const payload = action.payload;
      const index = state.nodes.findIndex(node => node.id === payload.id);
      
      if (index !== -1) {
        if ('changes' in payload && payload.changes) {
          // Apply partial update using changes property
          state.nodes[index] = {
            ...state.nodes[index],
            ...payload.changes
          };
        } else {
          // Full node replacement (backward compatibility)
          state.nodes[index] = payload as Node;
        }
        state.isDirty = true;
      }
    },
    removeNode: (state, action: PayloadAction<string>) => {
      state.nodes = state.nodes.filter(node => node.id !== action.payload);
      // Also remove any connections to/from this node
      state.connections = state.connections.filter(
        conn => conn.sourceNodeId !== action.payload && conn.targetNodeId !== action.payload
      );
      // Remove from selection if selected
      state.selectedNodeIds = state.selectedNodeIds.filter(id => id !== action.payload);
      state.isDirty = true;
    },
    updateNodePosition: (state, action: PayloadAction<{ id: string; position: { x: number; y: number } }>) => {
      const node = state.nodes.find(node => node.id === action.payload.id);
      if (node) {
        node.position = action.payload.position;
        state.isDirty = true;
      }
    },
    
    // Connection actions
    addConnection: (state, action: PayloadAction<Connection>) => {
      // Check if connection already exists to prevent duplicates
      const exists = state.connections.some(
        conn =>
          conn.sourceNodeId === action.payload.sourceNodeId &&
          conn.sourceFieldId === action.payload.sourceFieldId &&
          conn.targetNodeId === action.payload.targetNodeId &&
          conn.targetFieldId === action.payload.targetFieldId
      );
      
      if (!exists) {
        state.connections.push(action.payload);
        state.isDirty = true;
      }
    },
    removeConnection: (state, action: PayloadAction<string>) => {
      state.connections = state.connections.filter(conn => conn.id !== action.payload);
      // Remove from selection if selected
      state.selectedConnectionIds = state.selectedConnectionIds.filter(id => id !== action.payload);
      state.isDirty = true;
    },
    
    // Selection actions
    selectNode: (state, action: PayloadAction<string>) => {
      if (!state.selectedNodeIds.includes(action.payload)) {
        state.selectedNodeIds.push(action.payload);
      }
    },
    deselectNode: (state, action: PayloadAction<string>) => {
      state.selectedNodeIds = state.selectedNodeIds.filter(id => id !== action.payload);
    },
    clearNodeSelection: (state) => {
      state.selectedNodeIds = [];
    },
    selectConnection: (state, action: PayloadAction<string>) => {
      if (!state.selectedConnectionIds.includes(action.payload)) {
        state.selectedConnectionIds.push(action.payload);
      }
    },
    deselectConnection: (state, action: PayloadAction<string>) => {
      state.selectedConnectionIds = state.selectedConnectionIds.filter(id => id !== action.payload);
    },
    clearConnectionSelection: (state) => {
      state.selectedConnectionIds = [];
    },
    clearAllSelections: (state) => {
      state.selectedNodeIds = [];
      state.selectedConnectionIds = [];
    },
    
    // Field value actions
    setNodeFieldValue: (state, action: PayloadAction<{
      nodeId: string;
      fieldName: string;
      value: any;
      isInput: boolean;
    }>) => {
      const { nodeId, fieldName, value, isInput } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      
      if (node) {
        const fieldCollection = isInput ? node.data.inputs : node.data.outputs;
        if (fieldCollection && fieldCollection[fieldName]) {
          fieldCollection[fieldName].value = value;
          state.isDirty = true;
        }
      }
    },
    
    // Workflow management actions
    loadWorkflow: (state, action: PayloadAction<Workflow>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.description = action.payload.description;
      state.nodes = action.payload.nodes;
      state.connections = action.payload.connections;
      state.selectedNodeIds = [];
      state.selectedConnectionIds = [];
      state.isDirty = false;
      state.lastSaved = new Date().toISOString();
    },
    markSaved: (state) => {
      state.isDirty = false;
      state.lastSaved = new Date().toISOString();
    },
    resetWorkflow: () => {
      return {
        ...initialState,
        id: nanoid(),
      };
    }
  },
});

export const {
  setWorkflowName,
  setWorkflowDescription,
  addNode,
  updateNode,
  removeNode,
  updateNodePosition,
  addConnection,
  removeConnection,
  selectNode,
  deselectNode,
  clearNodeSelection,
  selectConnection,
  deselectConnection,
  clearConnectionSelection,
  clearAllSelections,
  setNodeFieldValue,
  loadWorkflow,
  markSaved,
  resetWorkflow,
} = workflowSlice.actions;

export default workflowSlice.reducer;
