import { NodeRegistry } from '../models/NodeRegistry';
import type { Node, Field } from '../models/types';
import { FieldType, FieldDirection, NodeCategory } from '../models/types';
import { nanoid } from 'nanoid';

/**
 * DocumentProcessorNode
 * Advanced AI node for document processing, analysis and extraction
 * Supports various document types and processing operations like OCR, summarization,
 * entity extraction, and document classification
 */
export class DocumentProcessorNode implements Node {
  id: string;
  type: string = 'documentProcessor';
  name: string = 'Document Processor';
  category: string = NodeCategory.AI_AGENT;
  description: string = 'Process documents with AI techniques for extraction and analysis';
  position: { x: number; y: number } = { x: 0, y: 0 };
  data: { [key: string]: any; inputs: Record<string, Field>; outputs: Record<string, Field>; } = {
    inputs: {},
    outputs: {}
  };
  
  // Legacy inputs property, use data.inputs instead
  inputs: Record<string, any> = {
    document: null, // Document content or URL
    documentType: 'text', // Options: 'text', 'pdf', 'image', 'html'
    operation: 'summary', // Options: 'summary', 'entities', 'ocr', 'classify', 'qa', 'translation'
    language: 'en',
    maxLength: 500, // For summary operation
    questionPrompt: '', // For QA operation
    extractionFields: [], // For entity extraction
    translationTarget: 'en', // For translation operation
    modelName: 'default', // AI model to use
    processingOptions: {
      detailedMode: false,
      confidenceThreshold: 0.75
    }
  };
  
  outputs: Record<string, any> = {
    result: null,
    metadata: null,
    confidence: 0,
    processingTime: 0,
    error: null
  };
  
  constructor(id: string = nanoid()) {
    this.id = id;
  }
  
  /**
   * Process the document based on the selected operation
   */
  async compute(): Promise<Record<string, any>> {
    const document = this.inputs.document;
    const operation = this.inputs.operation;
    const documentType = this.inputs.documentType;
    
    if (!document) {
      return {
        result: null,
        metadata: null,
        confidence: 0,
        processingTime: 0,
        error: 'No document provided'
      };
    }
    
    // Track processing time
    const startTime = performance.now();
    
    try {
      // Process document based on operation type
      let result = null;
      let metadata = null;
      let confidence = 0;
      
      switch (operation) {
        case 'summary':
          const response = await this.performSummarization(document, documentType);
          result = response.summary;
          confidence = response.confidence;
          metadata = {
            originalLength: response.originalLength,
            summaryLength: response.summaryLength,
            compressionRatio: response.compressionRatio
          };
          break;
        
        case 'entities':
          const entities = await this.performEntityExtraction(document);
          result = entities.entities;
          confidence = entities.confidence;
          metadata = {
            entityCount: entities.entities.length,
            entityTypes: this.countEntityTypes(entities.entities)
          };
          break;
          
        case 'ocr':
          const ocrResult = await this.performOCR(document);
          result = ocrResult.text;
          confidence = ocrResult.confidence;
          metadata = {
            pageCount: ocrResult.pageCount,
            orientation: ocrResult.orientation,
            resolution: ocrResult.resolution
          };
          break;
          
        case 'classify':
          const classification = await this.performDocumentClassification(document);
          result = classification.categories;
          confidence = classification.confidence;
          metadata = {
            topCategory: classification.categories[0]?.category,
            categoryCount: classification.categories.length,
            modelVersion: classification.modelVersion
          };
          break;
          
        case 'qa':
          const qaResult = await this.performQuestionAnswering(document, this.inputs.questionPrompt);
          result = qaResult.answer;
          confidence = qaResult.confidence;
          metadata = {
            relevantParagraphs: qaResult.relevantParagraphs,
            reasoningSteps: qaResult.reasoningSteps
          };
          break;
          
        case 'translation':
          const translationResult = await this.performTranslation(document, this.inputs.language, this.inputs.translationTarget);
          result = translationResult.translatedText;
          confidence = translationResult.confidence;
          metadata = {
            sourceLanguage: translationResult.detectedLanguage,
            targetLanguage: this.inputs.translationTarget,
            characterCount: translationResult.characterCount
          };
          break;
          
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
      
      const processingTime = performance.now() - startTime;
      
      return {
        result,
        metadata,
        confidence,
        processingTime,
        error: null
      };
    } catch (error: unknown) {
      const processingTime = performance.now() - startTime;
      
      return {
        result: null,
        metadata: null,
        confidence: 0,
        processingTime,
        error: error instanceof Error ? error.message : 'Document processing failed'
      };
    }
  }
  
  /**
   * Perform document summarization
   * In a real implementation, this would call an AI model API
   */
  private async performSummarization(document: string, documentType: string): Promise<any> {
    // Mock implementation - in a real app this would call an AI model API
    return new Promise(resolve => {
      setTimeout(() => {
        // Get document length
        const originalLength = document.length;
        
        // Create a mock summary by taking the first 10% of the document
        // plus some sentences from the middle and end
        let summary = '';
        
        if (documentType === 'text' || documentType === 'html') {
          const firstPart = document.substring(0, Math.min(document.length * 0.1, 200));
          const middlePart = document.substring(
            Math.floor(document.length * 0.4), 
            Math.min(Math.floor(document.length * 0.4) + 100, document.length)
          );
          const lastPart = document.substring(
            Math.max(0, document.length - 100), 
            document.length
          );
          
          summary = `${firstPart}... ${middlePart}... ${lastPart}`.substring(0, this.inputs.maxLength);
        } else {
          summary = `[This is a summary of a ${documentType} document with ${originalLength} characters]`;
        }
        
        resolve({
          summary,
          originalLength,
          summaryLength: summary.length,
          compressionRatio: summary.length / originalLength,
          confidence: 0.82 + Math.random() * 0.15 // Random confidence between 0.82 and 0.97
        });
      }, 500); // Simulate processing time
    });
  }
  
  /**
   * Perform entity extraction
   * In a real implementation, this would call an NER model API
   */
  private async performEntityExtraction(_document: string): Promise<any> {
    // Mock implementation - in a real app this would call an NER API
    return new Promise(resolve => {
      setTimeout(() => {
        // Extract fields specified in inputs or use default ones
        const extractionFields = this.inputs.extractionFields.length > 0 
          ? this.inputs.extractionFields 
          : ['person', 'organization', 'location', 'date'];
        
        const mockEntities = [
          { type: 'person', text: 'John Smith', position: { start: 45, end: 55 }, confidence: 0.94 },
          { type: 'organization', text: 'Acme Corporation', position: { start: 102, end: 117 }, confidence: 0.87 },
          { type: 'location', text: 'San Francisco', position: { start: 200, end: 213 }, confidence: 0.92 },
          { type: 'date', text: 'January 15, 2025', position: { start: 280, end: 296 }, confidence: 0.95 }
        ].filter(entity => extractionFields.includes(entity.type));
        
        resolve({
          entities: mockEntities,
          confidence: 0.89 + Math.random() * 0.08
        });
      }, 700); // Simulate processing time
    });
  }
  
  /**
   * Count entity types for metadata
   */
  private countEntityTypes(entities: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const entity of entities) {
      const type = entity.type;
      counts[type] = (counts[type] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Perform OCR on image or PDF document
   * In a real implementation, this would call an OCR service API
   */
  private async performOCR(document: string): Promise<any> {
    // Mock implementation - in a real app this would call an OCR API
    return new Promise(resolve => {
      setTimeout(() => {
        // For demonstration, we'll assume document is a base64 encoded image or a URL
        const isImage = document.startsWith('data:image') || document.match(/\.(png|jpg|jpeg|tiff|gif|bmp)$/i);
        const isPDF = document.match(/\.(pdf)$/i);
        
        if (!isImage && !isPDF) {
          throw new Error('Document must be an image or PDF for OCR operation');
        }
        
        resolve({
          text: `[OCR extracted text from ${isPDF ? 'PDF' : 'image'} document]`,
          confidence: 0.78 + Math.random() * 0.15,
          pageCount: isPDF ? Math.floor(Math.random() * 5) + 1 : 1,
          orientation: 'portrait',
          resolution: '300dpi'
        });
      }, 1200); // Simulate longer processing time for OCR
    });
  }
  
  /**
   * Perform document classification
   * In a real implementation, this would call a classification model API
   */
  private async performDocumentClassification(_document: string): Promise<any> {
    // Mock implementation - in a real app this would call a classification API
    return new Promise(resolve => {
      setTimeout(() => {
        const confidenceThreshold = this.inputs.processingOptions.confidenceThreshold;
        
        // Generate mock classification results
        const mockCategories = [
          { category: 'Legal Document', confidence: 0.76 + Math.random() * 0.2 },
          { category: 'Financial Report', confidence: 0.65 + Math.random() * 0.2 },
          { category: 'Technical Documentation', confidence: 0.58 + Math.random() * 0.25 },
          { category: 'Marketing Material', confidence: 0.45 + Math.random() * 0.3 }
        ]
        // Sort by confidence and filter by threshold
        .sort((a, b) => b.confidence - a.confidence)
        .filter(category => category.confidence >= confidenceThreshold);
        
        resolve({
          categories: mockCategories,
          confidence: mockCategories.length > 0 ? mockCategories[0].confidence : 0,
          modelVersion: '2.4.1'
        });
      }, 600); // Simulate processing time
    });
  }
  
  /**
   * Perform question answering on a document
   * In a real implementation, this would call a QA model API
   */
  private async performQuestionAnswering(_document: string, question: string): Promise<any> {
    // Mock implementation - in a real app this would call a QA API
    return new Promise(resolve => {
      setTimeout(() => {
        if (!question) {
          throw new Error('Question prompt is required for QA operation');
        }
        
        let answer = '';
        const detailedMode = this.inputs.processingOptions.detailedMode;
        
        // Generate a mock answer based on the question
        if (question.toLowerCase().includes('who')) {
          answer = 'The primary stakeholder mentioned in the document is Sarah Johnson, CEO of Innovatech Systems.';
        } else if (question.toLowerCase().includes('when')) {
          answer = 'According to the document, the project timeline begins on March 15, 2025, with a completion date of November 30, 2025.';
        } else if (question.toLowerCase().includes('how')) {
          answer = 'The process outlined in the document involves three phases: planning (2 months), implementation (5 months), and evaluation (2 months).';
        } else if (question.toLowerCase().includes('why')) {
          answer = 'The document indicates that this initiative was launched in response to changing market conditions and increased competitive pressure in the enterprise AI sector.';
        } else {
          answer = 'Based on the document analysis, the key finding is that the proposed workflow architecture will reduce processing time by approximately 45% while improving accuracy metrics by 30%.';
        }
        
        const reasoningSteps = detailedMode ? [
          'Analyzed document for relevant context',
          'Identified key passages related to the query',
          'Extracted specific entities and relationships',
          'Synthesized information to form comprehensive answer'
        ] : [];
        
        resolve({
          answer,
          confidence: 0.75 + Math.random() * 0.20,
          relevantParagraphs: detailedMode ? 3 : null,
          reasoningSteps
        });
      }, 900); // Simulate processing time
    });
  }
  
  /**
   * Perform document translation
   * In a real implementation, this would call a translation API
   */
  private async performTranslation(document: string, sourceLanguage: string, targetLanguage: string): Promise<any> {
    // Mock implementation - in a real app this would call a translation API
    return new Promise(resolve => {
      setTimeout(() => {
        if (!targetLanguage) {
          throw new Error('Target language is required for translation operation');
        }
        
        // Mock translated text by appending language information
        const translatedText = `[This is the ${document.length < 50 ? document : 'document'} translated from ${sourceLanguage} to ${targetLanguage}]`;
        
        resolve({
          translatedText,
          detectedLanguage: sourceLanguage,
          confidence: 0.85 + Math.random() * 0.13,
          characterCount: document.length
        });
      }, 800); // Simulate processing time
    });
  }
}

// Register the node with the NodeRegistry
NodeRegistry.getInstance().registerNodeType({
  type: 'documentProcessor',
  name: 'Document Processor',
  category: NodeCategory.AI_AGENT,
  description: 'Process documents with AI techniques for extraction and analysis',
  nodeClass: DocumentProcessorNode,
  inputs: [
    { id: 'document', name: 'document', type: FieldType.STRING, direction: FieldDirection.INPUT, description: 'Document content or URL to process' },
    { 
      id: 'documentType',
      name: 'documentType', 
      type: FieldType.STRING, 
      direction: FieldDirection.INPUT,
      description: 'Type of document being processed',
      options: ['text', 'pdf', 'image', 'html'],
      defaultValue: 'text'
    },
    {
      id: 'operation',
      name: 'operation',
      type: FieldType.STRING,
      direction: FieldDirection.INPUT,
      description: 'Processing operation to perform',
      options: ['summary', 'entities', 'ocr', 'classify', 'qa', 'translation'],
      defaultValue: 'summary'
    },
    { id: 'language', name: 'language', type: FieldType.STRING, direction: FieldDirection.INPUT, description: 'Source language code (ISO 639-1)', defaultValue: 'en' },
    { id: 'maxLength', name: 'maxLength', type: FieldType.NUMBER, direction: FieldDirection.INPUT, description: 'Maximum length for summary operation', defaultValue: 500 },
    { id: 'questionPrompt', name: 'questionPrompt', type: FieldType.STRING, direction: FieldDirection.INPUT, description: 'Question for QA operation' },
    { id: 'extractionFields', name: 'extractionFields', type: FieldType.ARRAY, direction: FieldDirection.INPUT, description: 'Entity types to extract', defaultValue: ['person', 'organization', 'location', 'date'] },
    { id: 'translationTarget', name: 'translationTarget', type: FieldType.STRING, direction: FieldDirection.INPUT, description: 'Target language code for translation (ISO 639-1)', defaultValue: 'en' },
    { id: 'modelName', name: 'modelName', type: FieldType.STRING, direction: FieldDirection.INPUT, description: 'Name of AI model to use', defaultValue: 'default' },
    { 
      id: 'processingOptions',
      name: 'processingOptions', 
      type: FieldType.OBJECT, 
      direction: FieldDirection.INPUT,
      description: 'Additional processing options',
      defaultValue: {
        detailedMode: false,
        confidenceThreshold: 0.75
      }
    }
  ],
  outputs: [
    { id: 'result', name: 'result', type: FieldType.ANY, direction: FieldDirection.OUTPUT, description: 'Processing result (varies by operation)' },
    { id: 'metadata', name: 'metadata', type: FieldType.OBJECT, direction: FieldDirection.OUTPUT, description: 'Additional metadata about the processing result' },
    { id: 'confidence', name: 'confidence', type: FieldType.NUMBER, direction: FieldDirection.OUTPUT, description: 'Confidence score of the processing result' },
    { id: 'processingTime', name: 'processingTime', type: FieldType.NUMBER, direction: FieldDirection.OUTPUT, description: 'Processing time in milliseconds' },
    { id: 'error', name: 'error', type: FieldType.STRING, direction: FieldDirection.OUTPUT, description: 'Error message if processing fails' }
  ],
  icon: 'DescriptionOutlined' // Material UI icon name
});
