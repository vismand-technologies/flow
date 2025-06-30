import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { useDispatch } from 'react-redux';
import { setNodeFieldValue } from '../../core/store/workflowSlice';

// Styling constants for consistent node appearance
const nodeStyles = {
  node: {
    background: '#ffffff',
    border: '1px solid #ddd',
    borderRadius: '5px',
    padding: '10px',
    minWidth: '180px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  header: {
    marginTop: '0',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    padding: '5px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f8f8f8',
    borderRadius: '4px 4px 0 0',
  },
  body: {
    fontSize: '12px',
  },
  field: {
    margin: '5px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative' as const,
    padding: '3px',
  },
  fieldLabel: {
    fontSize: '12px',
    marginRight: '10px',
  },
  fieldValue: {
    fontSize: '12px',
    border: '1px solid #ddd',
    padding: '4px',
    borderRadius: '3px',
    width: '100%',
  },
  inputSection: {
    marginBottom: '10px',
    borderBottom: '1px dashed #eee',
    paddingBottom: '8px',
  },
  outputSection: {
    marginTop: '10px',
    borderTop: '1px dashed #eee',
    paddingTop: '8px',
  },
  sectionHeader: {
    fontSize: '12px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    marginBottom: '5px',
    color: '#555',
  },
};

const BaseNode: React.FC<NodeProps> = ({ data, id, selected }) => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);

  // Convert input fields to array for rendering
  const inputFields = Object.entries(data.inputs || {}).map(([key, field]: [string, any]) => ({
    id: field.id,
    name: key,
    type: field.type,
    value: field.value,
  }));

  // Convert output fields to array for rendering
  const outputFields = Object.entries(data.outputs || {}).map(([key, field]: [string, any]) => ({
    id: field.id,
    name: key,
    type: field.type,
    value: field.value,
  }));

  // Handle field value change
  const handleFieldChange = (fieldName: string, value: any, isInput: boolean) => {
    dispatch(setNodeFieldValue({
      nodeId: id,
      fieldName,
      value,
      isInput,
    }));
  };

  // Render input controls based on field type
  const renderInputControl = (field: { id: string; name: string; type: string; value: any }) => {
    switch (field.type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={!!field.value}
            onChange={(e) => handleFieldChange(field.name, e.target.checked, true)}
            className="field-input"
            style={{ width: 'auto' }}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={field.value || 0}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value), true)}
            className="field-input"
            style={nodeStyles.fieldValue}
          />
        );
      case 'string':
        return (
          <input
            type="text"
            value={field.value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value, true)}
            className="field-input"
            style={nodeStyles.fieldValue}
          />
        );
      default:
        // For complex types, show a simple textual representation
        return <div style={{ ...nodeStyles.fieldValue, background: '#f0f0f0' }}>
          {field.value ? (typeof field.value === 'object' ? 'Object' : String(field.value)) : 'null'}
        </div>;
    }
  };

  return (
    <div
      style={{
        ...nodeStyles.node,
        borderColor: selected ? '#3498db' : '#ddd',
        boxShadow: selected ? '0 0 0 1px #3498db' : nodeStyles.node.boxShadow,
      }}
    >
      {/* Node Header */}
      <div style={nodeStyles.header} onClick={() => setExpanded(!expanded)}>
        {data.name || 'Node'}
        <div style={{ fontSize: '10px', color: '#666' }}>{data.description}</div>
      </div>
      
      {/* Node Body - only shown when expanded */}
      {expanded && (
        <div style={nodeStyles.body}>
          {/* Input Fields Section */}
          {inputFields.length > 0 && (
            <div style={nodeStyles.inputSection}>
              <div style={nodeStyles.sectionHeader}>Inputs</div>
              {inputFields.map((field) => (
                <div key={field.id} style={nodeStyles.field}>
                  {/* Input Handle */}
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={field.id}
                    style={{ background: '#0041d0' }}
                  />
                  <span style={nodeStyles.fieldLabel}>{field.name}:</span>
                  {renderInputControl(field)}
                </div>
              ))}
            </div>
          )}
          
          {/* Output Fields Section */}
          {outputFields.length > 0 && (
            <div style={nodeStyles.outputSection}>
              <div style={nodeStyles.sectionHeader}>Outputs</div>
              {outputFields.map((field) => (
                <div key={field.id} style={nodeStyles.field}>
                  <span style={nodeStyles.fieldLabel}>{field.name}:</span>
                  <div style={{ ...nodeStyles.fieldValue, background: '#f0f0f0' }}>
                    {field.value ? (typeof field.value === 'object' ? 'Object' : String(field.value)) : 'null'}
                  </div>
                  {/* Output Handle */}
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={field.id}
                    style={{ background: '#ff0072' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Always show at least one handle even when collapsed */}
      {!expanded && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            style={{ background: '#0041d0' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            style={{ background: '#ff0072' }}
          />
        </>
      )}
    </div>
  );
};

export default BaseNode;
