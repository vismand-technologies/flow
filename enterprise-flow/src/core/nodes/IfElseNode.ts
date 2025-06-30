import { NodeModel } from '../models/NodeModel';
import { FieldType, NodeCategory, FieldDirection } from '../models/types';
import type { Node } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';

/**
 * IfElse Node
 * Implements conditional branching based on a boolean input
 */
export class IfElseNode extends NodeModel {
  constructor(data?: any) {
    super(
      'if_else',
      data?.name || 'If/Else',
      data?.position || { x: 100, y: 100 },
      data?.id
    );
    
    // Add input fields
    this.addInput('condition', FieldType.BOOLEAN, data?.inputs?.condition?.value || false);
    this.addInput('true_value', FieldType.ANY, data?.inputs?.true_value?.value || null);
    this.addInput('false_value', FieldType.ANY, data?.inputs?.false_value?.value || null);
    
    // Add output field
    this.addOutput('result', FieldType.ANY, null);
  }

  /**
   * Override compute method to implement conditional logic
   */
  compute(): boolean {
    if (!this.isDirty()) {
      return false;
    }
    
    // Get input values
    const condition = this.getFieldValue('condition', true) as boolean;
    const trueValue = this.getFieldValue('true_value', true);
    const falseValue = this.getFieldValue('false_value', true);
    
    // Determine which path to follow
    const result = condition ? trueValue : falseValue;
    
    // Set output value
    this.setFieldValue('result', result, false);
    
    return true;
  }
}

// Register this node type with the NodeRegistry
const registerIfElseNode = () => {
  const registry = NodeRegistry.getInstance();
  
  registry.registerNodeType({
    type: 'if_else',
    category: NodeCategory.CONTROL_FLOW,
    name: 'If/Else',
    description: 'Routes flow based on a boolean condition',
    
    // Define input field definitions
    inputs: [
      {
        id: 'condition',
        name: 'condition',
        type: FieldType.BOOLEAN,
        direction: FieldDirection.INPUT,
        required: true,
        description: 'Boolean condition to evaluate'
      },
      {
        id: 'true_value',
        name: 'true_value',
        type: FieldType.ANY,
        direction: FieldDirection.INPUT,
        required: false,
        description: 'Value to output if condition is true'
      },
      {
        id: 'false_value',
        name: 'false_value',
        type: FieldType.ANY,
        direction: FieldDirection.INPUT,
        required: false,
        description: 'Value to output if condition is false'
      }
    ],
    
    // Define output field definitions
    outputs: [
      {
        id: 'result',
        name: 'result',
        type: FieldType.ANY,
        direction: FieldDirection.OUTPUT,
        description: 'Result based on the condition'
      }
    ],
    
    initialize: () => {
      // No special initialization needed
    },
    
    compute: (node: Node) => {
      const ifElseNode = node as unknown as IfElseNode;
      if (ifElseNode instanceof IfElseNode) {
        ifElseNode.compute();
      }
    }
  });
};

export default registerIfElseNode;
