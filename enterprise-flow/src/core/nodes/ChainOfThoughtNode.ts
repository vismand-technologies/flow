import type { Node } from '../models/types';
import { NodeRegistry } from '../models/NodeRegistry';
import { getErrorMessage } from '../utils/errorHandling';
import { nanoid } from 'nanoid';

/**
 * ChainOfThoughtNode
 * Advanced AI node that implements chain-of-thought reasoning
 * Breaks down complex problems into logical reasoning steps
 * and provides explainable reasoning paths
 */
export class ChainOfThoughtNode implements Node {
  id: string;
  type: string = 'chainOfThought';
  name: string = 'Chain of Thought';
  position: { x: number; y: number } = { x: 0, y: 0 };
  category: string = 'AI Agent';
  description: string = 'Perform step-by-step reasoning to solve complex problems';
  
  data: {
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    [key: string]: any;
  } = {
    inputs: {},
    outputs: {}
  };
  
  inputs: Record<string, any> = {
    prompt: '', // The primary question or problem statement
    context: '', // Additional context for reasoning
    reasoningSteps: 3, // Number of reasoning steps to perform
    reasoningStrategy: 'analytical', // Options: 'analytical', 'creative', 'comparative', 'socratic'
    maxTokens: 500, // Maximum length of output
    includeCritique: true, // Whether to include self-criticism step
    modelName: 'default', // AI model to use
    temperature: 0.7 // Model temperature (creativity)
  };
  
  outputs: Record<string, any> = {
    answer: '', // Final answer or conclusion
    reasoningPath: [], // Step-by-step reasoning path
    confidence: 0, // Confidence in the final answer
    alternatives: [], // Alternative reasoning paths or answers
    error: null
  };
  
  constructor(id: string = nanoid()) {
    this.id = id;
  }
  
  /**
   * Perform chain of thought reasoning process
   */
  async compute(): Promise<Record<string, any>> {
    const prompt = this.inputs.prompt;
    const context = this.inputs.context;
    const reasoningSteps = this.inputs.reasoningSteps;
    const reasoningStrategy = this.inputs.reasoningStrategy;
    const includeCritique = this.inputs.includeCritique;
    
    if (!prompt) {
      return {
        answer: '',
        reasoningPath: [],
        confidence: 0,
        alternatives: [],
        error: 'No prompt provided'
      };
    }
    
    try {
      // In a real implementation, this would call a Large Language Model API
      // to generate the chain of thought reasoning
      
      // Mock implementation for demonstration
      const result = await this.performChainOfThoughtReasoning(
        prompt,
        context,
        reasoningSteps,
        reasoningStrategy,
        includeCritique
      );
      
      return {
        answer: result.answer,
        reasoningPath: result.reasoningPath,
        confidence: result.confidence,
        alternatives: result.alternatives,
        error: null
      };
    } catch (error) {
      return {
        answer: '',
        reasoningPath: [],
        confidence: 0,
        alternatives: [],
        error: getErrorMessage(error, 'Chain of thought reasoning failed')
      };
    }
  }
  
  /**
   * Perform the chain of thought reasoning process
   */
  private async performChainOfThoughtReasoning(
    prompt: string,
    context: string,
    steps: number,
    strategy: string,
    includeCritique: boolean
  ): Promise<any> {
    // Mock implementation - in a real app, this would call an LLM API
    return new Promise(resolve => {
      setTimeout(() => {
        // Generate reasoning steps based on strategy
        const reasoningPath = this.generateReasoningPath(prompt, context, steps, strategy);
        
        // Generate final answer based on reasoning steps
        const answer = this.generateAnswer(reasoningPath);
        
        // Generate alternative paths or answers
        const alternatives = this.generateAlternatives(prompt, strategy);
        
        // Include critique step if requested
        if (includeCritique) {
          reasoningPath.push({
            step: `Self-critique and Verification`,
            reasoning: `Reviewing my reasoning process: The approach taken was ${this.describeCritique(strategy)}. The potential limitations of this conclusion are ${this.describeLimitations(strategy)}. Overall confidence in this reasoning path is ${(0.7 + Math.random() * 0.2).toFixed(2)}.`
          });
        }
        
        resolve({
          answer,
          reasoningPath,
          confidence: 0.7 + Math.random() * 0.25, // Random confidence between 0.7 and 0.95
          alternatives
        });
      }, 800); // Simulate processing time
    });
  }
  
  /**
   * Generate the reasoning path based on the selected strategy
   */
  private generateReasoningPath(
    prompt: string,
    context: string,
    steps: number,
    strategy: string
  ): Array<{ step: string; reasoning: string }> {
    const path: Array<{ step: string; reasoning: string }> = [];
    
    // Strategy-specific reasoning patterns
    const reasoningPatterns: Record<string, string[]> = {
      'analytical': [
        'Define the problem scope',
        'Break down into components',
        'Analyze key relationships',
        'Apply relevant frameworks',
        'Evaluate potential solutions',
        'Synthesize findings'
      ],
      'creative': [
        'Explore multiple perspectives',
        'Generate diverse alternatives',
        'Connect disparate concepts',
        'Imagine hypothetical scenarios',
        'Challenge conventional thinking',
        'Identify novel applications'
      ],
      'comparative': [
        'Establish comparison criteria',
        'Identify relevant alternatives',
        'Assess strengths and weaknesses',
        'Evaluate trade-offs',
        'Consider contextual factors',
        'Rank options systematically'
      ],
      'socratic': [
        'Question assumptions',
        'Clarify concepts and definitions',
        'Examine evidence and reasoning',
        'Consider counter-arguments',
        'Explore implications',
        'Refine understanding'
      ]
    };
    
    // Use the chosen strategy's patterns, or default to analytical
    const patterns = reasoningPatterns[strategy] || reasoningPatterns.analytical;
    
    // Generate reasoning steps (limited by the requested number of steps)
    for (let i = 0; i < Math.min(steps, patterns.length); i++) {
      const stepName = patterns[i];
      
      // Create a reasoning description for this step
      path.push({
        step: `Step ${i + 1}: ${stepName}`,
        reasoning: this.generateReasoningForStep(prompt, context, stepName, strategy)
      });
    }
    
    return path;
  }
  
  /**
   * Generate reasoning text for a specific step
   */
  private generateReasoningForStep(prompt: string, _context: string, _stepName: string, _strategy: string): string {
    // Create a reasoning description based on the step name and strategy
    // In a real implementation, this would be generated by an LLM
    
    // Extract a relevant keyword from the prompt to make the reasoning seem more specific
    const keywords = prompt.split(' ')
      .filter(word => word.length > 4)
      .map(word => word.replace(/[.,?!;:()]/g, ''));
    
    const keyword = keywords.length > 0 
      ? keywords[Math.floor(Math.random() * keywords.length)] 
      : 'concept';
    
    // Create reasoning text templates for each strategy
    const analyticalReasonings = [
      `Examining the ${keyword} within a structured analytical framework reveals several key components that need consideration.`,
      `Breaking down the ${keyword} into its constituent elements shows relationships between factors that weren't initially apparent.`,
      `Applying systematic analysis to the ${keyword} uncovers patterns that suggest specific causal mechanisms at work.`
    ];
    
    const creativeReasonings = [
      `Considering the ${keyword} from multiple unconventional perspectives reveals novel approaches not visible through traditional analysis.`,
      `By connecting the ${keyword} with concepts from different domains, unexpected solution paths emerge.`,
      `Reimagining the fundamental assumptions about ${keyword} opens possibilities for innovative approaches.`
    ];
    
    const comparativeReasonings = [
      `When comparing different aspects of the ${keyword}, we see that certain approaches offer distinct advantages in specific contexts.`,
      `Evaluating the trade-offs between competing interpretations of ${keyword} highlights important contextual considerations.`,
      `Contrasting alternative frameworks for understanding ${keyword} reveals their respective strengths and limitations.`
    ];
    
    const socraticReasonings = [
      `Questioning our initial assumptions about ${keyword} leads us to reconsider the fundamental nature of the problem.`,
      `By examining the evidence supporting our understanding of ${keyword}, we can identify potential logical gaps.`,
      `Considering counter-arguments to our interpretation of ${keyword} strengthens our overall reasoning.`
    ];
    
    // Select reasoning templates based on strategy
    let reasonings: string[] = analyticalReasonings;
    switch (_strategy) {
      case 'creative':
        reasonings = creativeReasonings;
        break;
      case 'comparative':
        reasonings = comparativeReasonings;
        break;
      case 'socratic':
        reasonings = socraticReasonings;
        break;
    }
    
    // Select a random reasoning template
    const baseReasoning = reasonings[Math.floor(Math.random() * reasonings.length)];
    
    // Add a second sentence to make it more substantial
    const followUps = [
      `This insight leads to a deeper understanding of how the underlying factors interact.`,
      `Further examination of this aspect reveals additional nuances worth exploring.`,
      `This perspective provides a foundation for developing a more comprehensive solution.`,
      `Considering the context provided, this observation has significant implications for addressing the core problem.`
    ];
    
    const followUp = followUps[Math.floor(Math.random() * followUps.length)];
    
    return `${baseReasoning} ${followUp}`;
  }
  
  /**
   * Generate a final answer based on reasoning steps
   */
  private generateAnswer(reasoningPath: Array<{ step: string; reasoning: string }>): string {
    if (reasoningPath.length === 0) {
      return 'Insufficient information to reach a conclusion.';
    }
    
    // Extract key phrases from reasoning steps to incorporate into answer
    const phrases = reasoningPath.map(step => {
      const words = step.reasoning.split(' ');
      const startIdx = Math.floor(Math.random() * Math.max(0, words.length - 5));
      return words.slice(startIdx, startIdx + 5).join(' ');
    });
    
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    // Templates for conclusion statements
    const conclusions = [
      `Based on the step-by-step analysis, the optimal approach involves ${randomPhrase} as a key consideration within a comprehensive framework.`,
      `Through this chain-of-thought reasoning process, we can conclude that ${randomPhrase}, which addresses the core aspects of the problem.`,
      `The reasoning steps lead to a clear conclusion: ${randomPhrase} provides the most effective solution given the constraints and context.`,
      `After careful consideration of multiple factors, the evidence supports that ${randomPhrase} offers the most promising direction.`
    ];
    
    return conclusions[Math.floor(Math.random() * conclusions.length)];
  }
  
  /**
   * Generate alternative reasoning paths or answers
   */
  private generateAlternatives(_prompt: string, _strategy: string): string[] {
    // In a real implementation, this would generate actual alternative reasoning paths
    // Here we just create plausible-sounding alternative conclusions
    
    const alternatives = [
      `An alternative approach would consider more emphasis on technological factors while maintaining focus on user experience.`,
      `A different reasoning path might prioritize short-term outcomes while establishing a foundation for long-term solutions.`,
      `Another valid perspective would apply first principles thinking to decompose the problem more fundamentally.`
    ];
    
    // Return 1-2 alternatives
    const numAlternatives = Math.floor(Math.random() * 2) + 1;
    return alternatives.slice(0, numAlternatives);
  }
  
  /**
   * Generate critique text based on strategy
   */
  private describeCritique(strategy: string): string {
    const critiques = {
      'analytical': 'methodical and evidence-based, but may have overlooked creative or unconventional solutions',
      'creative': 'innovative and flexible, but may lack rigorous validation of proposed concepts',
      'comparative': 'balanced and contextual, but may have given insufficient weight to certain criteria',
      'socratic': 'questioning and thorough, but may not have fully resolved all open questions'
    };
    
    return critiques[strategy as keyof typeof critiques] || critiques.analytical;
  }
  
  /**
   * Generate limitations text based on strategy
   */
  private describeLimitations(strategy: string): string {
    const limitations = {
      'analytical': 'potential gaps in available data and the possibility of overlooked systemic factors',
      'creative': 'practical implementation challenges and the need for further validation',
      'comparative': 'subjective weighting of criteria and potential changes in context over time',
      'socratic': 'remaining ambiguities and the need for additional empirical evidence'
    };
    
    return limitations[strategy as keyof typeof limitations] || limitations.analytical;
  }
}

// Register the node with the NodeRegistry
NodeRegistry.getInstance().registerNodeType({
  type: 'chainOfThought',
  name: 'Chain of Thought',
  category: 'AI Agent',
  description: 'Perform step-by-step reasoning to solve complex problems',
  nodeClass: ChainOfThoughtNode,
  inputs: [
    { id: 'prompt', name: 'prompt', type: 'string', direction: 'input', description: 'The primary question or problem statement' },
    { id: 'context', name: 'context', type: 'string', direction: 'input', description: 'Additional context for reasoning', default: '' },
    { id: 'reasoningSteps', name: 'reasoningSteps', type: 'number', direction: 'input', description: 'Number of reasoning steps to perform', default: 3 },
    { 
      id: 'reasoningStrategy',
      name: 'reasoningStrategy', 
      type: 'string', 
      direction: 'input',
      description: 'Reasoning approach to use',
      options: ['analytical', 'creative', 'comparative', 'socratic'],
      default: 'analytical'
    },
    { id: 'maxTokens', name: 'maxTokens', type: 'number', direction: 'input', description: 'Maximum tokens for response', default: 1000 },
    { id: 'includeAlternatives', name: 'includeAlternatives', type: 'boolean', direction: 'input', description: 'Generate alternative reasoning paths', default: true },
    { id: 'temperature', name: 'temperature', type: 'string', direction: 'input', description: 'Creativity level (0.0-1.0)', default: '0.7' },
    { id: 'confidenceThreshold', name: 'confidenceThreshold', type: 'number', direction: 'input', description: 'Minimum confidence score to accept result', default: 0.7 }
  ],
  outputs: [
    { id: 'answer', name: 'answer', type: 'string', direction: 'output', description: 'Final answer or conclusion' },
    { id: 'reasoningPath', name: 'reasoningPath', type: 'array', direction: 'output', description: 'Step-by-step reasoning process' },
    { id: 'confidence', name: 'confidence', type: 'number', direction: 'output', description: 'Confidence score (0-1)' },
    { id: 'alternatives', name: 'alternatives', type: 'array', direction: 'output', description: 'Alternative reasoning paths or answers' },
    { id: 'error', name: 'error', type: 'string', direction: 'output', description: 'Error message if reasoning failed' }
  ],
  icon: 'PsychologyOutlined' // Material UI icon name
});
