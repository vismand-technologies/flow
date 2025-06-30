import { NodeModel } from '../models/NodeModel';
import { FieldType, NodeCategory, FieldDirection } from '../models/types';
import type { Node } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';

/**
 * AI Prompt Node
 * Demonstrates how to implement a custom node type for AI integration
 */
export class AIPromptNode extends NodeModel {
  constructor(data?: any) {
    super(
      'ai_prompt',
      data?.name || 'AI Prompt',
      data?.position || { x: 100, y: 100 },
      data?.id
    );
    
    // Add input fields
    this.addInput('prompt', FieldType.STRING, data?.inputs?.prompt?.value || 'Write a response to:');
    this.addInput('systemContext', FieldType.STRING, data?.inputs?.systemContext?.value || 'You are a helpful AI assistant');
    this.addInput('temperature', FieldType.NUMBER, data?.inputs?.temperature?.value || 0.7);
    
    // Add output fields
    this.addOutput('response', FieldType.STRING, '');
    this.addOutput('tokens', FieldType.NUMBER, 0);
  }

  /**
   * Override compute method to implement custom logic
   * In a real implementation, this would call an AI service API
   */
  compute(): boolean {
    if (!this.isDirty()) {
      return false;
    }
    
    // Get input values
    const prompt = this.getFieldValue('prompt', true) as string;
    const systemContext = this.getFieldValue('systemContext', true) as string;
    const temperature = this.getFieldValue('temperature', true) as number;

    try {
      // In a real implementation, this would be an API call
      // But for demo purposes, we'll generate a mock response synchronously
      const result = this.mockAICall(prompt, systemContext, temperature);
      
      // Set output values
      this.setFieldValue('response', result.text, false);
      this.setFieldValue('tokens', result.tokens, false);
      
      return true;
    } catch (error: any) {
      console.error('Error in AI prompt node:', error);
      this.setFieldValue('response', 'Error: ' + error.message, false);
      this.setFieldValue('tokens', 0, false);
      return false;
    }
  }

  /**
   * Mock AI call - simulates calling an AI service
   * In a real implementation, this would call an actual AI API
   */
  private mockAICall(prompt: string, systemContext: string, temperature: number): { text: string; tokens: number } {
    // Simple mock response generation
    const wordCount = Math.floor(10 + Math.random() * 20 * temperature);
    const words = ['AI', 'workflow', 'enterprise', 'process', 'analysis', 'integration', 'automation', 'data', 'intelligence', 'agent'];
    
    let response = `[System: ${systemContext}]\n\n`;
    response += `Response to: "${prompt}"\n\n`;
    
    // Generate mock response
    for (let i = 0; i < wordCount; i++) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      response += randomWord + ' ';
      
      // Add periods occasionally
      if (i > 0 && i % 8 === 0) {
        response += '. ';
      }
    }
    
    // Calculate mock token count (roughly 4 chars per token)
    const tokens = Math.ceil((prompt.length + response.length) / 4);
    
    return {
      text: response,
      tokens
    };
  }
}

// Register this node type with the NodeRegistry
const registerAIPromptNode = () => {
  const registry = NodeRegistry.getInstance();
  
  registry.registerNodeType({
    type: 'ai_prompt',
    category: NodeCategory.AI_AGENT,
    name: 'AI Prompt',
    description: 'Sends a prompt to an AI model and receives a response',
    // Define input field definitions
    inputs: [
      {
        id: 'prompt',
        name: 'prompt',
        type: FieldType.STRING,
        direction: FieldDirection.INPUT,
        required: true,
        description: 'The prompt to send to the AI model'
      },
      {
        id: 'systemContext',
        name: 'systemContext',
        type: FieldType.STRING,
        direction: FieldDirection.INPUT,
        required: false,
        description: 'System context for the AI model'
      },
      {
        id: 'temperature',
        name: 'temperature',
        type: FieldType.NUMBER,
        direction: FieldDirection.INPUT,
        defaultValue: 0.7,
        description: 'Controls randomness of the response'
      }
    ],
    // Define output field definitions
    outputs: [
      {
        id: 'response',
        name: 'response',
        type: FieldType.STRING,
        direction: FieldDirection.OUTPUT,
        description: 'The AI model response'
      },
      {
        id: 'tokens',
        name: 'tokens',
        type: FieldType.NUMBER,
        direction: FieldDirection.OUTPUT,
        description: 'Number of tokens used in the response'
      }
    ],
    initialize: () => {
      // No special initialization needed
    },
    compute: (node: Node) => {
      const aiNode = node as unknown as AIPromptNode;
      if (aiNode instanceof AIPromptNode) {
        aiNode.compute();
      }
    }
  });
};

// Export the registration function
export default registerAIPromptNode;
